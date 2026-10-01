import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('⚡ AGENTE DE OPTIMIZACIÓN Y RENDIMIENTO CLICK AGRO');
console.log('====================================================\n');

let suggestions = 0;

function logOpt(type, file, msg) {
  console.log(`  [${type.toUpperCase()}] ${file}: ${msg}`);
  suggestions++;
}

// 1. Auditoría de tamaño de archivos en el repositorio
console.log('1. Auditando peso de archivos estáticos y assets...');
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const relPath = path.relative(rootDir, fullPath);

      if (stats.size > 1024 * 1024) {
        logOpt('alerta-peso', relPath, `Archivo de gran tamaño (${(stats.size / (1024 * 1024)).toFixed(2)} MB). Evaluar compresión o CDN.`);
      } else if (stats.size > 250 * 1024 && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css'))) {
        logOpt('optimizar-código', relPath, `Archivo de código pesado (${sizeKB} KB). Considerar minificación.`);
      }
    }
  }
}
scanDir(rootDir);

// 2. Auditoría de HTML (Render-blocking & Lazy loading)
console.log('\n2. Auditando etiquetas HTML y carga de recursos...');
const htmlFiles = [
  'admin.html',
  'agenda-agro-2027.html',
  'index.html',
  'academia_click_agro_web.html'
];

for (const relPath of htmlFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');

  // Scripts en head sin defer o async
  const headMatch = /<head[\s\S]*?<\/head>/i.exec(content);
  if (headMatch) {
    const headContent = headMatch[0];
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let sMatch;
    while ((sMatch = scriptRegex.exec(headContent)) !== null) {
      const tag = sMatch[0];
      const src = sMatch[1];
      if (!tag.includes('defer') && !tag.includes('async') && !tag.includes('type="module"')) {
        logOpt('bloqueo-render', relPath, `El script "${src}" en <head> no tiene defer ni async.`);
      }
    }
  }

  // Imágenes sin loading="lazy"
  const imgRegex = /<img\s+[^>]*>/gi;
  let imgMatch;
  let totalImgs = 0;
  let missingLazy = 0;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    totalImgs++;
    const tag = imgMatch[0];
    if (!tag.includes('loading="lazy"') && !tag.includes("loading='lazy'")) {
      missingLazy++;
    }
  }
  if (missingLazy > 0) {
    logOpt('lazy-loading', relPath, `${missingLazy} de ${totalImgs} imágenes carecen de loading="lazy" (usar lazy en imágenes below-the-fold).`);
  }
}

// 3. Auditoría de JavaScript (Supabase queries & console logs)
console.log('\n3. Auditando JavaScript para eficiencia de datos y eventos...');
const jsAuditFiles = [
  'clickagro-store.js',
  'clickagro-mailer.js',
  'api/pedidos.js',
  'api/send-agenda.js'
];

for (const relPath of jsAuditFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');

  // Supabase select(*)
  if (content.includes(".select('*')") || content.includes('.select("*")')) {
    logOpt('query-ineficiente', relPath, `Uso de .select('*'). Se recomienda solicitar únicamente las columnas requeridas para minimizar transferencia de datos.`);
  }

  // Detección de console.log excesivos
  const consoleMatches = content.match(/console\.log\(/g);
  if (consoleMatches && consoleMatches.length > 5) {
    logOpt('logs-producción', relPath, `Se detectaron ${consoleMatches.length} llamadas a console.log(). Limpiar o envolver en condición de debug.`);
  }

  // Eventos de alta frecuencia sin debounce
  if (content.includes("addEventListener('scroll'") || content.includes('addEventListener("scroll"') ||
      content.includes("addEventListener('resize'") || content.includes('addEventListener("resize"')) {
    if (!content.includes('debounce') && !content.includes('throttle') && !content.includes('requestAnimationFrame')) {
      logOpt('performance-eventos', relPath, `EventListener en scroll/resize sin debounce o throttle.`);
    }
  }
}

console.log('\n----------------------------------------------------');
console.log(`DIAGNÓSTICO: ${suggestions} oportunidad(es) de optimización detectada(s).`);
console.log('✅ Auditoría de rendimiento finalizada.');
