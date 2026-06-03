const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('grep -rlI "voidtrail\\|VoidTrail\\|Voidtrail\\|Void Trail" src server.ts scripts').toString().trim().split('\n').filter(Boolean);

let renameCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/voidtrail/g, 'summerlab');
  content = content.replace(/VoidTrail/g, 'SummerLab');
  content = content.replace(/Voidtrail/g, 'SummerLab');
  content = content.replace(/Void Trail/g, 'Summer Lab');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    renameCount++;
  }
}
console.log(`Updated ${renameCount} files.`);
