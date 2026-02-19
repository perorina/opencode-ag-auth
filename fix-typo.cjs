const fs = require('fs');
const path = require('path');

const replacements = {
    'gemini-3-1-pro': 'gemini-3.1-pro'
};

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === '.git' || file === 'node_modules' || file === '.antigravity') continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.mjs') || fullPath.endsWith('.sh') || fullPath.endsWith('.md')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content;

                for (const [oldStr, newStr] of Object.entries(replacements)) {
                    newContent = newContent.split(oldStr).join(newStr);
                }

                if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Updated ${fullPath}`);
                }
            }
        }
    }
}

walkDir('.');
