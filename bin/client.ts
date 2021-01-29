import Message from "../src/message.ts";
import { Disconnect, HazelPacket, readHazelPacket, Reliable, ReliableHazelPacket, ReliablePacket, SendOption, writeHazelPacket } from "../src/protocol/hazel.ts";
import { Packet, readPacket } from "../src/protocol/packets.ts";
import { EventEmitter } from "https://deno.land/x/event/mod.ts";
import DisconnectReason from "../src/protocol/disconnect.ts";
import ClientVersion from "../src/protocol/version.ts";

type Config = {
  host: Deno.NetAddr,
  name: string,
  version: number | {
    year: number,
    month: number,
    day: number,
    revision: number
  }
}

const addr: Deno.NetAddr = {
  transport: "udp",
  hostname: "127.0.0.1",
  port: 22023
};

type ClientEvents = {
  connect: [];
  disconnect: [reason: DisconnectReason | undefined];
};

class Client extends EventEmitter<ClientEvents> {
  sock: Deno.DatagramConn;
  incrementingNonce = 0;
  // reliablePackets: {nonce: number, interval: number}[] = [];
  reliablePackets: {interval: number, handler?: () => void}[] = [];

  constructor(public readonly config: Config) {
    super();
    this.sock = Deno.listenDatagram({
      transport: "udp",
      port: 0
    });
  }

  handlePacket(data: Packet) {

  }

  handleHazel(data: HazelPacket){
    switch (data.type) {
      case SendOption.Disconnect:
        this.emit("disconnect", (<Disconnect>data).reason);
        break;
      case SendOption.Acknowledge:
        this.ackedReliable(data.nonce);
        break;
      case SendOption.Reliable:
        // this.ackedReliable(data.nonce);
        break;
    }
  }

  disconnectHandler(reason: string) {
    this.reliablePackets.forEach(x => clearInterval(x.interval));
    this.reliablePackets = [];
  }

  send(message: Message) {
    this.sock.send(message.toUint8Array(), this.config.host);
  }

  sendReliable(packet: ReliableHazelPacket, handler?: () => void) {
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

  ack(nonce: number) {
    this.send(writeHazelPacket({
      type: SendOption.Acknowledge,
      missingPackets: 0xFF,
      nonce
    }))
  }

  ackedReliable(nonce: number) {
    clearInterval(this.reliablePackets[nonce].interval);
    const handler = this.reliablePackets[nonce].handler;
    if (handler != undefined) {
      handler();
    }
    // this.reliablePackets[nonce];
  }

  async connect() {
    this.sendReliable(writeHazelPacket({
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
    }));
    for await (const [buf] of this.sock) {
      // though you can get an address from this call, realistically only the server will be communicating with you.
      // const [buf] = this.sock.receive();
      const message = new Message(buf);
      console.log(message.toString());
      const packet = readHazelPacket(message, false);
      console.log(packet);
      this.handleHazel(packet);
    }
  }
}

const client = new Client({
  host: addr,
  name: "SanaeBot",
  version: 50516550
});

// client.on("connect", () => {
//   console.log()
// })

client.connect();