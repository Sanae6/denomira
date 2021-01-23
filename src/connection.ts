import { EventEmitter } from "https://deno.land/x/event/mod.ts";
import Message from "./message.ts";
import { Packet, writePacket } from "./protocol/packets.ts";
import DisconnectReason from "./protocol/disconnect.ts";
import ClientVersion from "./protocol/version.ts";

type ConnectionEvents = {
  packets: [packets: Packet[], message: Message]
  close: []
};

export type Sendable = (Message | Packet)[] | Packet | Message;

export default class Connection extends EventEmitter<ConnectionEvents> {
  public nonce = 0;
  constructor(
    private socket: Deno.DatagramConn,
    public address: Deno.NetAddr
  ) {
    super();
  }

  public send(msg: Message) {
    if (!msg.toString().startsWith("0a"))console.log("sent", msg.toString());
    this.socket.send(new Uint8Array(msg.buffer), this.address);
  }

  public sendReliable(packets: Sendable) {
    if (!(packets instanceof Array)) packets = [packets];
    if (packets.length == 0) return;
    this.send(
      new Message()
        .writeU8(1)
        .writeU16BE(this.nonce++)
        .writeMessages(packets.map(x => {
          if (x instanceof Message) return x;
          return writePacket(x);
        }))
    );
  }

  public disconnect(reason: DisconnectReason) {
  }

  public ack(nonce: number) {
    this.send(
      new Message()
        .writeU8(10)
        .writeU16BE(nonce)
        .writeU8(0xFF)
    );
  }
}