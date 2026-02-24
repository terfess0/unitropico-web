import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(__dirname, 'insert_datos.sql');

async function generateSQL() {
    console.log('🚀 Generando archivo SQL de migración...');
    let sqlOutput = `
-- --------------------------------------------------------
-- Script de Migración de JSON a MySQL para Unitrópico Web
-- Generado Automáticamente
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS=0;

`;

    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        console.error('❌ Directorio data/ no encontrado. Nada que migrar.');
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

        sqlOutput += `-- Proyectos
INSERT IGNORE INTO projects (id, revision) VALUES ('${escapeSQL(projectId)}', ${revision});
UPDATE projects SET revision = ${revision} WHERE id = '${escapeSQL(projectId)}';\n\n`;

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
            console.log(`📄 Procesando ${files.length} contenidos...`);

            sqlOutput += `-- Contenidos\n`;
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

                const allowScripts = c.allowScripts !== false ? 1 : 0;
                sqlOutput += `INSERT INTO contents (id, project_id, title, type, src, html, allow_scripts) VALUES ('${escapeSQL(c.id)}', '${escapeSQL(projectId)}', '${escapeSQL(c.title || '')}', '${escapeSQL(c.type || 'image')}', '${escapeSQL(c.src || '')}', '${escapeSQL(htmlValueToSave)}', ${allowScripts}) ON DUPLICATE KEY UPDATE title=VALUES(title), type=VALUES(type), src=VALUES(src), html=VALUES(html), allow_scripts=VALUES(allow_scripts);\n`;

                // HOTSPOTS
                if (c.hotspots && Array.isArray(c.hotspots) && c.hotspots.length > 0) {
                    for (const h of c.hotspots) {
                        sqlOutput += `INSERT INTO hotspots (id, content_id, x, y, width, height, action, target, title, zindex) VALUES ('${escapeSQL(h.id)}', '${escapeSQL(c.id)}', ${h.x || 0}, ${h.y || 0}, ${h.width || 0}, ${h.height || 0}, '${escapeSQL(h.action || '')}', '${escapeSQL(h.target || '')}', '${escapeSQL(h.title || '')}', ${h.zindex || 0}) ON DUPLICATE KEY UPDATE x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height), action=VALUES(action), target=VALUES(target), title=VALUES(title), zindex=VALUES(zindex);\n`;
                    }
                }
            }
            sqlOutput += `\n`;
        }

        // 3. SEQUENCES & SEQUENCE_CONTENTS
        const sequencesDir2 = path.join(DATA_DIR, 'sequences');
        if (fs.existsSync(sequencesDir2)) {
            const files = fs.readdirSync(sequencesDir2).filter(f => f.endsWith('.json'));
            console.log(`🗂️ Procesando ${files.length} secuencias...`);

            files.sort();
            sqlOutput += `-- Secuencias\n`;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const seq = JSON.parse(fs.readFileSync(path.join(sequencesDir2, file), 'utf-8'));

                sqlOutput += `INSERT INTO sequences (id, project_id, title, order_index) VALUES ('${escapeSQL(seq.id)}', '${escapeSQL(projectId)}', '${escapeSQL(seq.title || '')}', ${i}) ON DUPLICATE KEY UPDATE title=VALUES(title), order_index=VALUES(order_index);\n`;

                if (seq.contents && Array.isArray(seq.contents)) {
                    for (let j = 0; j < seq.contents.length; j++) {
                        const contentId = seq.contents[j];
                        sqlOutput += `INSERT IGNORE INTO sequence_contents (sequence_id, content_id, order_index) VALUES ('${escapeSQL(seq.id)}', '${escapeSQL(contentId)}', ${j});\n`;
                    }
                }
            }
        }

        sqlOutput += `\nSET FOREIGN_KEY_CHECKS=1;\nCOMMIT;\n`;

        fs.writeFileSync(OUTPUT_FILE, sqlOutput, 'utf-8');
        console.log(`✅ ¡ÉXITO! Archivo SQL generado en: ${OUTPUT_FILE}`);
        console.log(`Sube este archivo insert_datos.sql en tu phpMyAdmin usando la pestaña de "Importar".`);

    } catch (error) {
        console.error('❌ Error generando SQL:', error);
    }
}

function escapeSQL(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "''")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

generateSQL();
