#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building BudgetBot for macOS...\n');

// Step 1: Build the web application
console.log('1. Building web application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Web build complete\n');
} catch (error) {
  console.error('❌ Web build failed:', error.message);
  process.exit(1);
}

// Step 2: Update package.json for Electron
console.log('2. Configuring Electron settings...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add Electron configuration if not present
if (!packageJson.main) {
  packageJson.main = 'electron/main.js';
}
if (!packageJson.homepage) {
  packageJson.homepage = './';
}

// Add build configuration
if (!packageJson.build) {
  packageJson.build = {
    "appId": "com.budgetbot.app",
    "productName": "BudgetBot",
    "directories": {
      "output": "electron-dist"
    },
    "files": [
      "dist/**/*",
      "electron/main.js",
      "electron/assets/**/*"
    ],
    "mac": {
      "category": "public.app-category.finance",
      "target": ["dmg", "zip"]
    }
  };
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package configuration updated\n');

// Step 3: Build Electron app
console.log('3. Building Electron application...');
try {
  execSync('npx electron-builder --mac', { stdio: 'inherit' });
  console.log('✅ macOS app build complete!\n');
  
  console.log('🎉 Your macOS app is ready!');
  console.log('📁 Find it in the electron-dist folder');
  console.log('💡 To run in development: ./start-electron.sh');
  
} catch (error) {
  console.error('❌ Electron build failed:', error.message);
  console.log('\n💡 Try running in development mode first: ./start-electron.sh');
  process.exit(1);
}