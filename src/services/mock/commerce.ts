import { BENEFITS, MEMBERSHIP_PLANS, MEMBERSHIP_PROGRAM, PRODUCTS } from '@/data/demo/commerce';
import { DEMO_MEMBERSHIP } from '@/data/demo/fan';
import type { MembershipService, StoreService } from '@/services/adapters';
import type { Cart, CartItem } from '@/types/commerce';
import { delay, newId, NotFoundError } from './utils';

const FREE_SHIPPING_FROM = 299;
const SHIPPING = 24.9;

let cartItems: CartItem[] = [];

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildCart(): Cart {
  const items = cartItems.map((ci) => {
    const product = PRODUCTS.find((p) => p.id === ci.productId)!;
    return { ...ci, product, lineTotal: round2(product.price * ci.quantity) };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  // Torcedor demo é sócio: aplica o desconto de cada produto.
  const memberDiscount = round2(items.reduce((s, i) => s + (i.lineTotal * i.product.memberDiscountPct) / 100, 0));
  const shipping = subtotal === 0 || subtotal - memberDiscount >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { items, subtotal, memberDiscount, shipping, total: round2(subtotal - memberDiscount + shipping) };
}

const sameLine = (a: CartItem, productId: string, size?: string) => a.productId === productId && a.size === size;

export function createMockStoreService(): StoreService {
  return {
    getProducts: async (category) => delay(PRODUCTS.filter((p) => !category || p.category === category)),
    getProduct: async (id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) throw new NotFoundError('Produto', id);
      return delay(p);
    },
    getCart: async () => delay(buildCart(), 150),
    async addToCart(productId, size, quantity = 1) {
      if (!PRODUCTS.some((p) => p.id === productId)) throw new NotFoundError('Produto', productId);
      const existing = cartItems.find((i) => sameLine(i, productId, size));
      if (existing) existing.quantity += quantity;
      else cartItems.push({ productId, size, quantity });
      return delay(buildCart(), 200);
    },
    async updateQuantity(productId, size, quantity) {
      cartItems = cartItems
        .map((i) => (sameLine(i, productId, size) ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      return delay(buildCart(), 150);
    },
    async clearCart() {
      cartItems = [];
      return delay(buildCart(), 100);
    },
    /** Checkout SIMULADO: nunca pede nem processa dados de pagamento. */
    async checkout() {
      const cart = buildCart();
      if (cart.items.length === 0) throw new Error('Carrinho vazio.');
      cartItems = [];
      return delay({ orderId: newId('DEMO'), total: cart.total, createdAt: new Date().toISOString(), isDemo: true as const }, 1000);
    },
  };
}

export function createMockMembershipService(): MembershipService {
  return {
    getPlans: async () => delay(MEMBERSHIP_PLANS),
    getMembership: async () => delay(DEMO_MEMBERSHIP),
    getBenefits: async () => delay(BENEFITS),
    getProgramInfo: async () => delay(MEMBERSHIP_PROGRAM, 100),
  };
}
