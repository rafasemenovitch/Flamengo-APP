import type { Benefit, Membership, MembershipPlan } from '@/types/commerce';

/** Sócio-Torcedor: planos, carteirinha e benefícios. */
export interface MembershipService {
  getPlans(): Promise<MembershipPlan[]>;
  /** null quando o torcedor não é sócio. */
  getMembership(): Promise<Membership | null>;
  getBenefits(): Promise<Benefit[]>;
}
