import Message from "../src/util/message.ts";
import { readAllPackets } from "../src/protocol/packets.ts";
import { readHazelPacket } from "../src/protocol/hazel.ts";

const socket = Deno.listenDatagram({ port: 22023, transport: "udp" });
const server: Deno.NetAddr = {
  hostname: "64.201.219.20",
  port: 22023,
  transport: "udp",
};

let client: Deno.NetAddr = server;

for await (const ba of socket) {
  const buf = new Message(ba[0]);
  const addr = ba[1] as Deno.NetAddr;
  // console.log(addr, server);
  if (addr.hostname == server.hostname && addr.port == server.port) {
    const packet = readHazelPacket(buf, false);
    console.log("S->C", packet, "\n", buf.toString());
    socket.send(ba[0], client!);
  } else {
    client = addr;
    const packet = readHazelPacket(buf, true);
    console.log("C->S", packet, "\n", buf.toString());
    socket.send(ba[0], server);
  }
}
