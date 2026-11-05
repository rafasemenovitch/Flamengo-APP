import type { Cart, OrderResult, Product, ProductCategory } from '@/types/commerce';

/** Loja: catálogo, carrinho e checkout SIMULADO (nunca pede dados de cartão). */
export interface StoreService {
  getProducts(category?: ProductCategory): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  getCart(): Promise<Cart>;
  addToCart(productId: string, size?: string, quantity?: number): Promise<Cart>;
  updateQuantity(productId: string, size: string | undefined, quantity: number): Promise<Cart>;
  clearCart(): Promise<Cart>;
  checkout(): Promise<OrderResult>;
}
