// Cryptographic hashing utilities for immutability and integrity

import CryptoJS from 'crypto-js';

/**
 * Generate SHA-256 hash of data for immutability verification
 */
export function generateHash(data: any): string {
  const stringified = JSON.stringify(data, Object.keys(data).sort());
  return CryptoJS.SHA256(stringified).toString();
}

/**
 * Generate SHA-256 hash of a file (client-side)
 */
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
      const hash = CryptoJS.SHA256(wordArray).toString();
      resolve(hash);
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Verify hash matches data
 */
export function verifyHash(data: any, hash: string): boolean {
  return generateHash(data) === hash;
}

/**
 * Generate device fingerprint for audit trail
 */
export function generateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
  ];

  return generateHash(components);
}

/**
 * Encrypt data for offline storage (AES-256)
 */
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypt data from offline storage
 */
export function decryptData(encrypted: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
