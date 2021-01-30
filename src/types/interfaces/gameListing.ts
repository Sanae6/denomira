import { GameOptions } from "../../protocol/types/gameOptions.ts";

export interface GameListingOld {
  code: number;
  host: string;
  players: number;
  age: number;
  options: GameOptions;
}

export interface GameListing {
  host: string;
  port: number;
  code: number;
  name: string;
  players: number;
  age: number;
  map: number;
  impostors: number;
  maxPlayers: number;
}
