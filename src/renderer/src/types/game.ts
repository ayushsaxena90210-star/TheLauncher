export type Game = {
  id: string;
  title: string;
  executable_path: string;
  install_path: string | null;
  cover_path: string | null;
  description: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
};

export type GameFormValues = {
  title: string;
  executablePath: string;
};

export type CreateGameInput = {
  title: string;
  executable_path: string;
};

export type UpdateGameInput = Partial<CreateGameInput>;
