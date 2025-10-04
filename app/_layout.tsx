import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { KeystoreService } from '../src/services/keystore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function testKeystore() {
      try {
        const key = await KeystoreService.getOrCreateDeviceKey();
        console.log('✅ Device Key Generated:', key.publicKey.substring(0, 20) + '...');
        
        const signature = await KeystoreService.signData('test message');
        console.log('✅ Signature Created:', signature.substring(0, 20) + '...');
        
        const isValid = KeystoreService.verifySignature(
          'test message', 
          signature, 
          key.publicKey
        );
        console.log('✅ Verification Result:', isValid);
      } catch (error) {
        console.error('❌ Keystore Test Failed:', error);
      }
    }
    testKeystore();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
