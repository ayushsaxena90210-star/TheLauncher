import { request } from "./client";
import type { RecentGame } from "../types/session";

export const sessionService = {
  recentGames: (limit = 8): Promise<RecentGame[]> =>
    request<RecentGame[]>(`/sessions/recent?limit=${limit}`),
};
