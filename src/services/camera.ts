import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { PhotoMetadata } from '../types';

export class CameraService {
  
  // Request permissions
  static async requestPermissions() {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return camera.granted && media.granted;
  }
  
  // Take photo with metadata
  static async takePhoto(): Promise<{uri: string, metadata: PhotoMetadata}> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      exif: true,
      allowsEditing: false,
    });
    
    if (result.canceled) {
      throw new Error('Camera cancelled');
    }
    
    const metadata: PhotoMetadata = {
      timestamp: new Date().toISOString(),
      deviceModel: Device.modelName || 'unknown',
      osVersion: `${Device.osName} ${Device.osVersion}`,
      exif: result.assets[0].exif,
      location: result.assets[0].exif?.GPSLatitude ? {
        latitude: result.assets[0].exif.GPSLatitude,
        longitude: result.assets[0].exif.GPSLongitude,
      } : undefined,
    };
    
    return {
      uri: result.assets[0].uri,
      metadata,
    };
  }
  
  // Pick existing photo for verification
  static async pickPhoto(): Promise<string> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    
    if (result.canceled) {
      throw new Error('Selection cancelled');
    }
    
    return result.assets[0].uri;
  }
}
