// This script formats your Firebase private key for Coolify
// Run: node format-firebase-key.js

const fs = require('fs');
const path = require('path');

console.log('\n📝 Firebase Private Key Formatter for Coolify\n');
console.log('This will read your Firebase service account JSON and format the private key correctly.\n');

// Ask for the JSON file path
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Enter the path to your Firebase service account JSON file:\n(e.g., C:\\Users\\Mark\\Downloads\\your-project-firebase-adminsdk.json)\n> ', (filePath) => {
  try {
    // Read the JSON file
    const jsonContent = fs.readFileSync(filePath.trim(), 'utf8');
    const serviceAccount = JSON.parse(jsonContent);

    // Get the private key
    const privateKey = serviceAccount.private_key;
    const clientEmail = serviceAccount.client_email;

    if (!privateKey || !clientEmail) {
      console.error('\n❌ Error: Could not find private_key or client_email in the JSON file.');
      readline.close();
      return;
    }

    console.log('\n✅ Successfully read the service account file!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Copy these values to Coolify:\n');

    console.log('1️⃣  FIREBASE_ADMIN_CLIENT_EMAIL:');
    console.log('-----------------------------------------------------------');
    console.log(clientEmail);
    console.log('-----------------------------------------------------------\n');

    console.log('2️⃣  FIREBASE_ADMIN_PRIVATE_KEY:');
    console.log('-----------------------------------------------------------');
    console.log(privateKey);
    console.log('-----------------------------------------------------------\n');

    console.log('✨ The private key above is already in the correct format!');
    console.log('   Just copy it exactly as shown (including all \\n characters)\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error reading file:', error.message);
    console.log('\nMake sure:');
    console.log('  - The file path is correct');
    console.log('  - The file exists');
    console.log('  - The file is valid JSON\n');
  }

  readline.close();
});
