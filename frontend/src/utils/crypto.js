// End-to-End Encryption for Messages using AES-GCM
// Uses Web Crypto API for secure, browser-native encryption

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Generate a cryptographic key from a password using PBKDF2
 * @param {string} password - User password or passphrase
 * @param {string} salt - Unique salt (can use userId combination)
 * @returns {Promise<CryptoKey>} - Encryption key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  
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

/**
 * Generate a unique conversation key for two users
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @returns {string} - Deterministic key for the conversation
 */
function getConversationKey(userId1, userId2) {
  // Sort IDs to ensure same key regardless of who initiates
  const [id1, id2] = [userId1, userId2].sort((a, b) => a - b);
  return `conv_${id1}_${id2}`;
}

/**
 * Generate or retrieve encryption key for a conversation
 * @param {number} currentUserId - Current user's ID
 * @param {number} otherUserId - Other user's ID
 * @returns {Promise<CryptoKey>} - Encryption key for the conversation
 */
async function getOrCreateConversationKey(currentUserId, otherUserId) {
  const conversationId = getConversationKey(currentUserId, otherUserId);
  
  // In a real app, you'd retrieve this from secure storage
  // For now, derive from conversation ID + user credentials
  // This means both users can independently derive the same key
  const masterPassword = localStorage.getItem('encryption_seed') || 'stay-fit-default-seed';
  
  return await deriveKey(masterPassword, conversationId);
}

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
    const encoder = new TextEncoder();
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

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return placeholder for failed decryptions
    return '[Unable to decrypt message]';
  }
}

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

/**
 * Check if encryption is properly initialized
 * @returns {boolean}
 */
export function isEncryptionReady() {
  return !!localStorage.getItem('encryption_seed');
}

/**
 * Clear encryption data (on logout)
 */
export function clearEncryption() {
  localStorage.removeItem('encryption_seed');
}
