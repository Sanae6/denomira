import { EventEmitter } from "https://deno.land/x/event/mod.ts";
import Connection from "./connection.ts";
import Message from "../util/message.ts";
import DisconnectReason from "../protocol/disconnect.ts";
import DisconnectReasons, { Reasons } from "../protocol/disconnect.ts";
import { readAllPackets, readPacket, writePacket } from "../protocol/packets.ts";
import ClientVersion from "../protocol/version.ts";

type Events = {
  connect: [connection: Connection, version: ClientVersion, name: string];
};

export interface ServerConfig {
  hostInfo: Deno.NetAddr
  publicHost: string,
}

export class Server extends EventEmitter<Events>{
  private socket: Deno.DatagramConn;
  public connections: Map<string, Connection> = new Map();

  constructor(public config: ServerConfig) {
    super();

    console.warn("This is incomplete and therefore should not be used.")

    this.socket = Deno.listenDatagram(config.hostInfo);
  }

  public convertAddress(address: Deno.NetAddr): string {
    return address.hostname+":"+address.port;
  }

  private disconnectInvalid(address: Deno.Addr) {
    this.socket.send(
      new Message()
        .writeU8(9)
        .writeU8(1)
        .startMessage()
          .writeBytes(new DisconnectReason(Reasons.NewConnection).toMessage())
        .endMessage().toUint8Array(),
      address
    );
  }

  //TODO listen but stripped of response logic (acks, disconnect)

  public async listen() {
    for await (const [buf,address] of this.socket) {
      const addr = this.convertAddress(address as Deno.NetAddr);
      const msg = new Message(buf);
      if (buf[0] != 8 && !this.connections.has(addr)) {
        this.disconnectInvalid(address);
        continue;
      }
      let nonce: number;
      let connection: Connection;
      switch(msg.readU8()) {
        case 1:
          nonce = msg.readU16BE();
          //console.log("received", msg.toString(), buf.length);
          connection = this.connections.get(addr)!;
          connection.ack(nonce);
          connection.emit("packets", readAllPackets(msg, true), msg);
          break;
        case 0:
          connection = this.connections.get(addr)!;
          connection.emit("packets", readAllPackets(msg, true), msg);
          break;
        case 8:
          if (this.connections.has(addr)) {
            this.connections.delete(addr);
            return;
          }
          nonce = msg.readU16BE();
          msg.readU8(); // hazel version, not needed
          connection = new Connection(this.socket, address as Deno.NetAddr);
          this.connections.set(
            addr,
            connection
          );
          connection.ack(nonce);
          this.emit("connect", connection, ClientVersion.decode(msg.readU32()), msg.readString());
          break;
        case 12:
          nonce = msg.readU16BE();
          this.connections.get(addr)!.ack(nonce);
          break; 
      }
    }
  }
}