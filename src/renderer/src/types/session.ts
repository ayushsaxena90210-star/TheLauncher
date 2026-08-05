export type RecentGame = {
  game_id: string;
  game_title: string;
  game_cover_path: string | null;
  last_played_at: string;
  total_play_time_seconds: number;
};

export type GameSession = { id: string; game_id: string; started_at: string; ended_at: string | null; duration_seconds: number | null; };
export type GameActivity = { total_play_time_seconds: number; last_played_at: string | null; launch_count: number; sessions: GameSession[]; };
