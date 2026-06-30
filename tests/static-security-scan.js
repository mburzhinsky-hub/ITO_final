import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const CRITICAL = [
  /document\.write\s*\(/,
  /insertAdjacentHTML\s*\(/,
  /outerHTML\s*=/,
  /<[^>]+\s(?:on(?:click|error|load))\s*=/i,
  /href=[\"']javascript:/i
];
const WATCH = [
  /innerHTML\s*=/,
  /\$\{\s*(?:project|p|zone|item|warning|supplier|customer|view)\.[^}]+\}/
];
const RENDER_PATH = /src\/(?:pages|components|export)\//;
const ALLOWED_FILES = new Set([
  'src/utils/sanitize.js',
  'src/app/router.js',
  'src/components/WelcomeIntro.js'
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
  });
}

export function runStaticSecurityScan({ failOnCritical = true } = {}) {
  const findings = [];
  for (const file of walk(ROOT)) {
    const rel = file.replace(/\\/g, '/');
    const relShort = rel.replace(process.cwd().replace(/\\/g, '/') + '/', '');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const critical = CRITICAL.some(pattern => pattern.test(line));
      const watch = RENDER_PATH.test(relShort) && WATCH.some(pattern => pattern.test(line));
      if (!critical && !watch) return;
      const escaped = /escapeHtml|escapeAttr|safeUrl|safeText|textContent|createElement|static-security-scan/.test(line);
      const looksNumericOnly = /formatMoney|\.length|Number\(|toLocaleString|actualMarginPct|salePrice|unitCost|qty|vatPct/.test(line);
      if (critical || (!escaped && !looksNumericOnly && !ALLOWED_FILES.has(relShort))) {
        findings.push({ file: relShort, line: index + 1, critical, code: line.trim().slice(0, 220) });
      }
    });
  }
  const criticalFindings = findings.filter(item => item.critical);
  if (findings.length) {
    console.warn('Static security scan findings:');
    findings.forEach(f => console.warn(`${f.critical ? 'CRITICAL' : 'WARN'} ${f.file}:${f.line} ${f.code}`));
  }
  if (failOnCritical && criticalFindings.length) throw new Error(`Critical unsafe HTML patterns found: ${criticalFindings.length}`);
  return findings;
}
