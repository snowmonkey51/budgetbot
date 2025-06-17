// Fix package.json for Electron build
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Move electron packages to devDependencies
if (pkg.dependencies.electron) {
  if (!pkg.devDependencies) pkg.devDependencies = {};
  pkg.devDependencies.electron = pkg.dependencies.electron;
  delete pkg.dependencies.electron;
}

if (pkg.dependencies['electron-builder']) {
  if (!pkg.devDependencies) pkg.devDependencies = {};
  pkg.devDependencies['electron-builder'] = pkg.dependencies['electron-builder'];
  delete pkg.dependencies['electron-builder'];
}

// Set Electron-specific fields
pkg.main = 'electron/main.cjs';
pkg.description = 'BudgetBot - Personal budgeting application for macOS';
pkg.author = 'BudgetBot Team';
pkg.version = '1.0.0';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Fixed package.json for Electron build');