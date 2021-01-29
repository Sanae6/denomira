import Message from "../message.ts"
import DisconnectReason from "./disconnect.ts"
import { Packet, readAllPackets, writeAllPackets } from "./packets.ts"

export enum SendOption {
  Unreliable = 0,
  Reliable = 1,
  Hello = 8,
  Disconnect = 9,
  Acknowledge = 10,
  Ping = 12
}

export type HazelPacket = Unreliable | Disconnect | Acknowledge | ReliableHazelPacket;
export type ReliableHazelPacket = Reliable | Hello | Ping;

export interface Unreliable {
  type: SendOption.Unreliable,
  data: Packet[]
}

export interface ReliablePacket {
  type: SendOption,
  nonce: number
}

export interface Reliable extends ReliablePacket {
  type: SendOption.Reliable,
  nonce: number,
  data: Packet[]
}

export interface Hello extends ReliablePacket {
  type: SendOption.Hello,
  nonce: number,
  hazelVersion: number,
  clientVersion: number,
  name: string
}

export interface Disconnect {
  type: SendOption.Disconnect,
  forced?: boolean,
  reason?: DisconnectReason
}

export interface Acknowledge {
  type: SendOption.Acknowledge,
  nonce: number,
  missingPackets: number
}

export interface Ping extends ReliablePacket {
  type: SendOption.Ping,
  nonce: number
}

export function readHazelPacket(message: Message, fromClient: boolean): HazelPacket {
  const op = message.readU8();
  switch (op) {
    case 0:
      return {
        type: SendOption.Unreliable,
        data: readAllPackets(message, fromClient)
      };
    case 1:
      return {
        type: SendOption.Reliable,
        nonce: message.readU16BE(),
        data: readAllPackets(message, fromClient)
      };
    case 8:
      return {
        type: SendOption.Hello,
        nonce: message.readU16BE(),
        hazelVersion: message.readU8(),
        clientVersion: message.read32(),
        name: message.readString(),
      };
    case 9:
      return {
        type: SendOption.Disconnect,
        forced: message.hasBytesLeft() ? message.readBoolean() : undefined,
        reason: message.hasBytesLeft() ? DisconnectReason.fromMessage(message.readMessage()) : undefined
      };
    case 10:
      return {
        type: SendOption.Acknowledge,
        nonce: message.readU16BE(),
        missingPackets: message.readU8()
      };
    case 12:
      return {
        type: SendOption.Ping,
        nonce: message.readU16BE()
      };
    default:
      throw new Error("Unrecognized Hazel packet type: " + op);
  }
}

export function writeHazelPacket(packet: HazelPacket): Message {
  switch (packet.type) {
    case SendOption.Unreliable:
      return new Message()
        .writeU8(SendOption.Unreliable)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Reliable:
      return new Message()
        .writeU8(SendOption.Reliable)
        .writeU16BE(packet.nonce)
        .writeBytes(writeAllPackets(packet.data));
    case SendOption.Hello:
      return new Message()
        .writeU8(SendOption.Hello)
        .writeU16BE(packet.nonce)
        .writeU8(packet.hazelVersion)
        .write32(packet.clientVersion)
        .writeString(packet.name);
    case SendOption.Acknowledge:
      return new Message()
        .writeU8(SendOption.Acknowledge)
        .writeU16BE(packet.nonce)
        .writeU8(packet.missingPackets);
    case SendOption.Ping:
      return new Message()
        .writeU8(SendOption.Ping)
        .writeU16BE(packet.nonce)
    // deno-lint-ignore no-case-declarations
    case SendOption.Disconnect:
      const msg = new Message()
        .writeU8(SendOption.Disconnect)
      if (packet.forced != undefined) msg.writeBoolean(packet.forced);
      if (packet.forced) msg.startMessage()
        .writeBytes(packet.reason ? packet.reason.toMessage() : new Message())
      .endMessage();
      return msg;
  }
}