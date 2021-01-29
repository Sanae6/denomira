// // incomplete

// import Message from "../message.ts";
// import { GameOptions, readGameOptions, writeGameOptions } from "./gameOptions.ts";
// import { PlayerInfo, readPlayerInfo, writePlayerInfo } from "./playerInfo.ts";

// enum RpcCalls {
//   PlayAnimation,
//   CompleteTask,
//   SyncSettings,
//   SetInfected,
//   Exiled,
//   CheckName,
//   SetName,
//   CheckColor,
//   SetColor,
//   SetHat,
//   SetSkin,
//   ReportDeadBody,
//   MurderPlayer,
//   SendChat,
//   StartMeeting,
//   SetScanner,
//   SendChatNote,
//   SetPet,
//   SetStartCounter,
//   EnterVent,
//   ExitVent,
//   SnapTo,
//   Close,
//   VotingComplete,
//   CastVote,
//   ClearVote,
//   AddVote,
//   CloseDoorsOfType,
//   RepairSystem,
//   SetTasks,
//   UpdateGameData
// }

// export type Rpc = SyncSettings | CheckName | SetName | CheckColor | SetColor | SetHat | SetSkin | SetPet | SetStartCounter | CloseMeeting
// | UpdateGameData;

// export interface SyncSettings {
//   call: RpcCalls.SyncSettings,
//   options: GameOptions
// }

// export interface CheckName {
//   call: RpcCalls.CheckName,
//   name: string
// }

// export interface SetName {
//   call: RpcCalls.SetName,
//   name: string
// }

// export interface CheckColor {
//   call: RpcCalls.CheckColor,
//   color: number //TODO Color enum
// }

// export interface SetColor {
//   call: RpcCalls.SetColor,
//   color: number
// }

// export interface SetHat {
//   call: RpcCalls.SetHat,
//   hat: number //TODO Hat enum
// }

// export interface SetSkin {
//   call: RpcCalls.SetSkin,
//   skin: number //TODO Skin enum
// }

// export interface SetPet {
//   call: RpcCalls.SetPet,
//   pet: number //TODO Pet enum
// }

// export interface SetStartCounter {
//   call: RpcCalls.SetStartCounter,
//   sequenceId: number,
//   timeRemaining: number
// }

// export interface CloseMeeting {
//   call: RpcCalls.Close
// }

// export interface UpdateGameData {
//   call: RpcCalls.UpdateGameData,
//   players: PlayerInfo[]
// }

// export function readRpc(message: Message): Rpc {
//   const callId = message.readU8();
//   switch (callId) {
//     case RpcCalls.SyncSettings:
//     return {
//       call: RpcCalls.SyncSettings,
//       options: readGameOptions(message)
//     }
//     case RpcCalls.CheckName:
//     return {
//       call: RpcCalls.CheckName,
//       name: message.readString()
//     }
//     case RpcCalls.SetName:
//     return {
//       call: RpcCalls.SetName,
//       name: message.readString()
//     }
//     case RpcCalls.CheckColor:
//     return {
//       call: RpcCalls.CheckColor,
//       color: message.readU8()
//     }
//     case RpcCalls.SetColor:
//     return {
//       call: RpcCalls.SetColor,
//       color: message.readU8()
//     }
//     case RpcCalls.SetHat:
//     return {
//       call: RpcCalls.SetHat,
//       hat: message.readU8()
//     }
//     case RpcCalls.SetPet:
//     return {
//       call: RpcCalls.SetPet,
//       pet: message.readU8()
//     }
//     case RpcCalls.SetSkin:
//     return {
//       call: RpcCalls.SetSkin,
//       skin: message.readU8()
//     }
//     case RpcCalls.SetStartCounter:
//     return {
//       call: RpcCalls.SetStartCounter,
//       sequenceId: message.readUPacked(),
//       timeRemaining: message.read8()
//     }
//     case RpcCalls.UpdateGameData:
//     return {
//       call: RpcCalls.UpdateGameData,
//       players: message.readMessageList(sub => readPlayerInfo(sub))
//     }
//     default:
//     throw new Error("Unhandled Rpc call: " + callId + (callId <= RpcCalls.UpdateGameData ? " (" + RpcCalls[callId] + ")" : ""))
//   }
// }

// export function writeRpc(rpc: Rpc): Message {
//   const message = new Message().writeU8(rpc.call);
//   switch (rpc.call) {
//     case RpcCalls.SyncSettings:
//     return message.writeBytes(writeGameOptions(rpc.options));
//     case RpcCalls.CheckName:
//     return message.writeString(rpc.name)
//     case RpcCalls.SetName:
//     return message.writeString(rpc.name)
//     case RpcCalls.CheckColor:
//     return message.writeU8(rpc.color);
//     case RpcCalls.SetColor:
//     return message.writeU8(rpc.color);
//     case RpcCalls.SetHat:
//     return message.writeU8(rpc.hat);
//     case RpcCalls.SetPet:
//     return message.writeU8(rpc.pet);
//     case RpcCalls.SetSkin:
//     return message.writeU8(rpc.skin);
//     case RpcCalls.SetStartCounter:
//     return message.writeUPacked(rpc.sequenceId).write8(rpc.timeRemaining);
//     case RpcCalls.UpdateGameData:
//     return message.writeMessages(rpc.players.map(info => writePlayerInfo(info)));
//     default:
//     throw new Error("Unhandled Rpc call: " + RpcCalls[rpc.call]);
//   }
// }