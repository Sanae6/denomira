import Message from "../src/message.ts";
import { Disconnect, HazelPacket, readHazelPacket, SendOption } from "../src/protocol/hazel.ts";
import { Packet, readPacket } from "../src/protocol/packets.ts";
import { EventEmitter } from "https://deno.land/x/event/mod.ts";
import DisconnectReason from "../src/protocol/disconnect.ts";

const addr: Deno.NetAddr = {
  transport: "udp",
  hostname: "64.201.219.20",
  port: 22023
};

type ClientEvents = {
  connect: [];
  disconnect: [reason: DisconnectReason | undefined];
};

class Client extends EventEmitter<ClientEvents> {
  sock: Deno.DatagramConn = Deno.listenDatagram({
    transport: "udp",
    port: 0,
    hostname: "0.0.0.0"
  });
  clientAddr: Deno.NetAddr = {
    transport: "udp",
    hostname: "64.201.219.20",
    port: 22023
  };

  async handleHazel(data: HazelPacket){
    switch (data.type) {
      case SendOption.Disconnect:
        this.emit("disconnect", (<Disconnect>data).reason);
        break;
      
    }
  }

  async connect(server: Deno.NetAddr) {
    this.sock.send(writeH)
    for await (const [buf] of this.sock) {
      const packet = readHazelPacket(new Message(buf), false);

      this.handleHazel(packet);
    }
  }
}

const client = new Client();

client.on("connect", () => {
  console.log()
})

client.connect(addr);