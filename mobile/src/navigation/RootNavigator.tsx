import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MainTabs } from './MainTabs';
import { ProductScreen } from '../screens/ProductScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Login independiente (después de restablecer contraseña) */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* Detalle y pago por encima de las tabs */}
      <Stack.Screen name="Product">
        {({ route, navigation }) => (
          <ProductScreen
            product={route.params.product}
            onBack={() => navigation.goBack()}
            onOpenCart={() => navigation.navigate('Main', { screen: 'Carrito' })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Checkout">
        {({ navigation }) => (
          <CheckoutScreen
            onBack={() => navigation.goBack()}
            onDone={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Legal">
        {({ navigation }) => <LegalScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
