import Message from "../src/message.ts";
import { readAllPackets } from "../src/protocol/packets.ts";

const socket = Deno.listenDatagram({port: 22023, transport: "udp"});
const server: Deno.NetAddr = {
  hostname: "64.201.219.20",
  port: 22023,
  transport: "udp"
}

for await (const ba of socket) {
  const buf = new Message(ba[0]);
  const addr = ba[1] as Deno.NetAddr;
  if (addr.hostname == server.hostname && addr.port == server.port) {
    
    const packet = readAllPackets(buf, false);
    console.log("S->C", packet,"\n", buf.toString());
    socket.send(ba[0], addr);
  } else {
    buf.readBytes(3)
    const packet = readAllPackets(buf, true);
    console.log("C->S", packet,"\n", buf.toString());
    socket.send(ba[0], addr);
  }
}