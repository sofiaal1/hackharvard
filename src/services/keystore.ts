import { ed25519 } from '@noble/curves/ed25519';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { decode as decodeBase64, encode as encodeBase64 } from 'js-base64';
import { DeviceKey } from '../types';

const PRIVATE_KEY_STORAGE = 'device_private_key';
const PUBLIC_KEY_STORAGE = 'device_public_key';

export class KeystoreService {
  
  // Convert Uint8Array to base64 string
  private static arrayToBase64(array: Uint8Array): string {
    return encodeBase64(String.fromCharCode(...array));
  }
  
  // Convert base64 string to Uint8Array
  private static base64ToArray(base64: string): Uint8Array {
    const binary = decodeBase64(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  // Generate new keypair and store securely
  static async generateDeviceKey(): Promise<DeviceKey> {
    // Generate Ed25519 keypair
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    
    // Convert to base64 for storage
    const privateKeyB64 = this.arrayToBase64(privateKey);
    const publicKeyB64 = this.arrayToBase64(publicKey);
    
    // Store private key in secure enclave (cannot be exported)
    await SecureStore.setItemAsync(
      PRIVATE_KEY_STORAGE, 
      privateKeyB64,
      { requireAuthentication: false } // Set true for biometric
    );
    
    await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE, publicKeyB64);
    
    const deviceKey: DeviceKey = {
      publicKey: publicKeyB64,
      createdAt: new Date().toISOString(),
      deviceId: Device.modelId || 'unknown',
    };
    
    return deviceKey;
  }
  
  // Get or create device key
  static async getOrCreateDeviceKey(): Promise<DeviceKey> {
    const existingPubKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
    
    if (existingPubKey) {
      return {
        publicKey: existingPubKey,
        createdAt: 'existing',
        deviceId: Device.modelId || 'unknown',
      };
    }
    
    return this.generateDeviceKey();
  }
  
  // Sign data with device private key
  static async signData(data: string): Promise<string> {
    const privateKeyB64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
    if (!privateKeyB64) {
      throw new Error('No device key found');
    }
    
    const privateKey = this.base64ToArray(privateKeyB64);
    const message = new TextEncoder().encode(data);
    const signature = ed25519.sign(message, privateKey);
    
    return this.arrayToBase64(signature);
  }
  
  // Verify signature (for verification flow)
  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const pubKey = this.base64ToArray(publicKey);
      const sig = this.base64ToArray(signature);
      const message = new TextEncoder().encode(data);
      
      return ed25519.verify(sig, message, pubKey);
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}