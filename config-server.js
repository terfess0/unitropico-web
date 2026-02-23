import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const CONFIG_PATH = path.join(__dirname, 'public', 'project-config.json');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/save-config') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                // Validate JSON before saving
                const config = JSON.parse(body);
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

                console.log('Project config saved successfully at:', CONFIG_PATH);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Configuración guardada correctamente.' }));
            } catch (error) {
                console.error('Error saving config:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Error interno al guardar.' }));
            }
        });
    } else if (req.method === 'GET' && req.url.startsWith('/api/find-asset')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filename = url.searchParams.get('filename');

        if (!filename) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Filename is required' }));
            return;
        }

        const mediaDir = path.join(__dirname, 'public', 'media');

        function findFileRecursive(dir, targetFile) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    const found = findFileRecursive(fullPath, targetFile);
                    if (found) return found;
                } else if (file === targetFile) {
                    return fullPath;
                }
            }
            return null;
        }

        try {
            const absolutePath = findFileRecursive(mediaDir, filename);
            if (absolutePath) {
                // Convert back to web path (relative to public)
                const relativePath = path.relative(path.join(__dirname, 'public'), absolutePath)
                    .replace(/\\/g, '/'); // Ensure forward slashes for URLs

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ path: '/' + relativePath }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ path: '/media/' + filename })); // Fallback
            }
        } catch (error) {
            console.error('Error finding asset:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Config server (No-Dependencies) running at http://localhost:${PORT}`);
    console.log(`Writing to: ${CONFIG_PATH}`);
});
