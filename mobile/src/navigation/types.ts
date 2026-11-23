import type { Product } from '../data/products';

export type MainTabParamList = {
  Tienda: undefined;
  Vista: undefined;
  Carrito: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Main: { screen?: keyof MainTabParamList } | undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Product: { product: Product };
  Checkout: undefined;
  Legal: undefined;
};
