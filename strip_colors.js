const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./components', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace text colors
    content = content.replace(/text-neon-green[^\s"']*/g, 'text-foreground');
    content = content.replace(/text-blue-\d+[^\s"']*/g, 'text-foreground');
    content = content.replace(/text-purple-\d+[^\s"']*/g, 'text-foreground');

    // Replace bg colors
    content = content.replace(/bg-neon-green[^\s"']*/g, 'bg-foreground');
    content = content.replace(/bg-blue-\d+[^\s"']*/g, 'bg-foreground');
    content = content.replace(/bg-purple-\d+[^\s"']*/g, 'bg-foreground');

    // Replace border colors
    content = content.replace(/border-neon-green[^\s"']*/g, 'border-foreground');
    content = content.replace(/border-blue-\d+[^\s"']*/g, 'border-foreground');
    content = content.replace(/border-purple-\d+[^\s"']*/g, 'border-foreground');
    
    // Replace shadow colors
    content = content.replace(/shadow-\[0_0_[^\]]+#4ade80\]/g, 'shadow-clay-sm');
    content = content.replace(/shadow-\[0_0_[^\]]+#a855f7\]/g, 'shadow-clay-sm');
    content = content.replace(/shadow-\[0_0_[^\]]+rgba\(59,130,246,0\.5\)\]/g, 'shadow-clay-sm');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace text colors
    content = content.replace(/text-neon-green[^\s"']*/g, 'text-foreground');
    content = content.replace(/text-blue-\d+[^\s"']*/g, 'text-foreground');
    content = content.replace(/text-purple-\d+[^\s"']*/g, 'text-foreground');

    // Replace bg colors
    content = content.replace(/bg-neon-green[^\s"']*/g, 'bg-foreground');
    content = content.replace(/bg-blue-\d+[^\s"']*/g, 'bg-foreground');
    content = content.replace(/bg-purple-\d+[^\s"']*/g, 'bg-foreground');

    // Replace border colors
    content = content.replace(/border-neon-green[^\s"']*/g, 'border-foreground');
    content = content.replace(/border-blue-\d+[^\s"']*/g, 'border-foreground');
    content = content.replace(/border-purple-\d+[^\s"']*/g, 'border-foreground');
    
    // Replace shadow colors
    content = content.replace(/shadow-\[0_0_[^\]]+#4ade80\]/g, 'shadow-clay-sm');
    content = content.replace(/shadow-\[0_0_[^\]]+#a855f7\]/g, 'shadow-clay-sm');
    content = content.replace(/shadow-\[0_0_[^\]]+rgba\(59,130,246,0\.5\)\]/g, 'shadow-clay-sm');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
console.log('Done!');
