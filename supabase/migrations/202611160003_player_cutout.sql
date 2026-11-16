-- Foto do jogador sem o fundo branco (feita pela sync-football a partir da original).
alter table public.football_players add column if not exists photo_cutout_path text;
