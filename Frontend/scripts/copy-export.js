/**
 * Copy Next.js static export from .next/server/app/ to out/
 * Required because Turbopack doesn't generate out/ automatically
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '.next', 'server', 'app');
const outDir = path.join(__dirname, '..', 'out');

function copyFiles(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else if (entry.name.endsWith('.html')) {
      // Create an index.html for each page
      const pageDir = path.join(dest, entry.name.replace('.html', ''));
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, path.join(pageDir, 'index.html'));
      console.log(`  ✓ ${entry.name}`);
    }
  }

  // Copy _next static assets
  const nextStaticSrc = path.join(__dirname, '..', '.next', 'static');
  const nextStaticDest = path.join(outDir, '_next', 'static');
  if (fs.existsSync(nextStaticSrc)) {
    copyRecursive(nextStaticSrc, nextStaticDest);
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying static export to out/...');
copyFiles(srcDir, outDir);
console.log('Done! Files in:', outDir);
