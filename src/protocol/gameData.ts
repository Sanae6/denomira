import Message from "../util/message.ts";

export enum GameDataType {
  Data = 1,
  RPC = 2,
  Spawn = 4,
  Despawn = 5,
  SceneChange = 6,
  Ready = 7,
}

export type GameData = Data | RPC | Spawn | Despawn | SceneChange | Ready;

export interface Data {
  type: GameDataType.Data;
  netId: number;
  data: Message;
}

export interface RPC {
  type: GameDataType.RPC;
  netId: number;
  callId: number
  rpcData: Message;
}

export interface Spawn {
  type: GameDataType.Spawn;
  spawnType: number;
  ownerId: number;
  flags: number;
  components: Component[];
}

export interface Despawn {
  type: GameDataType.Despawn;
  netId: number;
}

export interface SceneChange {
  type: GameDataType.SceneChange;
  clientId: number;
  scene: string;
}

export interface Ready {
  type: GameDataType.Ready;
  clientId: number;
}

export interface Component {
  netId: number;
  data: Message;
}

export function readGameData(message: Message): GameData {
  switch (message.tag) {
    case GameDataType.Data:
      return {
        type: GameDataType.Data,
        netId: message.readUPacked(),
        data: new Message(message.readBytes()),
      };
    case GameDataType.RPC:
      return {
        type: GameDataType.RPC,
        netId: message.readUPacked(),
        callId: message.readU8(),
        rpcData: new Message(message.readBytes()),
      };
    case GameDataType.SceneChange:
      return {
        type: GameDataType.SceneChange,
        clientId: message.readUPacked(),
        scene: message.readString(),
      };
    case GameDataType.Spawn:
      return {
        type: GameDataType.Spawn,
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
    case GameDataType.Ready:
      return {
        type: GameDataType.Ready,
        clientId: message.readUPacked(),
      };
    case GameDataType.Despawn:
      return {
        type: GameDataType.Despawn,
        netId: message.readUPacked(),
      };
    default:
      throw new Error("Unhandled GameData tag: " + message.tag);
  }
}

export function writeGameData(data: GameData): Message {
  const message = new Message();
  switch (data.type) {
    case GameDataType.Data:
      return message.startMessage(GameDataType.Data)
        .writeUPacked(data.netId)
        .writeBytes(data.data)
        .endMessage();
    case GameDataType.Despawn:
      return message.startMessage(GameDataType.Despawn)
        .writeUPacked(data.netId)
        .endMessage();
    case GameDataType.Spawn:
      return message.startMessage(GameDataType.Spawn)
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
    case GameDataType.RPC:
      return message.startMessage(GameDataType.RPC)
        .writeUPacked(data.netId)
        .writeU8(data.callId)
        .writeBytes(data.rpcData)
        .endMessage();
    case GameDataType.SceneChange:
      return message.startMessage(GameDataType.SceneChange)
        .writeUPacked(data.clientId)
        .writeString(data.scene)
        .endMessage();
    case GameDataType.Ready:
      return message.startMessage(GameDataType.Ready)
        .writeUPacked(data.clientId)
        .endMessage();
  }
}
