const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE ESCALADO
// ==========================================
const CONFIG = {
    fontScale: 1.4,      // Escala para fuentes (rem y px grandes)
    dimScale: 1.3,       // Escala para dimensiones (top, left, width, height, etc)
    minPxToScale: 5,     // No escalar bordes pequeños o offsets insignificantes
    targetMaxWidth: 1200 // Ancho máximo estandarizado para contenedores
};

// ETIQUETA DE SEGURIDAD PARA EVITAR DOBLE ESCALADO
const SCALE_TAG = '<!-- UNITROPICO-SCALED-V1 -->';

const scaleValue = (match, prop, value, unit) => {
    const numericValue = parseFloat(value);

    if (prop === 'font-size') {
        const newValue = unit === 'rem'
            ? parseFloat((numericValue * CONFIG.fontScale).toFixed(2))
            : Math.round(numericValue * CONFIG.fontScale);
        return `${prop}: ${newValue}${unit}`;
    }

    if (numericValue > CONFIG.minPxToScale) {
        const newValue = Math.round(numericValue * CONFIG.dimScale);
        return `${prop}: ${newValue}${unit}`;
    }

    return match;
};

const processHtmlFile = (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');

    // VERIFICACIÓN: Si ya tiene la etiqueta, nos saltamos el archivo
    if (content.includes(SCALE_TAG)) {
        console.log(`[SALTADO] Archivo ya escalado previamente: ${filepath}`);
        return;
    }

    // 1. Escalar font-size y dimensiones
    const regex = /(font-size|width|height|top|left|right|bottom|gap|margin-top|margin-bottom|padding):\s*([\d\.]+)(rem|px)/g;
    content = content.replace(regex, (match, prop, value, unit) => scaleValue(match, prop, value, unit));

    // 2. Normalización de Contenedores y Centrado
    content = content.replace(/margin-left:\s*55px;/g, 'margin: 40px auto;');
    content = content.replace(/padding:\s*0\s+255px\s+0\s+40px;/g, 'padding: 0 40px;');
    content = content.replace(/padding:\s*0\s+\d+px\s+0\s+\d+px;/g, 'padding: 0 40px;');
    content = content.replace(/max-width:\s*\d+px;/g, `max-width: ${CONFIG.targetMaxWidth}px;`);

    // 3. Estandarización de Navbar
    const navbarCss = `.navbar-img {
      width: 100%;
      height: 110px;
      padding: 0;
      margin: 0;
      background: #004b40 url("media/denominacion/navbar.png") no-repeat center right;
      background-size: cover;
      display: block;
    }`;

    if (content.includes('.navbar-img {')) {
        content = content.replace(/\.navbar-img\s*\{[^}]*\}/s, navbarCss);
    } else {
        content = content.replace('</style>', `    ${navbarCss}\n  </style>`);
    }

    const oldNavbarHtml = /<div class="navbar-img">[\s\S]*?<\/div>/g;
    const newNavbarHtml = `<div class="navbar-img">\n    <!-- El fondo se maneja por CSS para ser responsivo -->\n  </div>`;
    content = content.replace(oldNavbarHtml, newNavbarHtml);

    // 4. Corrección de scroll
    content = content.replace(/height:\s*100%;/g, 'min-height: 100%; height: auto;');

    // 5. AGREGAR ETIQUETA DE SEGURIDAD
    if (content.toLowerCase().startsWith('<!doctype html>')) {
        content = content.replace(/<!doctype html>/i, `<!DOCTYPE html>\n${SCALE_TAG}`);
    } else {
        content = `${SCALE_TAG}\n${content}`;
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`[ÉXITO] Archivo escalado: ${filepath}`);
};

const runTarget = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    entries.forEach(entry => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            runTarget(fullPath); // Ahora es recursivo: entra a todas las subcarpetas
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    });
};

// Usar el argumento de la terminal o, por defecto, toda la carpeta media/html
const targetDir = process.argv[2] || path.join(__dirname, '..', 'public', 'media', 'html');
console.log(`\nIniciando escalado en: ${targetDir}\n`);
runTarget(targetDir);
console.log(`\n¡Proceso Finalizado!\n`);
