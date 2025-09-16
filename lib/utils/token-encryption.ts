/**
 * Token Encryption Utility
 * Provides application-level encryption for sensitive OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Get encryption key from environment or generate a secure key
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'fallback-dev-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';

/**
 * Derives a key from the base encryption key using scrypt
 * This ensures we have a proper 32-byte key for AES-256
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(ENCRYPTION_KEY, salt, 32)) as Buffer;
}

/**
 * Encrypts token data with AES-256-GCM
 * Returns base64 encoded encrypted data with salt and auth tag
 */
export async function encryptTokenData(tokenData: any): Promise<string> {
  try {
    const plaintext = JSON.stringify(tokenData);
    
    // Generate random salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    
    // Derive key from salt
    const key = await deriveKey(salt);
    
    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv, 
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
    
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token data');
  }
}

/**
 * Decrypts token data encrypted with encryptTokenData
 * Returns the original token object
 */
export async function decryptTokenData(encryptedData: string): Promise<any> {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 32);
    const authTag = combined.slice(32, 48);
    const encrypted = combined.slice(48);
    
    // Derive key from salt
    const key = await deriveKey(salt);
    
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
    
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token data');
  }
}

/**
 * Security check: Validates that encryption is properly configured
 */
export function validateEncryptionConfig(): boolean {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'fallback-dev-key-32-chars-long!!') {
    console.warn('⚠️  Using fallback encryption key - set TOKEN_ENCRYPTION_KEY in production');
    return false;
  }
  
  if (ENCRYPTION_KEY.length < 32) {
    console.error('❌ TOKEN_ENCRYPTION_KEY must be at least 32 characters long');
    return false;
  }
  
  return true;
}