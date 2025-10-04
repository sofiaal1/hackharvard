export interface DeviceKey {
  publicKey: string;
  createdAt: string;
  deviceId: string;
}

export interface PhotoMetadata {
  timestamp: string;
  deviceModel: string;
  osVersion: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  exif?: any;
}

export interface C2PAManifest {
  version: string;
  claim: {
    imageHash: string;
    metadata: PhotoMetadata;
    timestamp: string;
  };
  signature: string;
  publicKey: string;
  deviceAttestation?: any;
}

export interface VerificationResult {
  isValid: boolean;
  manifest?: C2PAManifest;
  errors?: string[];
  timestamp?: string;
}
