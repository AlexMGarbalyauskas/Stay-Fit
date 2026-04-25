import { encryptMessage, decryptMessage, initializeEncryption, isEncryptionReady, clearEncryption } from '../../utils/crypto';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const installCryptoMock = () => {
  const originalCrypto = window.crypto;

  const subtle = {
    importKey: jest.fn(async () => ({ type: 'mock-key' })),
    deriveKey: jest.fn(async () => ({ type: 'derived-key' })),
    encrypt: jest.fn(async (_algorithm, _key, plaintextBytes) => {
      const plaintext = textDecoder.decode(plaintextBytes);
      return textEncoder.encode(`cipher:${plaintext}`).buffer;
    }),
    decrypt: jest.fn(async (_algorithm, _key, encryptedBytes) => {
      const encrypted = textDecoder.decode(encryptedBytes);
      const plaintext = encrypted.replace(/^cipher:/, '');
      return textEncoder.encode(plaintext).buffer;
    }),
  };

  const cryptoMock = {
    subtle,
    getRandomValues: jest.fn((array) => {
      array.fill(7);
      return array;
    }),
  };

  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: cryptoMock,
  });

  return () => {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  };
};

describe('crypto helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('encrypts and decrypts a message round-trip', async () => {
    const restoreCrypto = installCryptoMock();

    const originalMessage = 'Hello Stay Fit';
    const encryptedData = await encryptMessage(originalMessage, 1, 2);
    const decryptedMessage = await decryptMessage(
      encryptedData.encrypted,
      encryptedData.iv,
      1,
      2
    );

    expect(encryptedData.algorithm).toBe('AES-GCM');
    expect(encryptedData.encrypted).toBeTruthy();
    expect(encryptedData.iv).toBeTruthy();
    expect(decryptedMessage).toBe(originalMessage);

    restoreCrypto();
  });

  test('rejects empty message content', async () => {
    const restoreCrypto = installCryptoMock();

    await expect(encryptMessage('', 1, 2)).rejects.toThrow('Invalid message content');

    restoreCrypto();
  });

  test('initializes and clears encryption state', () => {
    expect(isEncryptionReady()).toBe(false);

    initializeEncryption('password123');
    expect(isEncryptionReady()).toBe(true);

    clearEncryption();
    expect(isEncryptionReady()).toBe(false);
  });

  test('returns placeholder when encrypted data cannot be decrypted', async () => {
    const restoreCrypto = installCryptoMock();

    const result = await decryptMessage('not-valid-base64', 'still-not-valid', 1, 2);
    expect(result).toBe('[Unable to decrypt message]');

    restoreCrypto();
  });
});
