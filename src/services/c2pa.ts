import { sha256 } from '@noble/hashes/sha256';
import * as FileSystem from 'expo-file-system';
import { C2PAManifest, PhotoMetadata, VerificationResult } from '../types';
import { KeystoreService } from './keystore';

export class C2PAService {
  
  // Hash image file
  static async hashImage(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = Buffer.from(base64, 'base64');
    const hash = sha256(bytes);
    return Buffer.from(hash).toString('hex');
  }
  
  // Create and sign C2PA manifest
  static async signPhoto(uri: string, metadata: PhotoMetadata): Promise<C2PAManifest> {
    // Hash the image
    const imageHash = await this.hashImage(uri);
    
    // Get device key
    const deviceKey = await KeystoreService.getOrCreateDeviceKey();
    
    // Create claim
    const claim = {
      imageHash,
      metadata,
      timestamp: new Date().toISOString(),
    };
    
    // Serialize claim for signing
    const claimString = JSON.stringify(claim);
    
    // Sign with device key
    const signature = await KeystoreService.signData(claimString);
    
    // Create full manifest
    const manifest: C2PAManifest = {
      version: '1.0',
      claim,
      signature,
      publicKey: deviceKey.publicKey,
    };
    
    return manifest;
  }
  
  // Verify C2PA manifest
  static async verifyPhoto(uri: string, manifest: C2PAManifest): Promise<VerificationResult> {
    const errors: string[] = [];
    
    try {
      // 1. Verify image hash
      const currentHash = await this.hashImage(uri);
      if (currentHash !== manifest.claim.imageHash) {
        errors.push('Image has been modified');
      }
      
      // 2. Verify signature
      const claimString = JSON.stringify(manifest.claim);
      const isValidSig = KeystoreService.verifySignature(
        claimString,
        manifest.signature,
        manifest.publicKey
      );
      
      if (!isValidSig) {
        errors.push('Invalid signature');
      }
      
      // 3. Check timestamp is reasonable
      const claimTime = new Date(manifest.claim.timestamp).getTime();
      const now = Date.now();
      if (claimTime > now) {
        errors.push('Timestamp is in the future');
      }
      
      return {
        isValid: errors.length === 0,
        manifest,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: manifest.claim.timestamp,
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Verification failed: ${error.message}`],
      };
    }
  }
}
