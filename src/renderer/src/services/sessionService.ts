import { request } from "./client";
import type { GameActivity, RecentGame } from "../types/session";

export const sessionService = {
  recentGames: (limit = 8): Promise<RecentGame[]> =>
    request<RecentGame[]>(`/sessions/recent?limit=${limit}`),
  activity: (gameId: string): Promise<GameActivity> => request<GameActivity>(`/sessions/games/${gameId}/activity`),
};
