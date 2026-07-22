/**
 * Copy Next.js static export from .next/server/app/ to out/
 * Required because Turbopack doesn't generate out/ automatically
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '.next', 'server', 'app');
const outDir = path.join(__dirname, '..', 'out');

function relativePrefix(filePath) {
  // Hitung depth file terhadap outDir untuk prefix relative path
  const rel = path.relative(outDir, path.dirname(filePath));
  if (rel === '') return './';
  const depth = rel.split(path.sep).length;
  return depth === 0 ? './' : depth === 1 ? '../' : Array(depth).fill('../').join('');
}

function fixAssetPaths(html, prefix) {
  return html
    .replace(/="\/_next\//g, `="${prefix}_next/`)
    .replace(/='\/_next\//g, `='${prefix}_next/`)
    .replace(/="\/favicon/g, `="${prefix}favicon`);
}

function copyFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip Turbopack segment artifacts
    if (entry.name.endsWith('.segments') || entry.name.endsWith('.segment')) continue;

    if (entry.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else if (entry.name.endsWith('.html')) {
      const pageDir = path.join(dest, entry.name.replace('.html', ''));
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

      const outFilePath = path.join(pageDir, 'index.html');
      const prefix = relativePrefix(outFilePath);
      let html = fs.readFileSync(srcPath, 'utf8');
      html = fixAssetPaths(html, prefix);
      fs.writeFileSync(outFilePath, html);
      console.log(`  ✓ ${entry.name} (prefix: ${prefix}_next/)`);
    }
  }

  // Copy _next static assets
  const nextStaticSrc = path.join(__dirname, '..', '.next', 'static');
  const nextStaticDest = path.join(outDir, '_next', 'static');
  if (fs.existsSync(nextStaticSrc)) copyRecursive(nextStaticSrc, nextStaticDest);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    entry.isDirectory() ? copyRecursive(s, d) : fs.copyFileSync(s, d);
  }
}

console.log('Copying static export to out/...');
copyFiles(srcDir, outDir);

// Root index.html
const rootSrc = path.join(srcDir, 'index.html');
const rootDst = path.join(outDir, 'index.html');
if (fs.existsSync(rootSrc)) {
  let html = fs.readFileSync(rootSrc, 'utf8');
  html = fixAssetPaths(html, './');
  fs.writeFileSync(rootDst, html);
  console.log('  ✓ root index.html');
} else {
  const fallback = path.join(outDir, 'index', 'index.html');
  if (fs.existsSync(fallback)) fs.copyFileSync(fallback, rootDst);
}

// Cleanup: hapus artifacts Turbopack + redundant folders
function cleanup(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.endsWith('.segments') || e.name === '.segment') {
        fs.rmSync(full, { recursive: true, force: true });
        console.log(`  ✗ removed ${e.name}`);
      } else {
        cleanup(full);
      }
    }
  }
}
cleanup(outDir);

// Hapus index/index.html duplicate jika root index.html sudah ada
const rootIdx = path.join(outDir, 'index.html');
const dupIdx = path.join(outDir, 'index', 'index.html');
if (fs.existsSync(rootIdx) && fs.existsSync(dupIdx)) {
  fs.rmSync(path.join(outDir, 'index'), { recursive: true, force: true });
  console.log('  ✗ removed duplicate /index/');
}

console.log('Done! Files in:', outDir);
