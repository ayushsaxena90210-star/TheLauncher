import { GameCard } from "./GameCard";
import type { Game } from "../../types/game";

type GameGridProps = {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
};

export function GameGrid({ games, onEdit, onDelete }: GameGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {games.map((game) => <GameCard game={game} key={game.id} onDelete={onDelete} onEdit={onEdit} />)}
    </div>
  );
}
