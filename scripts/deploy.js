/**
 * Deployment Script for RetirementCalcV1
 *
 * Uploads the production build to a remote FTP server.
 *
 * Usage:
 *   node scripts/deploy.js           # Full deployment
 *   node scripts/deploy.js --dry-run # Test connection only
 *
 * Prerequisites:
 *   1. Populate src/.credentials with your FTP login (see example below).
 *   2. Run 'npm run build' to generate the 'dist/' folder.
 *
 * Expected src/.credentials format (JSON):
 * {
 *   "ftp": {
 *     "host": "bimmerinfo.com",
 *     "user": "your_ftp_username",
 *     "password": "your_ftp_password"
 *   },
 *   "remotePath": "/bmwseals.com/retirecalc"
 * }
 */

/* eslint-env node */

import { Client } from 'basic-ftp';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CREDENTIALS_PATH = path.join(ROOT_DIR, 'src', '.credentials');

const isDryRun = process.argv.includes('--dry-run');

async function deploy() {
  console.log('🚀 RetirementCalcV1 Deployment Script');
  console.log('=====================================\n');

  // 1. Read Credentials
  console.log('📄 Reading credentials...');
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ Credentials file not found:', CREDENTIALS_PATH);
    console.error('   Please create it with the following JSON format:');
    console.error(`
{
  "ftp": {
    "host": "bimmerinfo.com",
    "user": "your_ftp_username",
    "password": "your_ftp_password"
  },
  "remotePath": "/bmwseals.com/retirecalc"
}
`);
    process.exit(1);
  }

  let credentials;
  let ftp = {};
  let remotePath = '/bmwseals.com/retirecalc';
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    if (!raw.trim()) {
      console.error('❌ Credentials file is empty. Please populate it.');
      process.exit(1);
    }
    // Try JSON first
    if (raw.trim().startsWith('{')) {
      credentials = JSON.parse(raw);
      ftp = credentials.ftp || {};
      remotePath = credentials.remotePath || remotePath;
    } else {
      // Plain text: line 1 = user, line 2 = password
      const lines = raw.split(/\r?\n/).filter((l) => l.trim());
      ftp = {
        host: 'bimmerinfo.com',
        user: lines[0].trim(),
        password: lines[1].trim(),
      };
    }
  } catch (err) {
    console.error('❌ Failed to parse credentials:', err.message);
    process.exit(1);
  }

  if (!ftp?.host || !ftp?.user || !ftp?.password) {
    console.error('❌ Invalid credentials. Ensure user/password are present.');
    process.exit(1);
  }

  console.log(`   ✅ Host: ${ftp.host}`);
  console.log(`   ✅ User: ${ftp.user}`);
  console.log(`   ✅ Remote Path: ${remotePath || '/retirecalc'}\n`);

  // 2. Build the project
  if (!isDryRun) {
    console.log('🔨 Building project (npm run build)...');
    try {
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('   ✅ Build complete.\n');
    } catch (err) {
      console.error('❌ Build failed:', err.message);
      process.exit(1);
    }
  } else {
    console.log('🔨 [Dry Run] Skipping build step.\n');
  }

  // 3. Verify dist folder
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  const distFiles = fs.readdirSync(DIST_DIR);
  console.log(`📦 Found ${distFiles.length} items in dist/:`, distFiles.join(', '), '\n');

  // 4. Connect to FTP
  const client = new Client();
  client.ftp.verbose = isDryRun; // Show verbose logs in dry run

  try {
    console.log('🔗 Connecting to FTP server...');
    await client.access({
      host: ftp.host,
      user: ftp.user,
      password: ftp.password,
      secure: false, // Set to true if your server supports FTPS
    });
    console.log('   ✅ Connected!\n');

    // 5. Navigate to remote directory (create if needed)
    const targetPath = remotePath || '/retirecalc';
    console.log(`📂 Navigating to remote path: ${targetPath}`);
    try {
      await client.ensureDir(targetPath);
      console.log('   ✅ Directory ready.\n');
    } catch (err) {
      console.error('❌ Failed to create/access remote directory:', err.message);
      process.exit(1);
    }

    if (isDryRun) {
      console.log('📋 [Dry Run] Listing remote directory contents:');
      const list = await client.list();
      list.forEach((item) =>
        console.log(`   - ${item.name} (${item.type === 2 ? 'dir' : 'file'})`)
      );
      console.log('\n✅ Dry run complete. No files were uploaded.');
    } else {
      // 6. Upload all files from dist/
      console.log('📤 Uploading files from dist/...');
      await client.uploadFromDir(DIST_DIR);
      console.log('   ✅ Upload complete!\n');

      console.log('🎉 Deployment successful!');
      console.log(`   Your app should now be available at: http://bmwseals.com/retirecalc`);
    }
  } catch (err) {
    console.error('❌ FTP Error:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
