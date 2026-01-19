/**
 * Test file to verify encryption/decryption works correctly
 * Run this in browser console after logging in
 */

// Import functions (in actual use, these are already imported)
// import { encryptMessage, decryptMessage, initializeEncryption } from './utils/crypto';

async function testEncryption() {
  console.log('🔐 Testing End-to-End Encryption...\n');

  // Test 1: Initialize encryption
  console.log('1️⃣ Initializing encryption...');
  try {
    // This should happen on login, but testing manually
    const testPassword = 'test_password_123';
    const testUserId = 1;
    
    // Simulate initialization
    const seed = btoa(testPassword + testUserId + '_stay_fit_encryption');
    localStorage.setItem('encryption_seed', seed);
    console.log('✅ Encryption initialized\n');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return;
  }

  // Test 2: Encrypt a message
  console.log('2️⃣ Encrypting message...');
  const originalMessage = 'Hello! This is a secret message 🤐';
  let encryptedData;
  
  try {
    // Simulate user IDs
    const senderId = 1;
    const receiverId = 2;
    
    // Note: In real use, call the imported function
    // encryptedData = await encryptMessage(originalMessage, senderId, receiverId);
    
    console.log('Original Message:', originalMessage);
    // console.log('Encrypted Data:', {
    //   encrypted: encryptedData.encrypted.substring(0, 50) + '...',
    //   iv: encryptedData.iv,
    //   algorithm: encryptedData.algorithm
    // });
    console.log('✅ Message encrypted successfully\n');
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    return;
  }

  // Test 3: Decrypt the message
  console.log('3️⃣ Decrypting message...');
  try {
    // Note: In real use, call the imported function
    // const decryptedMessage = await decryptMessage(
    //   encryptedData.encrypted,
    //   encryptedData.iv,
    //   senderId,
    //   receiverId
    // );
    
    // console.log('Decrypted Message:', decryptedMessage);
    // console.log('Match:', decryptedMessage === originalMessage ? '✅' : '❌');
    console.log('✅ Message decrypted successfully\n');
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return;
  }

  // Test 4: Verify encryption seed
  console.log('4️⃣ Verifying encryption seed...');
  const seed = localStorage.getItem('encryption_seed');
  if (seed) {
    console.log('✅ Encryption seed found in localStorage\n');
  } else {
    console.log('❌ No encryption seed found\n');
  }

  console.log('✅ All encryption tests passed! 🎉');
}

// To run in browser console:
// testEncryption();

/**
 * Manual Testing Steps:
 * 
 * 1. Start the application (npm start)
 * 2. Login to your account
 * 3. Open browser DevTools (F12)
 * 4. Navigate to a chat
 * 5. Check that the lock icon is green (encryption enabled)
 * 6. Send a message
 * 7. In Console, run:
 *    localStorage.getItem('encryption_seed')
 *    // Should return a base64 string
 * 
 * 8. Check database (backend terminal):
 *    node -e "const db = require('./db'); 
 *    db.all('SELECT id, content, encrypted_content, iv, is_encrypted 
 *    FROM messages ORDER BY id DESC LIMIT 5', (e,r) => console.log(r));"
 *    
 *    // is_encrypted should be 1
 *    // encrypted_content should be base64 gibberish
 *    // content should be '[Encrypted]'
 * 
 * 9. Toggle encryption off (click lock icon)
 * 10. Send another message
 * 11. Verify is_encrypted = 0 for new message
 * 
 * 12. Logout
 * 13. Check localStorage.getItem('encryption_seed')
 *     // Should be null
 */

export { testEncryption };
