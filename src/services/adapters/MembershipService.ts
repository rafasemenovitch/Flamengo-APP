import type { Benefit, Membership, MembershipPlan, MembershipProgramInfo } from '@/types/commerce';

/** Sócio-Torcedor: planos, carteirinha e benefícios. */
export interface MembershipService {
  getPlans(): Promise<MembershipPlan[]>;
  /** null quando o torcedor não é sócio. */
  getMembership(): Promise<Membership | null>;
  getBenefits(): Promise<Benefit[]>;
  /** Nome do programa, data de referência dos valores e fontes. */
  getProgramInfo(): Promise<MembershipProgramInfo>;
}
