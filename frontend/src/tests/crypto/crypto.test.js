// This test suite verifies the 
// functionality of the crypto helper 
// functions, including encryption and 
// decryption of messages, initialization 
// and clearing of encryption state, 
// and handling of edge cases such as empty 
// messages and invalid encrypted data. 
// It uses a mock implementation of the 
// Web Crypto API to simulate encryption and 
// decryption without relying on actual 
// cryptographic operations, allowing for 
// consistent and predictable testing outcomes.



// crypto.test.js

//imports
import { encryptMessage, decryptMessage, initializeEncryption, isEncryptionReady, clearEncryption } from '../../utils/crypto';
//imports end

// The test suite includes tests to check that
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();


// A helper function to mock 
// the Web Crypto API for testing purposes
const installCryptoMock = () => {
  const originalCrypto = window.crypto;

  // Mock implementation of the SubtleCrypto interface
  const subtle = {
    importKey: jest.fn(async () => ({ type: 'mock-key' })),
    deriveKey: jest.fn(async () => ({ type: 'derived-key' })),
    encrypt: jest.fn(async (_algorithm, _key, plaintextBytes) => {
      const plaintext = textDecoder.decode(plaintextBytes);
      return textEncoder.encode(`cipher:${plaintext}`).buffer;
    }),

    // Mock decryption by removing the "cipher:" prefix
    decrypt: jest.fn(async (_algorithm, _key, encryptedBytes) => {
      const encrypted = textDecoder.decode(encryptedBytes);
      const plaintext = encrypted.replace(/^cipher:/, '');
      return textEncoder.encode(plaintext).buffer;
    }),
  };

  // Mock getRandomValues to return a predictable IV
  const cryptoMock = {
    subtle,
    getRandomValues: jest.fn((array) => {
      array.fill(7);
      return array;
    }),
  };


  // Replace the global crypto object with the mock
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: cryptoMock,
  });


  // Return a function to restore the original crypto implementation after tests
  return () => {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  };
};


// The test suite includes tests to check that
describe('crypto helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });


  // Restore the original crypto implementation after each test to avoid side effects
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });


  // Test that encrypting and then decrypting a message returns the original message
  test('encrypts and decrypts a message round-trip', async () => {
    const restoreCrypto = installCryptoMock();


    // Encrypt a sample message and then decrypt it, verifying that the decrypted message matches the original
    const originalMessage = 'Hello Stay Fit';
    const encryptedData = await encryptMessage(originalMessage, 1, 2);
    
    // Decrypt the previously encrypted message and verify that it matches the original message
    const decryptedMessage = await decryptMessage(
      encryptedData.encrypted,
      encryptedData.iv,
      1,
      2
    );

    // Verify that the encrypted data has the expected structure and that decryption returns the original message
    expect(encryptedData.algorithm).toBe('AES-GCM');
    expect(encryptedData.encrypted).toBeTruthy();
    expect(encryptedData.iv).toBeTruthy();
    expect(decryptedMessage).toBe(originalMessage);

    restoreCrypto();
  });


  // Test that encrypting an empty message throws an error
  test('rejects empty message content', async () => {
    const restoreCrypto = installCryptoMock();

    await expect(encryptMessage('', 1, 2)).rejects.toThrow('Invalid message content');

    restoreCrypto();
  });


  // Test that the encryption state can be initialized and cleared correctly
  test('initializes and clears encryption state', () => {
    expect(isEncryptionReady()).toBe(false);

    // Initialize encryption with a sample password and verify that the encryption state is ready
    initializeEncryption('password123');
    expect(isEncryptionReady()).toBe(true);

    // Clear the encryption state and verify that it is no longer ready
    clearEncryption();
    expect(isEncryptionReady()).toBe(false);
  });



  // Test that decrypting invalid encrypted data returns a placeholder message
  test('returns placeholder when encrypted data cannot be decrypted', async () => {
    const restoreCrypto = installCryptoMock();

    // Attempt to decrypt data that is not valid encrypted content and verify that the function returns a placeholder message instead of throwing an error
    const result = await decryptMessage('not-valid-base64', 'still-not-valid', 1, 2);
    expect(result).toBe('[Unable to decrypt message]');

    restoreCrypto();
  });
});
