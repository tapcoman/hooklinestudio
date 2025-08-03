#!/usr/bin/env node

/**
 * Build-time environment validation script for Railway deployment
 * This script validates that all required environment variables are present
 * and properly formatted before the build process starts.
 */

const requiredViteVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_APP_ID'
];

const requiredServerVars = [
  'NODE_ENV'
];

function validateEnvironment() {
  console.log('🔍 Validating build environment variables...\n');
  
  let hasErrors = false;
  const results = {
    vite: {},
    server: {},
    warnings: [],
    errors: []
  };

  // Check VITE_ variables (client-side)
  console.log('📦 Client-side (VITE_) Variables:');
  for (const varName of requiredViteVars) {
    const value = process.env[varName];
    const isValid = !!(value && value !== 'undefined' && value !== 'null' && value.length > 5);
    
    results.vite[varName] = {
      present: !!value,
      valid: isValid,
      type: typeof value,
      length: value ? value.length : 0
    };

    const status = isValid ? '✅' : '❌';
    const maskedValue = value ? 
      `${value.substring(0, 8)}${'*'.repeat(Math.max(0, value.length - 8))}` : 
      'NOT_SET';
    
    console.log(`  ${status} ${varName}: ${maskedValue}`);
    
    if (!isValid) {
      hasErrors = true;
      results.errors.push(`Missing or invalid ${varName}`);
    }
  }

  // Check server variables
  console.log('\n🖥️  Server Variables:');
  for (const varName of requiredServerVars) {
    const value = process.env[varName];
    const isValid = !!value;
    
    results.server[varName] = {
      present: !!value,
      valid: isValid,
      value: value
    };

    const status = isValid ? '✅' : '❌';
    console.log(`  ${status} ${varName}: ${value || 'NOT_SET'}`);
    
    if (!isValid) {
      hasErrors = true;
      results.errors.push(`Missing ${varName}`);
    }
  }

  // Additional checks
  console.log('\n🔧 Build Environment Info:');
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Node Version: ${process.version}`);
  console.log(`  Working Directory: ${process.cwd()}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);

  // Check for Railway-specific environment
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(`  Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
    console.log(`  Railway Service: ${process.env.RAILWAY_SERVICE_NAME || 'N/A'}`);
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Errors found:');
    results.errors.forEach(error => console.log(`  - ${error}`));
    
    console.log('\n🚨 Build will likely fail due to missing environment variables!');
    console.log('\n💡 To fix this in Railway:');
    console.log('1. Go to your Railway project dashboard');
    console.log('2. Navigate to Variables tab');
    console.log('3. Add the missing VITE_ variables:');
    requiredViteVars.forEach(varName => {
      if (!results.vite[varName]?.valid) {
        console.log(`   - ${varName}=your_actual_value_here`);
      }
    });
    console.log('4. Redeploy your application');
    
    // Exit with error code to fail the build
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are present and valid');
    console.log('🚀 Build can proceed safely');
  }

  return results;
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment();
}

export { validateEnvironment };