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

function validateEnvironment() {
  console.log('Validating environment...');
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Available environment variables:');
    Object.keys(process.env)
      .filter(key => key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB'))
      .forEach(key => console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`));
    throw new Error('DATABASE_URL is required for drizzle-kit push');
  }
  
  console.log('✅ DATABASE_URL is set');
  
  // Check if drizzle config exists
  const configPath = join(process.cwd(), 'drizzle.config.ts');
  if (!existsSync(configPath)) {
    throw new Error(`Drizzle config not found at ${configPath}`);
  }
  
  console.log('✅ Drizzle config found');
}

function runDrizzleKit() {
  return new Promise((resolve, reject) => {
    try {
      // Validate environment first
      validateEnvironment();
      
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
      console.log('Environment check:');
      console.log(`  NODE_ENV: ${env.NODE_ENV}`);
      console.log(`  DATABASE_URL: ${env.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);
      
      let errorOutput = '';
      let standardOutput = '';
      
      const drizzleProcess = spawn('npx', ['drizzle-kit', 'push'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: false,
        env
      });
      
      // Capture stdout and stderr for better error reporting
      drizzleProcess.stdout.on('data', (data) => {
        const output = data.toString();
        standardOutput += output;
        console.log(output);
      });
      
      drizzleProcess.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        console.error(output);
      });
      
      drizzleProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Drizzle-kit push completed successfully');
          resolve();
        } else {
          console.error(`❌ Drizzle-kit push failed with exit code: ${code}`);
          console.error('--- Error Output ---');
          console.error(errorOutput);
          console.error('--- Standard Output ---');
          console.error(standardOutput);
          reject(new Error(`Drizzle-kit push failed with exit code: ${code}\nError: ${errorOutput}\nOutput: ${standardOutput}`));
        }
      });
      
      drizzleProcess.on('error', (error) => {
        console.error('❌ Error spawning drizzle-kit process:', error);
        reject(error);
      });
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      reject(error);
    }
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