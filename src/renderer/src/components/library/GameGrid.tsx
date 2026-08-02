import { GameCard } from "./GameCard";
import type { Game } from "../../types/game";

type GameLaunchState = {
  state: "idle" | "launching" | "running" | "error";
  error: string | null;
};

type GameGridProps = {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  onLaunch: (game: Game) => void;
  onOpenFileLocation: (game: Game) => void;
  getLaunchState: (gameId: string) => GameLaunchState;
  getMetadataState: (gameId: string) => "idle" | "queued" | "fetching" | "success" | "failed";
  onFetchMetadata: (game: Game) => void;
};

export function GameGrid({ games, onEdit, onDelete, onLaunch, onOpenFileLocation, getLaunchState, getMetadataState, onFetchMetadata }: GameGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {games.map((game) => {
        const { state, error } = getLaunchState(game.id);
        return (
          <GameCard
            game={game}
            key={game.id}
            launchError={error}
            launchState={state}
            metadataState={getMetadataState(game.id)}
            onDelete={onDelete}
            onEdit={onEdit}
            onLaunch={onLaunch}
            onOpenFileLocation={onOpenFileLocation}
            onFetchMetadata={onFetchMetadata}
          />
        );
      })}
    </div>
  );
}
