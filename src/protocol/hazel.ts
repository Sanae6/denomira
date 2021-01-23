import Message from "../message.ts"
import DisconnectReason from "./disconnect.ts"
import { Packet, writeAllPackets } from "./packets.ts"

export enum SendOption {
  Unreliable = 0,
  Reliable = 1,
  Hello = 8,
  Disconnect = 9,
  Acknowledge = 10,
  Ping = 12
}

export type HazelPacket = Unreliable | Reliable | Hello | Disconnect | Acknowledge | Ping

export interface Unreliable {
  type: SendOption.Unreliable,
  data: Packet[]
}

export interface Reliable {
  type: SendOption.Reliable,
  nonce: number,
  data: Packet[]
}

export interface Hello {
  type: SendOption.Hello,
  nonce: number,
  hazelVersion: number,
  clientVersion: number,
  name: string
}

export interface Disconnect {
  type: SendOption.Disconnect,
  forced: number,
  reason?: DisconnectReason
}

export interface Acknowledge {
  type: SendOption.Acknowledge,
  nonce: number
}

export interface Ping {
  type: SendOption.Ping,
  nonce: number
}

export function readHazelPacket(message: Message, fromClient: boolean): HazelPacket {
  switch (message.readU8())
}

export function writeHazelPacket(packet: HazelPacket): Message {
  switch (packet.type) {
    case SendOption.Unreliable:
      return new Message()
        .writeU8(0)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Reliable:
      return new Message()
        .writeU8(1)
        .writeU16(packet.nonce)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Hello:
      return new Message()
        .writeU8(1)
        .writeU16(packet.nonce)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Ping:
      return new Message()
        .writeU8(1)
        .writeU16(packet.nonce)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Disconnect:
      return new Message()
        .writeU8(1)
        .
  }
}