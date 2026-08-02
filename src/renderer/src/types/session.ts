export type RecentGame = {
  game_id: string;
  game_title: string;
  game_cover_path: string | null;
  last_played_at: string;
  total_play_time_seconds: number;
};
