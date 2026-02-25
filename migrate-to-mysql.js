import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const MONOLITHIC_FILE = path.join(DATA_DIR, 'project-config.json.bak'); // Usando el archivo gigante

async function migrate() {
    console.log('🚀 Iniciando migración desde JSON monolítico a MySQL...');

    if (!fs.existsSync(MONOLITHIC_FILE)) {
        console.error(`❌ No se encontró el archivo: ${MONOLITHIC_FILE}`);
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(MONOLITHIC_FILE, 'utf-8');
        const data = JSON.parse(rawData);

        const projectId = data.projectId || 'unitropico-virtual-tour';
        const revision = data.revision || 1;

        console.log(`📦 Proyecto: ${projectId}, Revisión: ${revision}`);

        // 1. Asegurar Proyecto
        await pool.execute(
            'INSERT INTO projects (id, revision) VALUES (?, ?) ON DUPLICATE KEY UPDATE revision = VALUES(revision)',
            [projectId, revision]
        );

        // 2. Mapeo de contenidos a secuencias (para organizar carpetas HTML)
        const contentToSequence = {};
        if (data.sequences && Array.isArray(data.sequences)) {
            for (const seq of data.sequences) {
                if (seq.contents && Array.isArray(seq.contents)) {
                    for (const cid of seq.contents) {
                        contentToSequence[cid] = seq.id;
                    }
                }
            }
        }

        // 3. Procesar CONTENIDOS
        if (data.contents && typeof data.contents === 'object') {
            const contentIds = Object.keys(data.contents);
            console.log(`📄 Migrando ${contentIds.length} contenidos...`);

            for (const id of contentIds) {
                const c = data.contents[id];
                let htmlValueToSave = c.html || '';

                // Extracción automática de HTML a archivos físicos
                if (c.type === 'html' && htmlValueToSave && !htmlValueToSave.startsWith('/media/html/')) {
                    const sectionId = contentToSequence[id] || 'unassigned';
                    const htmlDir = path.join(__dirname, 'public', 'media', 'html', sectionId);

                    if (!fs.existsSync(htmlDir)) {
                        fs.mkdirSync(htmlDir, { recursive: true });
                    }

                    const htmlFilename = `${id}.html`;
                    const htmlFilePath = path.join(htmlDir, htmlFilename);

                    // Guardar el archivo físico
                    fs.writeFileSync(htmlFilePath, htmlValueToSave, 'utf-8');
                    // Cambiar el valor por la ruta para la DB
                    htmlValueToSave = `/media/html/${sectionId}/${htmlFilename}`;
                    console.log(`   ✅ Extraído HTML: ${htmlValueToSave}`);
                }

                // Upsert en MySQL
                await pool.execute(
                    `INSERT INTO contents (id, project_id, title, type, src, html, allow_scripts) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), type=VALUES(type), src=VALUES(src), html=VALUES(html), allow_scripts=VALUES(allow_scripts)`,
                    [id, projectId, c.title || '', c.type || 'image', c.src || '', htmlValueToSave, c.allowScripts !== false]
                );

                // Hotspots del contenido
                if (c.hotspots && Array.isArray(c.hotspots)) {
                    for (const h of c.hotspots) {
                        await pool.execute(
                            `INSERT INTO hotspots (id, content_id, x, y, width, height, action, target, title, zindex)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height), action=VALUES(action), target=VALUES(target), title=VALUES(title), zindex=VALUES(zindex)`,
                            [h.id, id, h.x, h.y, h.width, h.height, h.action, h.target || '', h.title || '', h.zindex || 0]
                        );
                    }
                }
            }
        }

        // 4. Procesar SECUENCIAS
        if (data.sequences && Array.isArray(data.sequences)) {
            console.log(`🗂️ Migrando ${data.sequences.length} secuencias...`);

            for (let i = 0; i < data.sequences.length; i++) {
                const seq = data.sequences[i];

                await pool.execute(
                    `INSERT INTO sequences (id, project_id, title, order_index) VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), order_index=VALUES(order_index)`,
                    [seq.id, projectId, seq.title || '', i]
                );

                // Relación secuencia-contenido
                if (seq.contents && Array.isArray(seq.contents)) {
                    // Limpiar relaciones anteriores para esta secuencia
                    await pool.execute('DELETE FROM sequence_contents WHERE sequence_id = ?', [seq.id]);

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

        console.log('✨ ¡Migración completada con éxito!');
        console.log('📂 Los archivos HTML han sido extraídos a public/media/html/');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
}

migrate();
