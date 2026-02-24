import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

async function migrate() {
    console.log('🚀 Starting migration from JSON to MySQL...');

    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        console.error('❌ data/ directory not found. Nothing to migrate.');
        process.exit(1);
    }

    try {
        // 1. PROJECT
        const projectFile = path.join(DATA_DIR, 'project.json');
        let projectId = 'default';
        let revision = 1;
        if (fs.existsSync(projectFile)) {
            const proj = JSON.parse(fs.readFileSync(projectFile, 'utf-8'));
            projectId = proj.projectId || 'default';
            revision = proj.revision || 1;
        }

        console.log(`📦 Project ID: ${projectId}, Revision: ${revision}`);
        await pool.execute('INSERT IGNORE INTO projects (id, revision) VALUES (?, ?)', [projectId, revision]);
        // Update revision in case it exists but was out of sync
        await pool.execute('UPDATE projects SET revision = ? WHERE id = ?', [revision, projectId]);

        // 2. CONTENTS & HOTSPOTS & MAP SEQUENCES
        const sequencesDir = path.join(DATA_DIR, 'sequences');
        const contentsDir = path.join(DATA_DIR, 'contents');

        let contentToSequence = {};
        if (fs.existsSync(sequencesDir)) {
            const seqFiles = fs.readdirSync(sequencesDir).filter(f => f.endsWith('.json'));
            for (const file of seqFiles) {
                const seq = JSON.parse(fs.readFileSync(path.join(sequencesDir, file), 'utf-8'));
                if (seq.contents && Array.isArray(seq.contents)) {
                    for (const cid of seq.contents) {
                        contentToSequence[cid] = seq.id;
                    }
                }
            }
        }

        if (fs.existsSync(contentsDir)) {
            const files = fs.readdirSync(contentsDir).filter(f => f.endsWith('.json'));
            console.log(`📄 Found ${files.length} contents to migrate.`);

            for (const file of files) {
                const c = JSON.parse(fs.readFileSync(path.join(contentsDir, file), 'utf-8'));

                let htmlValueToSave = c.html || '';

                if (c.type === 'html' && htmlValueToSave && !htmlValueToSave.startsWith('/media/html/')) {
                    const sectionId = contentToSequence[c.id] || 'unassigned';
                    const htmlDir = path.join(__dirname, 'public', 'media', 'html', sectionId);
                    if (!fs.existsSync(htmlDir)) {
                        fs.mkdirSync(htmlDir, { recursive: true });
                    }
                    const htmlFilename = `${c.id}.html`;
                    const htmlFilePath = path.join(htmlDir, htmlFilename);

                    fs.writeFileSync(htmlFilePath, htmlValueToSave, 'utf-8');
                    htmlValueToSave = `/media/html/${sectionId}/${htmlFilename}`;
                }

                // Insert content
                await pool.execute(
                    `INSERT INTO contents (id, project_id, title, type, src, html, allow_scripts) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), type=VALUES(type), src=VALUES(src), html=VALUES(html), allow_scripts=VALUES(allow_scripts)`,
                    [c.id, projectId, c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false]
                );

                // Insert hotspots
                if (c.hotspots && Array.isArray(c.hotspots)) {
                    for (const h of c.hotspots) {
                        await pool.execute(
                            `INSERT INTO hotspots (id, content_id, x, y, width, height, action, target, title, zindex)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height), action=VALUES(action), target=VALUES(target), title=VALUES(title), zindex=VALUES(zindex)`,
                            [h.id, c.id, h.x, h.y, h.width, h.height, h.action, h.target || '', h.title || '', h.zindex || 0]
                        );
                    }
                }
            }
        }

        // 3. SEQUENCES & SEQUENCE_CONTENTS (MAPPING)
        const sequencesDir2 = path.join(DATA_DIR, 'sequences');
        if (fs.existsSync(sequencesDir2)) {
            const files = fs.readdirSync(sequencesDir2).filter(f => f.endsWith('.json'));
            console.log(`🗂️ Found ${files.length} sequences to migrate.`);

            // We need to sort files if they are named sequentially or by ID if we want reproducible ordering
            files.sort();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const seq = JSON.parse(fs.readFileSync(path.join(sequencesDir2, file), 'utf-8'));

                await pool.execute(
                    `INSERT INTO sequences (id, project_id, title, order_index) VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), order_index=VALUES(order_index)`,
                    [seq.id, projectId, seq.title || '', i]
                );

                if (seq.contents && Array.isArray(seq.contents)) {
                    for (let j = 0; j < seq.contents.length; j++) {
                        const contentId = seq.contents[j];
                        await pool.execute(
                            `INSERT IGNORE INTO sequence_contents (sequence_id, content_id, order_index) VALUES (?, ?, ?)`,
                            [seq.id, contentId, j]
                        );
                    }
                }
            }
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        pool.end();
    }
}

migrate();
