import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

async function getFullConfig() {
    // 1. Get Project
    const [projects] = await pool.query('SELECT * FROM projects LIMIT 1');
    const project = projects[0] || { id: 'default', revision: 0 };

    // 2. Get Sequences and ordered contents
    const [sequences] = await pool.query('SELECT * FROM sequences ORDER BY order_index ASC');
    const [sequenceContentsMap] = await pool.query('SELECT * FROM sequence_contents ORDER BY sequence_id, order_index ASC');

    // Map contents to sequences
    const seqMap = sequences.map(s => {
        const contentIds = sequenceContentsMap
            .filter(sc => sc.sequence_id === s.id)
            .map(sc => sc.content_id);
        return {
            id: s.id,
            title: s.title,
            contents: contentIds
        };
    });

    // 3. Get Contents
    const [contentsRows] = await pool.query('SELECT * FROM contents');
    const [hotspotsRows] = await pool.query('SELECT * FROM hotspots');

    const contentsMap = {};
    for (const c of contentsRows) {
        c.hotspots = hotspotsRows
            .filter(h => h.content_id === c.id)
            .sort((a, b) => a.zindex - b.zindex);

        c.allowScripts = c.allow_scripts === 1; // MySQL tinyint
        delete c.allow_scripts;
        delete c.project_id;

        // Keep physical HTML file path if applicable, do NOT read the gigantic source code
        if (c.type === 'html' && c.html && c.html.startsWith('/media/html/')) {
            // We consciously leave c.html as the path string instead of reading the file
            // Let the frontend fetch it lazy-loaded when needed to save massive payload size
        }

        // hotspots cleanup
        c.hotspots.forEach(h => {
            delete h.content_id;
        });

        contentsMap[c.id] = c;
    }

    return {
        projectId: project.id,
        revision: project.revision,
        sequences: seqMap,
        contents: contentsMap
    };
}

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // GET /api/config: Read from MySQL
    if (req.method === 'GET' && req.url === '/api/config') {
        try {
            const config = await getFullConfig();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(config));
        } catch (error) {
            console.error('Error joining config from DB:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error reading config' }));
        }
        return;
    }

    // NEW: POST /api/save-content - Save individual content & hotspots
    if (req.method === 'POST' && req.url === '/api/save-content') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                const c = JSON.parse(body);
                const projectId = c.projectId || 'unitropico-virtual-tour';
                const id = c.id;

                if (!id) throw new Error('Missing content ID');

                connection = await pool.getConnection();
                await connection.beginTransaction();

                let htmlValueToSave = c.html || '';

                // HTML File Persistence
                if (c.type === 'html' && htmlValueToSave) {
                    // Try to find sequence ID for folder organization
                    const [seqRows] = await connection.query('SELECT sequence_id FROM sequence_contents WHERE content_id = ? LIMIT 1', [id]);
                    const sectionId = seqRows[0]?.sequence_id || 'unassigned';

                    const htmlDir = path.join(__dirname, 'public', 'media', 'html', sectionId);
                    if (!fs.existsSync(htmlDir)) {
                        fs.mkdirSync(htmlDir, { recursive: true });
                    }
                    const htmlFilename = `${id}.html`;
                    const htmlFilePath = path.join(htmlDir, htmlFilename);

                    if (!htmlValueToSave.startsWith('/media/html/')) {
                        fs.writeFileSync(htmlFilePath, htmlValueToSave, 'utf-8');
                    }
                    htmlValueToSave = `/media/html/${sectionId}/${htmlFilename}`;
                }

                // Update Content
                await connection.execute(
                    `INSERT INTO contents (id, project_id, title, type, src, html, allow_scripts) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title=?, type=?, src=?, html=?, allow_scripts=?`,
                    [
                        id, projectId, c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false,
                        c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false
                    ]
                );

                // Update Hotspots
                await connection.execute('DELETE FROM hotspots WHERE content_id = ?', [id]);
                if (Array.isArray(c.hotspots)) {
                    for (const h of c.hotspots) {
                        await connection.execute(
                            `INSERT INTO hotspots (id, content_id, x, y, width, height, action, target, title, zindex)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [h.id, id, h.x, h.y, h.width, h.height, h.action, h.target || '', h.title || '', h.zindex || 0]
                        );
                    }
                }

                await connection.commit();
                connection.release();

                console.log(`✅ Saved individual content: ${id}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                if (connection) {
                    await connection.rollback();
                    connection.release();
                }
                console.error('Error saving granular content:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }

    // NEW: POST /api/save-sequence - Save sequence order
    if (req.method === 'POST' && req.url === '/api/save-sequence') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                const seq = JSON.parse(body);
                if (!seq.id || !Array.isArray(seq.contents)) throw new Error('Invalid sequence data');

                connection = await pool.getConnection();
                await connection.beginTransaction();

                // Rebuild sequence contents mapping
                await connection.execute('DELETE FROM sequence_contents WHERE sequence_id = ?', [seq.id]);
                for (let j = 0; j < seq.contents.length; j++) {
                    const contentId = seq.contents[j];
                    await connection.execute(
                        'INSERT IGNORE INTO sequence_contents (sequence_id, content_id, order_index) VALUES (?, ?, ?)',
                        [seq.id, contentId, j]
                    );
                }

                await connection.commit();
                connection.release();

                console.log(`✅ Saved sequence order: ${seq.id}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                if (connection) {
                    await connection.rollback();
                    connection.release();
                }
                console.error('Error saving sequence:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }


    // POST /api/save-config: Smart modular save into MySQL
    if (req.method === 'POST' && req.url === '/api/save-config') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            let connection;
            try {
                const incoming = JSON.parse(body);

                // Get current DB revision
                const [projects] = await pool.query('SELECT revision FROM projects WHERE id = ?', [incoming.projectId || 'default']);
                const currentRev = projects[0]?.revision || 0;
                const incomingRev = incoming.revision || 0;

                // 1. Concurrency Check
                if (incomingRev !== 0 && incomingRev < currentRev) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Conflicto: El proyecto fue modificado por otro usuario.' }));
                    return;
                }

                // TRANSACTION
                connection = await pool.getConnection();
                await connection.beginTransaction();

                const newRev = currentRev + 1;
                const projectId = incoming.projectId || 'default';

                // 2. Increment Revision
                await connection.execute(
                    'INSERT INTO projects (id, revision) VALUES (?, ?) ON DUPLICATE KEY UPDATE revision = ?',
                    [projectId, newRev, newRev]
                );

                // 3. Save Sequences
                const contentToSequenceMap = {};
                if (Array.isArray(incoming.sequences)) {
                    for (let i = 0; i < incoming.sequences.length; i++) {
                        const seq = incoming.sequences[i];
                        await connection.execute(
                            'INSERT INTO sequences (id, project_id, title, order_index) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, order_index=?',
                            [seq.id, projectId, seq.title || '', i, seq.title || '', i]
                        );

                        // Delete old sequence contents mapping for this sequence to rebuild
                        await connection.execute('DELETE FROM sequence_contents WHERE sequence_id = ?', [seq.id]);

                        // Insert new mapping
                        if (Array.isArray(seq.contents)) {
                            for (let j = 0; j < seq.contents.length; j++) {
                                const contentId = seq.contents[j];
                                contentToSequenceMap[contentId] = seq.id;
                                await connection.execute(
                                    'INSERT IGNORE INTO sequence_contents (sequence_id, content_id, order_index) VALUES (?, ?, ?)',
                                    [seq.id, contentId, j]
                                );
                            }
                        }
                    }
                }

                // 4. Save Contents
                if (incoming.contents) {
                    for (const [id, c] of Object.entries(incoming.contents)) {
                        let htmlValueToSave = c.html || '';

                        // If it's an HTML content, save the raw code to a .html file inside public/media/html/<sectionId>
                        if (c.type === 'html' && htmlValueToSave) {
                            const sectionId = contentToSequenceMap[id] || 'unassigned';
                            const htmlDir = path.join(__dirname, 'public', 'media', 'html', sectionId);
                            if (!fs.existsSync(htmlDir)) {
                                fs.mkdirSync(htmlDir, { recursive: true });
                            }
                            const htmlFilename = `${id}.html`;
                            const htmlFilePath = path.join(htmlDir, htmlFilename);

                            // Only write if it's the actual raw HTML code, not just a returning path
                            if (!htmlValueToSave.startsWith('/media/html/')) {
                                fs.writeFileSync(htmlFilePath, htmlValueToSave, 'utf-8');
                            }
                            // Store the path in the DB instead of the raw code
                            htmlValueToSave = `/media/html/${sectionId}/${htmlFilename}`;
                        }

                        await connection.execute(
                            `INSERT INTO contents (id, project_id, title, type, src, html, allow_scripts) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE title=?, type=?, src=?, html=?, allow_scripts=?`,
                            [
                                id, projectId, c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false,
                                c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false
                            ]
                        );

                        // Rebuild hotspots
                        if (c.hotspots) {
                            await connection.execute('DELETE FROM hotspots WHERE content_id = ?', [id]);
                            for (const h of c.hotspots) {
                                await connection.execute(
                                    `INSERT INTO hotspots (id, content_id, x, y, width, height, action, target, title, zindex)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [h.id, id, h.x, h.y, h.width, h.height, h.action, h.target || '', h.title || '', h.zindex || 0]
                                );
                            }
                        }
                    }
                }

                // 5. Deletion of orphaned contents
                if (incoming.contents) {
                    const incomingIds = Object.keys(incoming.contents);
                    if (incomingIds.length > 0) {
                        const placeholders = incomingIds.map(() => '?').join(',');
                        await connection.query(`DELETE FROM contents WHERE project_id = ? AND id NOT IN (${placeholders})`, [projectId, ...incomingIds]);
                    }
                }

                await connection.commit();
                connection.release();

                console.log(`Saved Revision ${newRev} to MySQL.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: newRev }));

            } catch (error) {
                if (connection) {
                    await connection.rollback();
                    connection.release();
                }
                console.error('Error saving modular config:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Error interno al guardar en BD' }));
            }
        });
        return;
    }

    // NEW: POST /api/run-batch-scale - Execute the HTML scaling script
    if (req.method === 'POST' && req.url === '/api/run-batch-scale') {
        const { exec } = await import('child_process');

        exec('node scripts/batch_scale.cjs', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing batch scale script:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message, output: stderr }));
                return;
            }
            console.log('Batch scaling executed successfully:\n', stdout);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Escalado completado con éxito', output: stdout }));
        });
        return;
    }

    // Asset Discovery
    if (req.method === 'GET' && req.url.startsWith('/api/find-asset')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filename = url.searchParams.get('filename');
        if (!filename) { res.writeHead(400); res.end(); return; }

        const mediaDir = path.join(__dirname, 'public', 'media');
        function findFileRecursive(dir, targetFile) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                try {
                    if (fs.statSync(fullPath).isDirectory()) {
                        const found = findFileRecursive(fullPath, targetFile);
                        if (found) return found;
                    } else if (file === targetFile) return fullPath;
                } catch (e) { }
            }
            return null;
        }

        try {
            const absPath = findFileRecursive(mediaDir, filename);
            if (absPath) {
                const relPath = path.relative(path.join(__dirname, 'public'), absPath).replace(/\\/g, '/');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ path: '/' + relPath }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ path: '/media/' + filename }));
            }
        } catch (e) {
            res.writeHead(500); res.end();
        }
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`🚀 MySQL Config Server running at http://localhost:${PORT}`);
});
