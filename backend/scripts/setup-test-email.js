/**
 * Script to set up a test email account with Ethereal
 * Run this script with: node scripts/setup-test-email.js
 */

const { createTestAccount } = require('../utils/testEmailService');

// Self-executing async function
(async () => {
  console.log('Setting up a test email account for development...');
  
  try {
    await createTestAccount();
    console.log('✅ Test email account set up successfully!');
    console.log('Copy the values above to your .env file');
    console.log('Add USE_TEST_EMAIL=true to your .env file');
    console.log('\nWhen emails are sent, you will see a preview URL in the console.');
  } catch (error) {
    console.error('❌ Failed to set up test email account:', error);
    process.exit(1);
  }
})(); 