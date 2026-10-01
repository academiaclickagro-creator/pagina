import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🤖 AGENTE DE VERIFICACIÓN FUNCIONAL CLICK AGRO');
console.log('====================================================\n');

let errors = 0;
let warnings = 0;

function logPass(msg) {
  console.log(`  [OK] ${msg}`);
}
function logFail(msg) {
  console.log(`  [ERROR] ${msg}`);
  errors++;
}
function logWarn(msg) {
  console.log(`  [AVISO] ${msg}`);
  warnings++;
}

// 1. Validar sintaxis JavaScript
console.log('1. Verificando sintaxis de archivos JavaScript...');
const jsFiles = [
  'clickagro-mailer.js',
  'clickagro-store.js',
  'api/pedidos.js',
  'api/send-agenda.js'
];

for (const relPath of jsFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      logPass(`Sintaxis correcta: ${relPath}`);
    } catch (err) {
      logFail(`Error de sintaxis en ${relPath}: ${err.message}`);
    }
  } else {
    logWarn(`Archivo no encontrado: ${relPath}`);
  }
}

// 2. Validar JSONs de configuración
console.log('\n2. Verificando formato de archivos JSON...');
const jsonFiles = ['package.json', 'vercel.json'];
for (const relPath of jsonFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      JSON.parse(content);
      logPass(`JSON válido: ${relPath}`);
    } catch (err) {
      logFail(`JSON inválido en ${relPath}: ${err.message}`);
    }
  }
}

// 3. Validar consistencia de APIs serverless
console.log('\n3. Verificando buenas prácticas en endpoints /api/...');
const apiFiles = ['api/pedidos.js', 'api/send-agenda.js'];
for (const relPath of apiFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    
    // Comprobar manejo de excepciones
    if (code.includes('try') && code.includes('catch')) {
      logPass(`${relPath}: Cuenta con bloque try...catch para manejo de errores.`);
    } else {
      logFail(`${relPath}: Falta bloque try...catch para captura de excepciones.`);
    }

    // Comprobar verificación de método HTTP
    if (code.includes('req.method') || code.includes('method')) {
      logPass(`${relPath}: Controla o inspecciona el método HTTP del request.`);
    } else {
      logWarn(`${relPath}: No se detectó validación explícita de req.method.`);
    }

    // Comprobar exportación de handler
    if (code.includes('export default') || code.includes('module.exports')) {
      logPass(`${relPath}: Exporta correctamente el handler serverless.`);
    } else {
      logFail(`${relPath}: No se encontró export default o module.exports.`);
    }
  }
}

// 4. Validar referencias locales en archivos HTML
console.log('\n4. Verificando referencias de recursos en páginas HTML...');
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

  // Buscar scripts locales
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
      const cleanSrc = src.split('?')[0].split('#')[0].replace(/^\//, '');
      const assetPath = path.join(rootDir, cleanSrc);
      if (fs.existsSync(assetPath)) {
        logPass(`${relPath}: Script local resuelto "${src}"`);
      } else {
        logFail(`${relPath}: Referencia a script inexistente "${src}"`);
      }
    }
  }

  // Buscar links css locales
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.endsWith('.css') && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
      const cleanHref = href.split('?')[0].split('#')[0].replace(/^\//, '');
      const assetPath = path.join(rootDir, cleanHref);
      if (fs.existsSync(assetPath)) {
        logPass(`${relPath}: CSS local resuelto "${href}"`);
      } else {
        logWarn(`${relPath}: CSS referenciado no hallado en "${href}"`);
      }
    }
  }
}

console.log('\n----------------------------------------------------');
console.log(`RESUMEN: ${errors} error(es), ${warnings} aviso(s).`);
if (errors === 0) {
  console.log('✅ Verificación funcional aprobada con éxito.');
  process.exit(0);
} else {
  console.log('❌ Se detectaron problemas que deben corregirse.');
  process.exit(1);
}
