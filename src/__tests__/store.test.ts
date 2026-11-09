import { createMockStoreService } from '@/services/mock/commerce';

import { createMockGamificationService } from '@/services/mock/gamification';

describe('loja (mock)', () => {
  const store = createMockStoreService();

  beforeEach(async () => {
    await store.clearCart();
  });

  it('soma itens, aplica desconto de sócio e frete', async () => {
    let cart = await store.addToCart('pr6'); // boné R$ 129,90, 10% sócio
    expect(cart.subtotal).toBeCloseTo(129.9);
    expect(cart.memberDiscount).toBeCloseTo(12.99);
    expect(cart.shipping).toBeGreaterThan(0);

    cart = await store.addToCart('pr1', 'M', 1); // camisa R$ 349,90 → frete grátis
    expect(cart.items).toHaveLength(2);
    expect(cart.shipping).toBe(0);
    expect(cart.total).toBeCloseTo(cart.subtotal - cart.memberDiscount);
  });

  it('mesma peça em tamanhos diferentes vira linhas separadas', async () => {
    await store.addToCart('pr1', 'M');
    const cart = await store.addToCart('pr1', 'G');
    expect(cart.items).toHaveLength(2);
  });

  it('checkout é simulado e esvazia o carrinho', async () => {
    await store.addToCart('pr7');
    const order = await store.checkout();
    expect(order.isDemo).toBe(true);
    expect(order.orderId).toMatch(/^DEMO-/);
    expect((await store.getCart()).items).toHaveLength(0);
  });

  it('não finaliza carrinho vazio', async () => {
    await expect(store.checkout()).rejects.toThrow('Carrinho vazio');
  });
});

describe('pé quente (mock)', () => {
  it('conta vitórias seguidas nos jogos do Passaporte', async () => {
    const p = await createMockGamificationService().getProgress();
    expect(p.luckyStreak).toBe(3);
    expect(p.bestLuckyStreak).toBe(4);
    expect(p.luckyFriends.some((f) => f.streak > p.luckyStreak)).toBe(true);
  });
});
