import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const CONFIG_DIR = path.join(__dirname, 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'project-config.json');

if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Copy existing config from public if it doesn't exist in data
const publicConfigPath = path.join(__dirname, 'public', 'project-config.json');
if (!fs.existsSync(CONFIG_PATH) && fs.existsSync(publicConfigPath)) {
    fs.copyFileSync(publicConfigPath, CONFIG_PATH);
}

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

    if (req.method === 'GET' && req.url === '/api/config') {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(configData);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Config file not found' }));
            }
        } catch (error) {
            console.error('Error reading config:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        return;
    }

    if (req.method === 'POST' && req.url === '/api/save-config') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const incomingConfig = JSON.parse(body);

                // Read current config to check version
                let currentConfig = {};
                if (fs.existsSync(CONFIG_PATH)) {
                    currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
                }

                const currentRevision = currentConfig.revision || 0;
                const incomingRevision = incomingConfig.revision || 0;

                // Optimistic Concurrency Check
                // If the client revision is older than the server revision, reject with 409
                if (incomingRevision !== 0 && incomingRevision < currentRevision) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Error de concurrencia: El archivo ha sido modificado por otro usuario.',
                        latestRevision: currentRevision
                    }));
                    return;
                }

                // Smart Merge:
                // We increment the revision and merge the contents map.
                // For sequences, we take the incoming ones as they define the order.
                const newRevision = Math.max(currentRevision, incomingRevision) + 1;

                const mergedConfig = {
                    ...incomingConfig, // Take incoming as base
                    revision: newRevision,
                    // Ensure we don't accidentally delete contents that might have been added by others
                    // while we were editing (if we only sent a partial update, but currently client sends all)
                    contents: {
                        ...(currentConfig.contents || {}),
                        ...(incomingConfig.contents || {})
                    }
                };

                fs.writeFileSync(CONFIG_PATH, JSON.stringify(mergedConfig, null, 2), 'utf-8');

                console.log('Project config saved successfully (Revision ' + newRevision + ') at:', CONFIG_PATH);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Configuración guardada correctamente.',
                    revision: newRevision
                }));
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
