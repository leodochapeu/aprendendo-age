/** Clã cadastrado no Supabase (`public.clans`). */
export type Clan = {
  id: string;
  name: string;
  tag: string;
  logoPath: string | null;
  /** ISO 3166-1 alpha-2, pela maioria dos países dos jogadores. Nulo se não houver maioria. */
  origin: string | null;
};
