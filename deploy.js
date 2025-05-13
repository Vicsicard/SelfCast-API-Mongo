/**
 * SelfCast API MongoDB Deployment Helper
 * 
 * This script helps with the deployment process for both Render (backend) and Vercel (frontend).
 * Run with: node deploy.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper functions
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${text} ===${colors.reset}\n`);
}

function printStep(step, text) {
  console.log(`${colors.bright}${colors.yellow}${step}.${colors.reset} ${text}`);
}

function printCommand(command) {
  console.log(`   ${colors.green}$ ${command}${colors.reset}`);
}

function printInfo(text) {
  console.log(`   ${colors.blue}ℹ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`   ${colors.magenta}⚠ ${text}${colors.reset}`);
}

function printSuccess(text) {
  console.log(`   ${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`   ${colors.red}✗ ${text}${colors.reset}`);
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.bright}${colors.yellow}? ${question}${colors.reset} `, resolve);
  });
}

// Main deployment guide
async function deploymentGuide() {
  printHeader('SelfCast API MongoDB Deployment Guide');
  
  console.log('This script will guide you through the deployment process for both Render (backend) and Vercel (frontend).');
  console.log('Make sure you have accounts on both platforms before proceeding.\n');
  
  // Check if git is installed
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (error) {
    printError('Git is not installed or not in your PATH. Please install Git before proceeding.');
    process.exit(1);
  }
  
  // Check if the project is a git repository
  const isGitRepo = fs.existsSync(path.join(__dirname, '.git'));
  if (!isGitRepo) {
    printWarning('This project is not a Git repository. Initializing Git repository...');
    try {
      execSync('git init', { stdio: 'inherit' });
      printSuccess('Git repository initialized.');
    } catch (error) {
      printError('Failed to initialize Git repository.');
      process.exit(1);
    }
  }
  
  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain').toString();
    if (status.trim() !== '') {
      printWarning('You have uncommitted changes. It is recommended to commit these changes before deploying.');
      const shouldCommit = await askQuestion('Would you like to commit these changes now? (y/n)');
      
      if (shouldCommit.toLowerCase() === 'y') {
        const commitMessage = await askQuestion('Enter a commit message:');
        try {
          execSync('git add .', { stdio: 'inherit' });
          execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
          printSuccess('Changes committed successfully.');
        } catch (error) {
          printError('Failed to commit changes.');
          process.exit(1);
        }
      }
    }
  } catch (error) {
    printError('Failed to check Git status.');
    process.exit(1);
  }
  
  // Deployment steps
  printHeader('Deployment Steps');
  
  // Backend deployment (Render)
  printStep(1, 'Backend Deployment to Render');
  printInfo('The backend will be deployed to Render using the render.yaml Blueprint.');
  printInfo('Make sure your Render account is connected to your Git repository.');
  
  console.log('\n   Follow these steps:');
  printCommand('1. Log in to your Render account at https://render.com');
  printCommand('2. Click on "New" and select "Blueprint"');
  printCommand('3. Connect your Git repository');
  printCommand('4. Render will automatically detect the render.yaml file and configure the service');
  printCommand('5. Review the configuration and click "Apply"');
  
  const renderDeployed = await askQuestion('Have you deployed the backend to Render? (y/n)');
  
  if (renderDeployed.toLowerCase() === 'y') {
    const renderUrl = await askQuestion('Enter your Render deployment URL (e.g., https://selfcast-api-mongo.onrender.com):');
    
    // Update config.js with the Render URL
    try {
      const configPath = path.join(__dirname, 'public', 'config.js');
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Replace the production URL
      configContent = configContent.replace(
        /const apiBaseUrl = isProduction\s*\?\s*'([^']+)'/,
        `const apiBaseUrl = isProduction ? '${renderUrl}/api'`
      );
      
      fs.writeFileSync(configPath, configContent);
      printSuccess('Updated config.js with your Render deployment URL.');
    } catch (error) {
      printError('Failed to update config.js with Render URL.');
      console.error(error);
    }
  } else {
    printWarning('Please deploy the backend to Render before proceeding to the frontend deployment.');
  }
  
  // Frontend deployment (Vercel)
  printStep(2, 'Frontend Deployment to Vercel');
  printInfo('The frontend will be deployed to Vercel using the vercel.json configuration.');
  
  console.log('\n   Follow these steps:');
  printCommand('1. Log in to your Vercel account at https://vercel.com');
  printCommand('2. Click on "New Project"');
  printCommand('3. Import your Git repository');
  printCommand('4. Configure the project:');
  printCommand('   - Framework Preset: Other');
  printCommand('   - Build Command: (leave empty)');
  printCommand('   - Output Directory: public');
  printCommand('   - Install Command: npm install');
  printCommand('5. Click "Deploy"');
  
  const vercelDeployed = await askQuestion('Have you deployed the frontend to Vercel? (y/n)');
  
  if (vercelDeployed.toLowerCase() === 'y') {
    const vercelUrl = await askQuestion('Enter your Vercel deployment URL (e.g., https://selfcast-dynamic.vercel.app):');
    
    // Update render.yaml with the Vercel URL for CORS
    try {
      const renderYamlPath = path.join(__dirname, 'render.yaml');
      let renderYamlContent = fs.readFileSync(renderYamlPath, 'utf8');
      
      // Replace the CORS_ORIGIN value
      renderYamlContent = renderYamlContent.replace(
        /CORS_ORIGIN\s*\n\s*value:\s*([^\n]+)/,
        `CORS_ORIGIN\n        value: ${vercelUrl}`
      );
      
      fs.writeFileSync(renderYamlPath, renderYamlContent);
      printSuccess('Updated render.yaml with your Vercel deployment URL for CORS.');
    } catch (error) {
      printError('Failed to update render.yaml with Vercel URL.');
      console.error(error);
    }
    
    printWarning('You need to redeploy the backend to Render for the CORS settings to take effect.');
    printCommand('1. Go to your Render dashboard');
    printCommand('2. Select your SelfCast API service');
    printCommand('3. Go to "Environment" and update the CORS_ORIGIN variable');
    printCommand('4. Click "Save Changes" and wait for the service to redeploy');
  }
  
  // Post-deployment verification
  printStep(3, 'Post-Deployment Verification');
  printInfo('After both the backend and frontend are deployed, verify that they are working correctly.');
  
  console.log('\n   Follow these steps:');
  printCommand('1. Navigate to your Vercel deployment URL');
  printCommand('2. Try to load projects and content');
  printCommand('3. Check the browser console for any errors');
  
  // Commit deployment configuration
  const shouldCommitDeployment = await askQuestion('Would you like to commit the deployment configuration changes? (y/n)');
  
  if (shouldCommitDeployment.toLowerCase() === 'y') {
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Update deployment configuration"', { stdio: 'inherit' });
      printSuccess('Deployment configuration committed successfully.');
    } catch (error) {
      printError('Failed to commit deployment configuration.');
      console.error(error);
    }
  }
  
  printHeader('Deployment Guide Complete');
  console.log('Your SelfCast API MongoDB application is now deployed to Render (backend) and Vercel (frontend).');
  console.log('If you encounter any issues, refer to the DEPLOYMENT.md file for troubleshooting steps.');
  
  rl.close();
}

// Run the deployment guide
deploymentGuide().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});
