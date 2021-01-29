import { EventEmitter } from "https://deno.land/x/event/mod.ts";
import Message from "../src/message.ts";
import DisconnectReason, { Reasons } from "../src/protocol/disconnect.ts";
import { GameOptions } from "../src/protocol/gameOptions.ts";
import { HazelPacket, readHazelPacket, ReliableHazelPacket, SendOption, writeHazelPacket } from "../src/protocol/hazel.ts";
import { LobbyCode } from "../src/protocol/lobbyCode.ts";
import { Packet, Packets, Redirect } from "../src/protocol/packets.ts";
import ClientVersion from "../src/protocol/version.ts";

type Config = {
  hostInfo: Deno.NetAddr,
  name: string,
  version: number | {
    year: number,
    month: number,
    day: number,
    revision: number
  },
  room: GameOptions | string
}

type ClientEvents = {
  connect: [];
  joined: [code: string];
  disconnect: [reason: string];
};

export class Client extends EventEmitter<ClientEvents> {
  sock: Deno.DatagramConn;
  incrementingNonce = 1;
  // reliablePackets: {nonce: number, interval: number}[] = [];
  reliablePackets: {interval: number, handler?: () => void}[] = [];
  code: number = 32;
  redirectData: Redirect | undefined;

  constructor(public readonly config: Config) {
    super();
    this.sock = Deno.listenDatagram({
      transport: "udp",
      port: 0,
      hostname: "0.0.0.0"
    });
  }

  handlePacket(data: Packet) {
    console.log("got packet of type", Packets[data.type], data);
    switch (data.type) {
      case Packets.HostGameResponse:
        this.sendPacket({
          type: Packets.JoinGameRequest,
          code: data.code,
          ownedMaps: 7
        });
        break;
      case Packets.JoinGameResponse:
        this.emit("joined", LobbyCode.decode(data.code));
        break;
      case Packets.Redirect:
        this.redirectData = data;
        this.send(new Message(new Uint8Array([9])));
        break;
    }
  }

  handleHazel(data: HazelPacket){
    switch (data.type) {
      case SendOption.Disconnect:
        this.disconnectHandler(data.reason ? data.reason : new DisconnectReason(Reasons.Kicked));
        break;
      case SendOption.Acknowledge:
        this.ackedReliable(data.nonce);
        break;
      case SendOption.Reliable:
        this.ack(data.nonce);
        for (let i = 0; i < data.data.length; i++) this.handlePacket(data.data[i]);
        break;
      case SendOption.Unreliable:
        for (let i = 0; i < data.data.length; i++) this.handlePacket(data.data[i]);
        break;
      case SendOption.Reliable:
        this.ack(data.nonce);
        break;
      case SendOption.Ping: // fucking impostor omegalul
        this.ack(data.nonce);
        break;
    }
  }

  disconnectHandler(reason: string | DisconnectReason) {
    this.reliablePackets.forEach(x => clearInterval(x.interval));
    this.reliablePackets = [];
    if (this.redirectData != undefined) {
      this.config.hostInfo.hostname = this.redirectData.host;
      this.config.hostInfo.port = this.redirectData.port;
      this.incrementingNonce = 1;
      this.sendHello();
      return;
    }
    this.emit("disconnect", reason.toString());
  }

  private send(message: Message) {
    this.sock.send(message.toUint8Array(), this.config.hostInfo);
  }

  private sendReliably(packet: ReliableHazelPacket, handler?: () => void) {
    let i = 0;
    packet.nonce = this.incrementingNonce++;
    const data = writeHazelPacket(packet);
    const send = () => {
      this.send(data);
      console.log("reliable send", packet.nonce, data.toString());
      if (i++ == 6) {
        this.disconnectHandler("Reliable packet not acked (6 tries omegalul)");
      }
    }

    const interval = setInterval(() => {
      send();
    }, 1000);

    this.reliablePackets[packet.nonce] = {
      interval,
      handler
    }

    send();
  }

  sendPacket(packet: Packet | Packet[]) {
    this.sendReliably({
      type: SendOption.Reliable,
      nonce: -1,
      data: packet instanceof Array ? packet : [packet]
    })
  }

  private ack(nonce: number) {
    this.send(writeHazelPacket({
      type: SendOption.Acknowledge,
      missingPackets: 0xFF,
      nonce
    }))
  }

  private ackedReliable(nonce: number) {
    if (!(nonce in this.reliablePackets)) return;
    clearInterval(this.reliablePackets[nonce].interval);
    const handler = this.reliablePackets[nonce].handler;
    if (handler != undefined) {
      handler();
    }
    // this.reliablePackets[nonce];
  }

  private sendHello() {
    this.sendReliably({
      type: SendOption.Hello,
      nonce: 0,
      clientVersion: typeof(this.config.version) === "number" ? this.config.version : new ClientVersion(
        this.config.version.year,
        this.config.version.month,
        this.config.version.day,
        this.config.version.revision
      ).encode(),
      hazelVersion: 0,
      name: this.config.name
    }, () => {
      if (typeof(this.config.room) === "string") this.sendPacket({
        type: Packets.JoinGameRequest,
        code: LobbyCode.encode(this.config.room),
        ownedMaps: 7
      })
      else this.sendPacket({
        type: Packets.HostGameRequest,
        options: this.config.room
      });
    });
  }

  async connect() {
    this.sendHello();
    for await (const [buf, addr] of this.sock) {
      // though you can get an address from this call, realistically only the server will be communicating with you.
      // const [buf] = this.sock.receive();
      const message = new Message(buf);
      const packet = readHazelPacket(message, false);
      if (packet.type != SendOption.Ping && packet.type != SendOption.Acknowledge) {
        console.log(message.toString());
        // console.log(packet);
      }
      this.handleHazel(packet);
    }
  }
}