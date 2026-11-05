import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { loadConfig } from '../config/env.js';

const config = loadConfig();
const name = process.env.MODERATOR_NAME || process.argv[2];
const emailInput = process.env.MODERATOR_EMAIL || process.argv[3];
const password = process.env.MODERATOR_PASSWORD || process.argv[4];

if (!name || !emailInput || !password) {
  console.error('Error: Moderator credentials not provided.');
  console.log('\nUsage Option 1 (Environment Variables):');
  console.log('  Define in backend/.env:');
  console.log('    MODERATOR_NAME="Admin Moderator"');
  console.log('    MODERATOR_EMAIL="mod@example.com"');
  console.log('    MODERATOR_PASSWORD="Password123"');
  console.log('  Then execute: npm run create-moderator\n');
  console.log('Usage Option 2 (Command Line Arguments):');
  console.log('  node scripts/createModerator.js "Admin Moderator" "mod@example.com" "Password123"\n');
  process.exit(1);
}

if (password.length < 5 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
  console.error('Error: Moderator password must be at least 5 characters and include uppercase, lowercase, and a number.');
  process.exit(1);
}

await mongoose.connect(config.mongoUri);
try {
  const email = emailInput.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: name.trim(),
        role: 'moderator',
        passwordHash
      }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Moderator account successfully configured: ${user.email} (Role: ${user.role})`);
} catch (err) {
  console.error('Failed to configure moderator account:', err.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
