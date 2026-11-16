import { Avatar } from '@/design-system';
import { findSquadPlayer, playerPhoto, useFootballVersion } from '@/state/football';

/**
 * Avatar de jogador do Flamengo com a foto real (recortada) quando o Supabase já tem; senão,
 * o número. Aceita o jogador ou só o id (escalações guardam o id).
 */
export function PlayerAvatar({
  player,
  playerId,
  name,
  number,
  size = 40,
}: {
  player?: { id: string; apiId?: number; shortName: string; number: number };
  playerId?: string;
  name?: string;
  number?: number;
  size?: number;
}) {
  useFootballVersion();
  const p = player ?? (playerId ? findSquadPlayer(playerId) : undefined);
  return (
    <Avatar
      name={name ?? p?.shortName ?? ''}
      number={number ?? p?.number}
      size={size}
      photo={playerPhoto(p)}
    />
  );
}
