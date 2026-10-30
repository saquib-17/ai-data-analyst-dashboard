const fs = require('fs');
const path = require('path');

function searchDir(dir, patterns) {
  const matches = [];
  function recurse(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'backups'].includes(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (/\.(js|jsx|ts|tsx|json|html|css|sql)$/i.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, lineNum) => {
            for (const pat of patterns) {
              if (line.toLowerCase().includes(pat.toLowerCase())) {
                matches.push({ file: path.relative(process.cwd(), fullPath), line: lineNum + 1, pat, snippet: line.trim() });
                break;
              }
            }
          });
        } catch (e) {}
      }
    }
  }
  recurse(dir);
  return matches;
}

const terms = [
  'mockdata', 'dummydata', 'sampledata', 'fakedata', 'seed', 'placeholder',
  'hardcoded', '12,480', '12480', '1,248,932', '1248932', '2.4 GB', '2.4 MB',
  '4,892', '4892', '99.9%', '<12ms', '100% accuracy', 'pro plan', 'upgrade to pro',
  'aditya', 'aditya@datamind.ai', '12.5%', '8.3%', '18.1%', '2.4%'
];

const results = searchDir('.', terms);
results.forEach(m => console.log(`${m.file}:${m.line} [${m.pat}] -> ${m.snippet.slice(0, 120)}`));

