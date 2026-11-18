import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { CartProvider } from './src/context/CartContext';
import { colors } from './src/theme/tokens';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </CartProvider>
    </SafeAreaProvider>
  );
}
