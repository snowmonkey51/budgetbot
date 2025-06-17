#!/usr/bin/env node

// Fix package.json for Electron build
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Move electron packages to devDependencies
const electronPackages = ['electron', 'electron-builder', 'concurrently', 'wait-on', 'cross-env'];

electronPackages.forEach(packageName => {
  if (pkg.dependencies && pkg.dependencies[packageName]) {
    if (!pkg.devDependencies) pkg.devDependencies = {};
    pkg.devDependencies[packageName] = pkg.dependencies[packageName];
    delete pkg.dependencies[packageName];
    console.log(`Moved ${packageName} to devDependencies`);
  }
});

// Add missing metadata
if (!pkg.description) {
  pkg.description = "BudgetBot - Personal budgeting application with robot-themed interface";
}

if (!pkg.author) {
  pkg.author = "BudgetBot Team";
}

// Add main entry point for Electron
pkg.main = "electron/main.js";

// Add Electron scripts
if (!pkg.scripts) pkg.scripts = {};
pkg.scripts["electron"] = "electron .";
pkg.scripts["electron-dev"] = "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && electron .\"";
pkg.scripts["electron-build"] = "npm run build && electron-builder";

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json fixed for Electron build');