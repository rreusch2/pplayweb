const fs = require('fs');
const path = require('path');

function removeFramerMotionFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove framer-motion imports
    content = content.replace(/import.*from ['"]framer-motion['"];?\n?/g, '');
    content = content.replace(/import.*framer-motion.*\n?/g, '');
    
    // Replace motion.div with div
    content = content.replace(/motion\.div/g, 'div');
    content = content.replace(/motion\.button/g, 'button');
    content = content.replace(/motion\.span/g, 'span');
    content = content.replace(/motion\.p/g, 'p');
    content = content.replace(/motion\.h1/g, 'h1');
    content = content.replace(/motion\.h2/g, 'h2');
    content = content.replace(/motion\.h3/g, 'h3');
    content = content.replace(/motion\.section/g, 'section');
    content = content.replace(/motion\.nav/g, 'nav');
    content = content.replace(/motion\.ul/g, 'ul');
    content = content.replace(/motion\.li/g, 'li');
    
    // Remove animation props (initial, animate, exit, transition, whileHover, whileTap, etc.)
    content = content.replace(/\s+initial=\{[^}]*\}/g, '');
    content = content.replace(/\s+animate=\{[^}]*\}/g, '');
    content = content.replace(/\s+exit=\{[^}]*\}/g, '');
    content = content.replace(/\s+transition=\{[^}]*\}/g, '');
    content = content.replace(/\s+whileHover=\{[^}]*\}/g, '');
    content = content.replace(/\s+whileTap=\{[^}]*\}/g, '');
    content = content.replace(/\s+variants=\{[^}]*\}/g, '');
    content = content.replace(/\s+custom=\{[^}]*\}/g, '');
    content = content.replace(/\s+layout/g, '');
    content = content.replace(/\s+layoutId=["'][^"']*["']/g, '');
    
    // Remove AnimatePresence components
    content = content.replace(/\s*<AnimatePresence[^>]*>/g, '');
    content = content.replace(/\s*<\/AnimatePresence>/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function findAndCleanFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAndCleanFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      removeFramerMotionFromFile(fullPath);
    }
  }
}

console.log('🧹 Removing Framer Motion from all files...');
findAndCleanFiles('./');
console.log('✅ Done! All Framer Motion usage removed.');
