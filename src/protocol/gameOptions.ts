import Message from "../util/message.ts";

export type GameOptions = GameOptionsV1 | GameOptionsV2 | GameOptionsV3 | GameOptionsV4

export interface GameOptionsV1 {
  version: 1 | number,
  maxPlayers: number,
  keywords: GameKeywords, //bitfield
  map: GameMap,
  playerSpeed: number,
  crewmateVision: number,
  impostorVision: number,
  killCooldown: number,
  commonTasks: number,
  longTasks: number,
  shortTasks: number,
  emergencies: number,
  maxImpostors: number,
  killDistance: GameKillDistance,
  discussionTime: number,
  votingTime: number,
  isDefaults: boolean,
}

export interface GameOptionsV2 extends GameOptionsV1 {
  version: 2 | number,
  emergencyCooldown: number,
}

export interface GameOptionsV3 extends GameOptionsV2 {
  version: 3 | number,
  confirmEjects: boolean,
  visualTasks: boolean,
}

export interface GameOptionsV4 extends GameOptionsV3 {
  version: 4 | number,
  emergencyCooldown: number,
  confirmEjects: boolean,
  visualTasks: boolean,
  anonymousVoting: boolean,
  taskbarUpdates: GameTaskbarUpdates
}

export enum GameKeywords {
  All,
  Other,
  Spanish,
  Korean,
  Russian,
  Portuguese,
  Arabic,
  Filipino,
  Polish,
  English
}

export enum GameMap {
  Skeld,
  MiraHQ,
  Polus,
}

export enum GameKillDistance {
  Short,
  Normal,
  Long
}

export enum GameTaskbarUpdates {
  Always,
  Meetings,
  Never
}

export function readGameOptions(message: Message): GameOptions {
  const length = message.readUPacked();
  if (length + message.cursor > message.length) {
    throw new Error("Not enough data to fill the buffer.");
  }
  const result: GameOptions = {
    version: message.readU8(),
    maxPlayers: message.readU8(),
    keywords: message.readU32(),
    map: message.readU8(),
    playerSpeed: message.readF32(),
    crewmateVision: message.readF32(),
    impostorVision: message.readF32(),
    killCooldown: message.readF32(),
    commonTasks: message.readU8(),
    longTasks: message.readU8(),
    shortTasks: message.readU8(),
    emergencies: message.readU32(),
    maxImpostors: message.readU8(),
    killDistance: message.readU8(),
    discussionTime: message.readU32(),
    votingTime: message.readU32(),
    isDefaults: message.readBoolean()
  }

  if (result.version >= 2) {
    (result as GameOptionsV2).emergencyCooldown = message.readU8();
    if (result.version >= 3) {
      (result as GameOptionsV3).confirmEjects = message.readBoolean();
      (result as GameOptionsV3).visualTasks = message.readBoolean();
      if (result.version >= 4) {
        (result as GameOptionsV4).anonymousVoting = message.readBoolean();
        (result as GameOptionsV4).taskbarUpdates = message.readU8();
      }
    }
  }

  return result;
}

export function writeGameOptions(options: GameOptions): Message {
  const message = new Message();
  message.writeU8(options.version);
  message.writeU8(options.maxPlayers);
  message.writeU32(options.keywords);
  message.writeU8(options.map);
  message.writeF32(options.playerSpeed);
  message.writeF32(options.crewmateVision);
  message.writeF32(options.impostorVision);
  message.writeF32(options.killCooldown);
  message.writeU8(options.commonTasks);
  message.writeU8(options.longTasks);
  message.writeU8(options.shortTasks);
  message.writeU32(options.emergencies)
  message.writeU8(options.maxImpostors);
  message.writeU8(options.killDistance);
  message.writeU32(options.discussionTime);
  message.writeU32(options.votingTime);
  message.writeBoolean(options.isDefaults);
  if (options.version >= 2) {
    message.writeU8((options as GameOptionsV2).emergencyCooldown);
    if (options.version >= 3) {
      message.writeBoolean((options as GameOptionsV3).confirmEjects);
      message.writeBoolean((options as GameOptionsV3).visualTasks);
      if (options.version >= 4) {
        message.writeBoolean((options as GameOptionsV4).anonymousVoting);
        message.writeU8((options as GameOptionsV4).taskbarUpdates);
      }
    }
  }
  const message2 = new Message();
  message2.writeUPacked(message.length);
  message2.writeBytes(message);
  return message2;
}