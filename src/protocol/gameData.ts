import Message from "../util/message.ts";
// import { readRpc, Rpc, writeRpc } from "./gameRpc";

enum DataTypes {
  Data = 1,
  RPC = 2,
  Spawn = 4,
  Despawn = 5,
  SceneChange = 6,
  Ready = 7,
}

export type GameData = Data | RPC | Spawn | Despawn | SceneChange | Ready;

export interface Data {
  type: DataTypes.Data;
  netId: number;
  data: Message;
}

export interface RPC {
  type: DataTypes.RPC;
  netId: number;
  rpcData: Message;
}

export interface Spawn {
  type: DataTypes.Spawn;
  spawnType: number; //TODO SpawnType
  ownerId: number;
  flags: number;
  components: Component[];
}

export interface Despawn {
  type: DataTypes.Despawn;
  netId: number;
}

export interface SceneChange {
  type: DataTypes.SceneChange;
  clientId: number;
  scene: string;
}

export interface Ready {
  type: DataTypes.Ready;
  clientId: number;
}

export interface Component {
  netId: number;
  data: Message;
}

export function readGameData(message: Message): GameData {
  switch (message.tag) {
    case DataTypes.Data:
      return {
        type: DataTypes.Data,
        netId: message.readUPacked(),
        data: new Message(message.readBytes()),
      };
    case DataTypes.RPC:
      return {
        type: DataTypes.RPC,
        netId: message.readUPacked(),
        rpcData: new Message(message.readBytes()),
      };
    case DataTypes.SceneChange:
      return {
        type: DataTypes.SceneChange,
        clientId: message.readUPacked(),
        scene: message.readString(),
      };
    case DataTypes.Spawn:
      return {
        type: DataTypes.Spawn,
        spawnType: message.readUPacked(),
        ownerId: message.readPacked(),
        flags: message.readU8(),
        components: message.readList((sub) => {
          return {
            netId: sub.readUPacked(),
            data: sub.readMessage(),
          };
        }),
      };
    case DataTypes.Ready:
      return {
        type: DataTypes.Ready,
        clientId: message.readUPacked(),
      };
    case DataTypes.Despawn:
      return {
        type: DataTypes.Despawn,
        netId: message.readUPacked(),
      };
    default:
      throw new Error("Unhandled GameData tag: " + message.tag);
  }
}

export function writeGameData(data: GameData): Message {
  const message = new Message();
  switch (data.type) {
    case DataTypes.Data:
      return message.startMessage(DataTypes.Data)
        .writeUPacked(data.netId)
        .writeBytes(data.data)
        .endMessage();
    case DataTypes.Despawn:
      return message.startMessage(DataTypes.Despawn)
        .writeUPacked(data.netId)
        .endMessage();
    case DataTypes.Spawn:
      return message.startMessage(DataTypes.Spawn)
        .writeUPacked(data.spawnType)
        .writePacked(data.ownerId)
        .writeU8(data.flags)
        .writeList(data.components, (comp) => {
          return new Message()
            .writeUPacked(comp.netId)
            .startMessage()
            .writeBytes(comp.data)
            .endMessage();
        })
        .endMessage();
    case DataTypes.RPC:
      return message.startMessage(DataTypes.RPC)
        .writeUPacked(data.netId)
        // .writeBytes(writeRpc(data.rpc))
        .writeBytes(data.rpcData)
        .endMessage();
    case DataTypes.SceneChange:
      return message.startMessage(DataTypes.SceneChange)
        .writeUPacked(data.clientId)
        .writeString(data.scene)
        .endMessage();
    case DataTypes.Ready:
      return message.startMessage(DataTypes.Ready)
        .writeUPacked(data.clientId)
        .endMessage();
      // default:
      //   throw new Error("Unhandled GameData type: " + DataTypes[data.type])
  }
}
