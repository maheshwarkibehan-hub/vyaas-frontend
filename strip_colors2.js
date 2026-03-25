const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if(!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) {
       walkDir(dirPath, callback);
    } else {
       callback(dirPath);
    }
  });
}

const dirs = ['./components', './app', './styles'];

dirs.forEach(d => {
  walkDir(d, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;

      content = content.replace(/neon-green/g, 'foreground');
      content = content.replace(/blue-500/g, 'foreground');
      content = content.replace(/blue-600/g, 'foreground');
      content = content.replace(/purple-500/g, 'secondary');
      content = content.replace(/purple-600/g, 'secondary');
      content = content.replace(/purple-900/g, 'secondary');
      content = content.replace(/blue-900/g, 'secondary');
      
      // Specifically fix shadows
      content = content.replace(/\[0_0_[^\]]+#4ade80\]/g, 'clay-sm');
      content = content.replace(/\[0_0_[^\]]+#a855f7\]/g, 'clay-sm');
      content = content.replace(/\[0_0_[^\]]+rgba\(59,130,246,0\.5\)\]/g, 'clay-sm');

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
      }
    }
  });
});
console.log('Done mapping monochrome colors.');
