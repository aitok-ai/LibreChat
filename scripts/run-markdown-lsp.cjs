#!/usr/bin/env node

const { spawn } = require('node:child_process');

const path = require('node:path');

const resolveServerPath = () => {
  try {
    const pkgPath = require.resolve('markdown-language-server/package.json');
    return path.join(path.dirname(pkgPath), 'dist', 'main.js');
  } catch (error) {
    console.error('markdown-language-server is not installed.');
    console.error('Run: npm install --save-dev markdown-language-server');
    if (error instanceof Error && error.message) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

const serverPath = resolveServerPath();
const child = spawn(process.execPath, [serverPath, '--stdio'], {
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error('Failed to start markdown-language-server.');
  if (error instanceof Error && error.message) {
    console.error(error.message);
  }
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
