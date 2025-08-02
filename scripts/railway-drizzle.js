#!/usr/bin/env node

/**
 * Railway-specific drizzle-kit wrapper script
 * Handles esbuild service/binary version mismatches during Railway deployment
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const LINUX_X64_ESBUILD = join(process.cwd(), 'node_modules/@esbuild/linux-x64/bin/esbuild');
const DEFAULT_ESBUILD = join(process.cwd(), 'node_modules/.bin/esbuild');

function killEsbuildService() {
  try {
    console.log('Killing any existing esbuild service processes...');
    // Kill any existing esbuild service processes
    execSync('pkill -f "esbuild.*service" || true', { stdio: 'pipe' });
    console.log('Esbuild service processes killed');
  } catch (error) {
    console.log('No esbuild service processes to kill or error occurred:', error.message);
  }
}

function ensureEsbuildBinary() {
  // Set the correct esbuild binary path for Railway Linux environment
  if (existsSync(LINUX_X64_ESBUILD)) {
    console.log('Found Linux x64 esbuild binary');
    process.env.ESBUILD_BINARY_PATH = LINUX_X64_ESBUILD;
    return LINUX_X64_ESBUILD;
  }
  
  if (existsSync(DEFAULT_ESBUILD)) {
    console.log('Using default esbuild binary');
    process.env.ESBUILD_BINARY_PATH = DEFAULT_ESBUILD;
    return DEFAULT_ESBUILD;
  }
  
  console.log('Using system esbuild');
  return 'esbuild';
}

function runDrizzleKit() {
  return new Promise((resolve, reject) => {
    // Kill existing esbuild services to prevent version mismatches
    killEsbuildService();
    
    // Ensure correct esbuild binary
    const esbuildPath = ensureEsbuildBinary();
    console.log(`Using esbuild at: ${esbuildPath}`);
    
    // Force esbuild to use the correct binary
    const env = {
      ...process.env,
      ESBUILD_BINARY_PATH: esbuildPath,
      // Disable esbuild service to prevent version mismatch
      ESBUILD_SERVICE: 'false',
      // Force fresh start of any esbuild processes
      FORCE_COLOR: '0',
      NO_COLOR: '1'
    };
    
    console.log('Running drizzle-kit push...');
    
    const drizzleProcess = spawn('npx', ['drizzle-kit', 'push'], {
      stdio: 'inherit',
      shell: false,
      env
    });
    
    drizzleProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Drizzle-kit push completed successfully');
        resolve();
      } else {
        console.error(`Drizzle-kit push failed with exit code: ${code}`);
        reject(new Error(`Drizzle-kit push failed with exit code: ${code}`));
      }
    });
    
    drizzleProcess.on('error', (error) => {
      console.error('Error running drizzle-kit:', error);
      reject(error);
    });
  });
}

async function main() {
  try {
    await runDrizzleKit();
    console.log('Railway drizzle migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Railway drizzle migration failed:', error);
    process.exit(1);
  }
}

main();