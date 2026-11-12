import Svg, { Path } from 'react-native-svg';

import type { PoiCategory } from '@/services/stadium/types';
import { PICTOGRAMS } from '../../../../map/web/icons';

/** O mesmo pictograma do mapa (map/web/icons.ts), em qualquer cor e tamanho. */
export function Pictogram({
  category,
  size = 24,
  color,
}: {
  category: PoiCategory;
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {PICTOGRAMS[category]!.map((st, i) => (
        <Path
          key={i}
          d={st.d}
          fill={st.fill ? color : 'none'}
          stroke={st.fill ? 'none' : color}
          strokeWidth={st.width ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
