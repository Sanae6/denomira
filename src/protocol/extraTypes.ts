import { GameOptions } from "./gameOptions.ts";

export enum GameOverReason {
  CrewmatesByVote,
  CrewmatesByTask,
  ImpostorsByVote,
  ImpostorsByKill,
  ImpostorsBySabotage,
  ImpostorDisconnect,
  CrewmateDisconnect
}

export enum AlterGameTag {
  Publicity = 1
}

export enum AlteredPublicity {
  Private = 0,
  Public = 1
}

export interface GameListingOld {
  code: number,
  host: string,
  players: number,
  age: number,
  options: GameOptions
}

export interface GameListing {
  host: string,
  port: number,
  code: number,
  name: string,
  players: number,
  age: number
  map: number,
  impostors: number,
  maxPlayers: number
}

export interface MasterServer {
  name: string,
  host: string,
  port: number,
  clients: number
}