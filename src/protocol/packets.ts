import { GameData, readGameData, writeGameData } from "./gameData.ts";
import { GameMap, GameOptions, readGameOptions, writeGameOptions } from "./gameOptions.ts";
import Message from "../message.ts";
import DisconnectReason, { Reasons } from "./disconnect.ts";
import { AlterGameTag, GameListing, GameListingOld, GameOverReason, MasterServer } from "./extraTypes.ts";

export enum Packets {
  HostGameRequest,
  HostGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  JoinGameError,
  StartGame,
  RemoveGame,
  RemovePlayer,
  GameDataAll,
  GameDataTo,
  JoinedGame,
  EndGame,
  GetGameListOldRequest,
  GetGameListOldResponse,
  AlterGame,
  KickPlayer,
  WaitForHost,
  Redirect,
  ReselectServers,
  GetGameListRequest,
  GetGameListResponse
}

export type Packet =| HostGameRequest
          | HostGameResponse
          | JoinGameRequest
          | JoinGameResponse
          | JoinGameError
          | StartGame
          | RemoveGame
          | RemovePlayer
          | GameDataPacket
          | JoinedGame
          | EndGame
          | GetGameListOldRequest
          | GetGameListOldResponse
          | AlterGame
          | KickPlayer
          | WaitForHost
          | Redirect
          | ReselectServers
          | GetGameListRequest
          | GetGameListResponse;

interface RoomPacket { 
  type: Packets,
  code: number
}

export interface HostGameRequest {
  type: Packets.HostGameRequest,
  options: GameOptions
}

export interface HostGameResponse extends RoomPacket {
  type: Packets.HostGameResponse,
  code: number
}

export interface JoinGameRequest extends RoomPacket {
  type: Packets.JoinGameRequest,
  ownedMaps: GameMap
}

export interface JoinGameResponse extends RoomPacket {
  type: Packets.JoinGameResponse,
  clientId: number,
  hostId: number
}

export interface JoinGameError {
  type: Packets.JoinGameError,
  reason: DisconnectReason
}

export interface StartGame extends RoomPacket {
  type: Packets.StartGame
}

export interface RemoveGame {
  type: Packets.RemoveGame,
  reason?: DisconnectReason
}

export interface RemovePlayer extends RoomPacket {
  type: Packets.RemovePlayer,
  clientId: number,
  reason?: DisconnectReason
}

export interface GameDataPacket extends RoomPacket {
  type: Packets.GameDataAll | Packets.GameDataTo,
  toClient?: number,
  gameData: GameData[]
}

export interface JoinedGame extends RoomPacket {
  type: Packets.JoinedGame,
  clientId: number,
  hostId: number,
  otherIds: number[]
}

export interface EndGame extends RoomPacket {
  type: Packets.EndGame,
  reason: GameOverReason,
  showAd: boolean
}

export interface GetGameListOldRequest {
  type: Packets.GetGameListOldRequest,
  includePrivate: boolean,
  options: GameOptions
}

export interface GetGameListOldRequest {
  type: Packets.GetGameListOldRequest,
  includePrivate: boolean,
  options: GameOptions
}

export interface GetGameListOldResponse {
  type: Packets.GetGameListOldResponse,
  listings: GameListingOld[]
}

export interface AlterGame extends RoomPacket {
  type: Packets.AlterGame,
  tag: AlterGameTag,
  value: number
}

export interface KickPlayer extends RoomPacket {
  type: Packets.KickPlayer,
  clientId: number,
  banned: boolean,
  reason?: DisconnectReason
}

export interface WaitForHost extends RoomPacket {
  type: Packets.WaitForHost,
  clientId: number
}

export interface Redirect {
  type: Packets.Redirect,
  host: string,
  port: number
}

export interface ReselectServers {
  type: Packets.ReselectServers,
  version: number,
  servers: MasterServer[]
}

export interface GetGameListRequest {
  type: Packets.GetGameListRequest,
  unknown: number,
  options: GameOptions
}

export interface GetGameListResponse {
  type: Packets.GetGameListResponse,
  counts?: [number, number, number],
  listings?: GameListing[]
}

/**
 * Writes a packet that is sent by the server to a client.
 * Request packets with the same tag as a response packet will not be written.
 * @param {Message} message 
 */

export function writePacket(packet: Packet): Message {
  const message = new Message();
  switch (packet.type) {
    case Packets.HostGameRequest:
      return message.startMessage(0)
        .writeBytes(writeGameOptions(packet.options))
      .endMessage()
    case Packets.HostGameResponse:
      return message.startMessage(0)
        .write32(packet.code)
      .endMessage();
    case Packets.JoinGameRequest:
      return message.startMessage(1)
        .write32(packet.code)
        .writeU8(packet.ownedMaps)
      .endMessage();
    case Packets.JoinGameResponse:
      return message.startMessage(1)
        .write32(packet.code)
        .writeU32(packet.clientId)
        .writeU32(packet.hostId)
      .endMessage();
    case Packets.JoinGameError:
      return message.startMessage(1)
        .writeBytes(packet.reason.toMessage(true))
      .endMessage();
    case Packets.StartGame:
      return message.startMessage(2)
        .write32(packet.code)
      .endMessage();
    case Packets.GameDataAll:
      return message.startMessage(5)
        .write32(packet.code)
        .writeMessages(packet.gameData.map(data => writeGameData(data)))
      .endMessage();
    case Packets.GameDataTo:
      return message.startMessage(6)
        .write32(packet.code)
        .writeUPacked(packet.toClient!)
        .writeMessages(packet.gameData.map(data => writeGameData(data)))
      .endMessage();
    case Packets.JoinedGame:
      return message.startMessage(7)
        .write32(packet.code)
        .writeU32(packet.clientId)
        .writeU32(packet.hostId)
        .writeList(packet.otherIds, x => new Message().writeUPacked(x))
      .endMessage();
    case Packets.EndGame:
      return message.startMessage(8)
        .write32(packet.code)
        .writeU8(packet.reason)
        .writeBoolean(packet.showAd)
      .endMessage()
    case Packets.AlterGame:
      return message.startMessage(10)
        .write32(packet.code)
        .writeU8(packet.tag)
        .writeU8(packet.value)
      .endMessage();
    case Packets.KickPlayer:
      return message.startMessage(11)
        .write32(packet.code)
        .writeUPacked(packet.clientId)
        .writeBoolean(packet.banned)
        .writeBytes(packet.reason ? packet.reason.toMessage() : new Message())
      .endMessage();
    case Packets.WaitForHost:
      return message.startMessage(11)
        .write32(packet.code)
        .writeU32(packet.clientId)
      .endMessage();
    case Packets.Redirect:
      return message.startMessage(11)
        .writeAddress(packet.host)
        .writeU16(packet.port)
      .endMessage();
    case Packets.ReselectServers:
      return message.startMessage(11)
        .writeU8(1)
        .writeList(packet.servers, server => 
          new Message().startMessage()
            .writeString(server.name)
            .writeAddress(server.host)
            .writeU16(server.port)
            .writeUPacked(server.clients)
          .endMessage()
        )
      .endMessage();
    case Packets.GetGameListRequest:
      return message.startMessage(16)
        .writePacked(packet.unknown)
        .writeBytes(writeGameOptions(packet.options))
      .endMessage();
    case Packets.GetGameListResponse:
      message.startMessage(16)
      if (packet.counts) message.startMessage(1)
        .writeBytes(new Uint8Array(packet.counts))
      .endMessage();
      if (packet.listings) message.startMessage(0)
        .writeList(packet.listings, x => new Message().startMessage()
          .writeAddress(x.host)
          .writeU16(x.port)
          .write32(x.code)
          .writeString(x.name)
          .writeU8(x.players)
          .writeUPacked(x.age)
          .writeU8(x.map)
          .writeU8(x.impostors)
          .writeU8(x.maxPlayers)
        .endMessage())
      .endMessage();
      return message;
    default:
      throw new Error("Unhandled packet type: " + Packets[packet.type])
  }
}

/**
 * Reads a packet.
 * @param {Message} message 
 * @param {boolean} fromClient Used to denote whether to read the packet as a message from a client or a server.
 */

export function readPacket(message: Message, fromClient: boolean): Packet {
  switch (message.tag) {
    case 0:
      if (fromClient) {
        return {
          type: Packets.HostGameRequest,
          options: readGameOptions(message)
        };
      } else {
        return {
          type: Packets.HostGameResponse,
          code: message.read32()
        }
      }
    case 1:
      if (fromClient) {
          return {
          type: Packets.JoinGameRequest,
          code: message.read32(),
          ownedMaps: message.readU8()
        };
      } else {
        const x = message.read32();

        if (Reasons[x] != undefined) {
          return {
            type: Packets.JoinGameError,
            reason: new DisconnectReason(x, message)
          }
        } else {
          return {
            type: Packets.JoinGameResponse,
            code: x,
            clientId: message.readU32(),
            hostId: message.readU32()
          }
        }
      }
    case 2:
      return {
        type: Packets.StartGame,
        code: message.read32()
      };
    case 3:
      return {
        type: Packets.RemoveGame,
        reason: DisconnectReason.fromMessage(message)
      };
    case 4:
      return {
        type: Packets.RemovePlayer,
        code: message.read32(),
        clientId: message.readUPacked(),
        reason: DisconnectReason.fromMessage(message)
      }
    case 5:
      return {
        type: Packets.GameDataAll,
        code: message.read32(),
        gameData: message.readMessageList(sub => readGameData(sub))
      }
    case 6:
      return {
        type: Packets.GameDataTo,
        code: message.read32(),
        toClient: message.readUPacked(),
        gameData: message.readMessageList(sub => readGameData(sub))
      }
    case 7:
      return {
        type: Packets.JoinedGame,
        code: message.read32(),
        clientId: message.readU32(),
        hostId: message.readU32(),
        otherIds: message.readList(sub => sub.readUPacked())
      }
    case 8:
      return {
        type: Packets.EndGame,
        code: message.read32(),
        reason: message.readU8(),
        showAd: message.readBoolean()
      }
    case 9:
      return {
        type: Packets.GetGameListOldRequest,
        includePrivate: message.readBoolean(),
        options: readGameOptions(message)
      }
    case 10:
      return {
        type: Packets.AlterGame,
        code: message.read32(),
        tag: message.readU8(),
        value: message.readU8()
      }
    case 11:
      return {
        type: Packets.KickPlayer,
        code: message.read32(),
        clientId: message.readUPacked(),
        banned: message.readBoolean(),
        reason: DisconnectReason.fromMessage(message)
      }
    case 12:
      return {
        type: Packets.WaitForHost,
        code: message.read32(),
        clientId: message.readUPacked()
      }
    case 13:
      return {
        type: Packets.Redirect,
        host: message.readAddress(),
        port: message.readU16()
      }
    case 14:
      return {
        type: Packets.ReselectServers,
        version: message.readU8(),
        servers: message.readMessageList(msg => ({
          name: msg.readString(),
          host: msg.readAddress(),
          port: msg.readU16(),
          clients: msg.readUPacked()
        }))
      };
    case 16:
      if (fromClient) {
        return {
          type: Packets.GetGameListRequest,
          unknown: message.readPacked(),
          options: readGameOptions(message)
        }
      } else {
        const result: GetGameListResponse = {
          type: Packets.GetGameListResponse
        }

        while (message.hasBytesLeft()) {
          const m = message.readMessage();
          if (m.tag == 1) result.counts = [m.readU32(),m.readU32(),m.readU32()];
          else if (m.tag == 0) result.listings = m.readMessageList(msg => ({
            host: msg.readAddress(),
            port: msg.readU16(),
            code: msg.read32(),
            name: msg.readString(),
            players: msg.readU8(),
            age: msg.readUPacked(),
            map: msg.readU8(),
            impostors: msg.readU8(),
            maxPlayers: msg.readU8()
          }));
          else throw new Error("Invalid GetGameListV2 message tag: " + m.tag);
        }

        return result;
      }
    // case 255:
    //   return {
    //     type: 
    //   }
    //   break;
    default:
      throw new Error("Unhandled packet tag: " + message.tag)
  }
}

/**
 * A wrapper function on top of readPacket to aggregate all packets into one array
 * @param message 
 */
export function readAllPackets(message: Message, fromClient: boolean): Packet[] {
  const packets = [];

  while (message.hasBytesLeft()) {
    packets.push(readPacket(message.readMessage(), fromClient));
  }

  return packets;
}

export function writeAllPackets(packets: Packet[]): Message {
  const message = new Message();

  for (const packet of packets) {
    message.writeBytes(writePacket(packet));
  }

  return message;
}