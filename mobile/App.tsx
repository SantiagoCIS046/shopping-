import React from 'react';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

/**
 * Deep links soportados:
 * - tiendaropa://reset-password?token=...  (app instalada / dev build)
 * - exp://192.168.x.x:8081/--/reset-password?token=...  (Expo Go)
 */
const linking = {
  prefixes: ['tiendaropa://', Linking.createURL('/')],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.accent,
    text: colors.text,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer linking={linking} theme={theme}>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
