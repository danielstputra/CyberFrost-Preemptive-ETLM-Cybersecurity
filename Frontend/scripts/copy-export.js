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
      // Read HTML and fix asset paths (/_next/... → ./_next/...)
      let html = fs.readFileSync(srcPath, 'utf8');
      html = html.replace(/="\/_next\//g, '"./_next/');
      html = html.replace(/='\/_next\//g, "'./_next/");
      fs.writeFileSync(path.join(pageDir, 'index.html'), html);
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

// Copy root index.html to out/index.html (Capacitor entry point)
const rootHtmlSrc = path.join(srcDir, 'index.html');
const rootHtmlDest = path.join(outDir, 'index.html');
if (fs.existsSync(rootHtmlSrc)) {
  let html = fs.readFileSync(rootHtmlSrc, 'utf8');
  html = html.replace(/="\/_next\//g, '"./_next/');
  html = html.replace(/='\/_next\//g, "'./_next/");
  fs.writeFileSync(rootHtmlDest, html);
  console.log('  ✓ root index.html');
} else {
  // Fallback: copy from /index/index.html
  const indexPath = path.join(outDir, 'index', 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, rootHtmlDest);
    console.log('  ✓ root index.html (from /index/)');
  }
}

console.log('Done! Files in:', outDir);
