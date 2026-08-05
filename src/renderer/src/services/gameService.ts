import { request } from "./client";
import type { CreateGameInput, Game, UpdateGameInput } from "../types/game";

export const gameService = {
  list: (): Promise<Game[]> => request<Game[]>("/games"),
  get: (id: string): Promise<Game> => request<Game>(`/games/${id}`),
  screenshots: (id: string): Promise<{ index: number }[]> => request<{ index: number }[]>(`/metadata/games/${id}/screenshots`),
  create: (input: CreateGameInput): Promise<Game> =>
    request<Game>("/games", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateGameInput): Promise<Game> =>
    request<Game>(`/games/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string): Promise<void> => request<void>(`/games/${id}`, { method: "DELETE" }),
};
