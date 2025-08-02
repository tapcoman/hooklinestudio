#!/usr/bin/env node

/**
 * Railway esbuild wrapper script
 * Ensures correct esbuild binary is used for Linux x64 architecture
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const LINUX_X64_ESBUILD = join(process.cwd(), 'node_modules/@esbuild/linux-x64/bin/esbuild');
const DEFAULT_ESBUILD = join(process.cwd(), 'node_modules/.bin/esbuild');

function getEsbuildPath() {
  // Try Linux x64 specific binary first (for Railway)
  if (existsSync(LINUX_X64_ESBUILD)) {
    console.log('Using Linux x64 esbuild binary for Railway deployment');
    return LINUX_X64_ESBUILD;
  }
  
  // Fallback to default esbuild
  if (existsSync(DEFAULT_ESBUILD)) {
    console.log('Using default esbuild binary');
    return DEFAULT_ESBUILD;
  }
  
  // Last resort - try npx
  console.log('Using npx esbuild as fallback');
  return 'esbuild';
}

function runEsbuild() {
  const esbuildPath = getEsbuildPath();
  const args = process.argv.slice(2);
  
  console.log(`Running esbuild: ${esbuildPath} ${args.join(' ')}`);
  
  const child = spawn(esbuildPath, args, {
    stdio: 'inherit',
    shell: false
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  child.on('error', (error) => {
    console.error('Error running esbuild:', error);
    process.exit(1);
  });
}

runEsbuild();