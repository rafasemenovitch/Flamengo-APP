/**
 * PONTO ÚNICO de escolha da fonte de dados.
 *
 *   EXPO_PUBLIC_DATA_SOURCE=demo  → src/services/mock (dados de src/data/demo)
 *   EXPO_PUBLIC_DATA_SOURCE=live  → src/services/live (integrações reais)
 *
 * A UI só conhece `services` e as interfaces de services/adapters.
 */
import type { Services } from './adapters';
import { createLiveServices } from './live';
import { createMockServices } from './mock';

export type DataSource = 'demo' | 'live';

export const DATA_SOURCE: DataSource = process.env.EXPO_PUBLIC_DATA_SOURCE === 'live' ? 'live' : 'demo';

export const IS_DEMO = DATA_SOURCE === 'demo';

export const services: Services = IS_DEMO ? createMockServices() : createLiveServices();

export type * from './adapters';
export { demoScenario, DEMO_SCENARIOS, type DemoScenario } from './mock';
