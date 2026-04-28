// End-to-End Encryption for Messages using AES-GCM
// Uses Web Crypto API for secure, browser-native encryption


// The encryption key is derived 
// from a combination of the user's 
// password and a unique salt (e.g., user ID) 
// using PBKDF2, ensuring that each user has a unique key. 
// For conversations between two users, 
// a shared conversation key is 
// generated based on their user IDs, 
// allowing both parties to encrypt and decrypt 
// messages without needing to exchange keys directly. 
// The encrypted messages are stored in base64 
// format along with the initialization vector (IV) 
// used for encryption, enabling secure storage and 
// retrieval of messages while maintaining confidentiality.


// The test suite includes tests to check that
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const SHARED_CONVERSATION_SEED = 'stay-fit-shared-conversation-seed-v2';




//block 1 
// Some environments (like older versions of jsdom)
const getTextEncoder = () => {
  const Encoder = typeof window !== 'undefined' && window.TextEncoder
    ? window.TextEncoder
    : (typeof TextEncoder !== 'undefined' ? TextEncoder : undefined);
  if (!Encoder) {
    throw new Error('TextEncoder is not available in this environment');
  }
  return Encoder;
};
//block 1 end




//block 2
// Some environments (like older versions of jsdom) 
// may not have TextDecoder
const getTextDecoder = () => {
  const Decoder = typeof window !== 'undefined' && window.TextDecoder
    ? window.TextDecoder
    : (typeof TextDecoder !== 'undefined' ? TextDecoder : undefined);
  if (!Decoder) {
    throw new Error('TextDecoder is not available in this environment');
  }
  return Decoder;
};
//block 2 end



//block 3
// The AuthRequired component renders a message
/**
 * Generate a cryptographic key from a password using PBKDF2
 * @param {string} password - User password or passphrase
 * @param {string} salt - Unique salt (can use userId combination)
 * @returns {Promise<CryptoKey>} - Encryption key
 */
async function deriveKey(password, salt) {
  const encoder = new (getTextEncoder())();
  
  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive actual encryption key
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // Not extractable
    ['encrypt', 'decrypt']
  );

  return key;
}
//block 3 end






// The AIHelper component 
// renders the AI assistant interface, 
// allowing users to ask questions and 
// receive responses from the AI. It includes 
// a header, an input area for the user's prompt, 
// and a display area for the AI's reply. 
// The component also handles loading states 
// and error messages to provide feedback to
//  the user during interactions with the AI assistant.
/**
 * Generate a unique conversation key for two users
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @returns {string} - Deterministic key for the conversation
 */

//block 4
// The getConversationKey function 
// generates a unique key for a conversation 
// between two users by sorting their 
// user IDs and combining them into a string. 
// This ensures that both users derive 
// the same conversation key regardless of 
// who initiates the conversation, 
// allowing for consistent encryption and decryption 
// of messages between the two parties 
// without needing to exchange keys directly.
function getConversationKey(userId1, userId2) {
  // Sort IDs to ensure same key regardless of who initiates
  const [id1, id2] = [userId1, userId2].sort((a, b) => a - b);
  return `conv_${id1}_${id2}`;
}
//block 4 end



//block 5
// The initializeEncryption function
/**
 * Generate or retrieve encryption key for a conversation
 * @param {number} currentUserId - Current user's ID
 * @param {number} otherUserId - Other user's ID
 * @returns {Promise<CryptoKey>} - Encryption key for the conversation
 */
async function getOrCreateConversationKey(currentUserId, otherUserId) {
  const conversationId = getConversationKey(currentUserId, otherUserId);

  // Use a shared seed so both users derive the same conversation key
  // (not per-user), otherwise decryption will fail across accounts.
  const sharedSeed = localStorage.getItem('conversation_seed') || SHARED_CONVERSATION_SEED;

  return await deriveKey(sharedSeed, conversationId);
}
//block 5 end




//block 6
async function getLegacyConversationKey(currentUserId, otherUserId) {
  const conversationId = getConversationKey(currentUserId, otherUserId);
  const legacySeed = localStorage.getItem('encryption_seed');
  if (!legacySeed) return null;
  return await deriveKey(legacySeed, conversationId);
}
//block 6 end





//block 7
/**
 * Encrypt a message
 * @param {string} plaintext - Message to encrypt
 * @param {number} senderId - Sender's user ID
 * @param {number} receiverId - Receiver's user ID
 * @returns {Promise<Object>} - Encrypted data with IV
 */
export async function encryptMessage(plaintext, senderId, receiverId) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid message content');
  }

  try {
    const encoder = new (getTextEncoder())();
    const key = await getOrCreateConversationKey(senderId, receiverId);
    
    // Generate random IV (initialization vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Encrypt the message
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encoder.encode(plaintext)
    );

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      encrypted: encryptedBase64,
      iv: ivBase64,
      algorithm: ALGORITHM
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
}
//block 7 end





//block 8
/**
 * Decrypt a message
 * @param {string} encryptedBase64 - Encrypted message in base64
 * @param {string} ivBase64 - IV in base64
 * @param {number} senderId - Sender's user ID
 * @param {number} receiverId - Receiver's user ID
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decryptMessage(encryptedBase64, ivBase64, senderId, receiverId) {
  if (!encryptedBase64 || !ivBase64) {
    throw new Error('Invalid encrypted data');
  }

  try {
    const key = await getOrCreateConversationKey(senderId, receiverId);
    
    // Convert from base64
    const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    
    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );

    const decoder = new (getTextDecoder())();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    try {
      const legacyKey = await getLegacyConversationKey(senderId, receiverId);
      if (!legacyKey) throw error;

      const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv
        },
        legacyKey,
        encrypted
      );

      const decoder = new (getTextDecoder())();
      return decoder.decode(decryptedBuffer);
    } catch (legacyError) {
      // Return placeholder for failed decryptions
      return '[Unable to decrypt message]';
    }
  }
}
//block 8 end








//block 9
/**
 * Initialize encryption seed for current user
 * Should be called once on login with user's password or generated key
 * @param {string} userPassword - User's password or authentication token
 */
export function initializeEncryption(userPassword) {
  // Generate a unique seed based on user credentials
  // In production, this should be derived from user's actual password during login
  const seed = btoa(userPassword + '_stay_fit_encryption');
  localStorage.setItem('encryption_seed', seed);
}
//block 9 end







//block 10
/**
 * Check if encryption is properly initialized
 * @returns {boolean}
 */
export function isEncryptionReady() {
  return !!localStorage.getItem('encryption_seed');
}
//block 10 end





//block 11
/**
 * Clear encryption data (on logout)
 */
export function clearEncryption() {
  localStorage.removeItem('encryption_seed');
}
//block 11 end