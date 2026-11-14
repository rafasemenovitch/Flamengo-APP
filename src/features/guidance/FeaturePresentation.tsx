import type { RootScreenProps } from '@/navigation/types';
import { WelcomeCarousel } from '@/features/onboarding/WelcomeCarousel';

/** "Rever apresentação" (configurações): o mesmo carrossel das boas-vindas, sempre atualizado. */
export function FeaturePresentationScreen({ navigation }: RootScreenProps<'FeaturePresentation'>) {
  return <WelcomeCarousel mode="tour" onClose={() => navigation.goBack()} />;
}
