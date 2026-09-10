export interface Team {
  id: string;
  name: string;
  points: number;
  elims: number;
  players: boolean[]; // Array of 4 booleans, true = alive
}
