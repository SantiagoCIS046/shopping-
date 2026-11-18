import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from '../screens/CatalogScreen';
import { ProductScreen } from '../screens/ProductScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { products } from '../data/products';
import { colors } from '../theme/tokens';

export type RootStackParamList = {
  Catalog: undefined;
  Product: { productId: string };
  Checkout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Catalog">
        {({ navigation }) => (
          <CatalogScreen
            onOpenProduct={(p) => navigation.navigate('Product', { productId: p.id })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Product">
        {({ route, navigation }) => {
          const product = products.find((p) => p.id === route.params.productId);
          if (!product) return null;
          return <ProductScreen product={product} onBack={() => navigation.goBack()} />;
        }}
      </Stack.Screen>

      <Stack.Screen name="Checkout">
        {({ navigation }) => (
          <CheckoutScreen
            onBack={() => navigation.goBack()}
            // TODO: crear el pedido en el backend y abrir la pasarela o los datos de transferencia.
            onConfirm={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
