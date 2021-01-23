import Connection, { Sendable } from "../src/connection.ts";
import Message from "../src/message.ts";
import DisconnectReason, { Reasons } from "../src/protocol/disconnect.ts";
import { JoinedGame, Packet, Packets, writePacket } from "../src/protocol/packets.ts";
import Server from "../src/server.ts";

const server = new Server({
  host: "0.0.0.0",
  port: 22023,
  publicHost: "127.0.0.1"
});

let clientIdInc = 0;
const codeGen = () => [
  0x41+Math.floor(Math.random()*26),
  0x41+Math.floor(Math.random()*26),
  0x41+Math.floor(Math.random()*26),
  0x41+Math.floor(Math.random()*26)
].reduce((x,y) => (x << 8)|y);

class Room {
  clients: Map<number, RoomClient> = new Map();
  constructor(public code: number, public hostId: number) {}

  broadcast(data: Sendable, sender?: Connection) {
    console.log("mlfmsfoa");
    this.clients.forEach(v => {
      // console.log(sender == undefined, v.connection != sender)
      if (sender == undefined || v.connection != sender || this.clients.size == 1) v.connection.sendReliable(data)
    });
  }

  addClient(connection: Connection, clientId: number) {
    this.clients.set(clientId, {
      connection,
      clientId
    });
  }

  get otherIds(): number[] {
    return Array.from(this.clients.keys())
  } 
}

interface RoomClient {
  connection: Connection,
  clientId: number
}

const rooms = new Map<number, Room>()

server.on("connect", (connection) => {
  //console.log(connection);
  let code = 32;
  const clientId = clientIdInc++;
  connection.on("packets", (packets) => {
    if (packets.length != 1) {
      rooms.get(code)!.broadcast(packets, connection)
    }else for (const packet of packets) switch (packet.type) {
      case Packets.HostGameRequest:
        code = codeGen();
        rooms.set(code, new Room(code, clientId));
        connection.sendReliable({
          type: Packets.HostGameResponse,
          code
        });
        break;
      case Packets.JoinGameRequest: {
        if (rooms.has(packet.code)) {
          const room = rooms.get(packet.code);
          code = packet.code;
          console.log(room);
          connection.sendReliable({
            type: Packets.JoinedGame,
            code: room?.code!,
            clientId: clientId,
            hostId: room?.hostId!,
            otherIds: [...room?.otherIds!, clientId]
          });
          room?.addClient(connection, clientId);
          room?.broadcast({
            type: Packets.JoinGameResponse,
            code: room?.code!,
            clientId: clientId,
            hostId: room?.hostId!
          });
        } else {
          connection.sendReliable([{
            type: Packets.JoinGameError,
            reason: new DisconnectReason(Reasons.GameNotFound)
          }]);
        }
        break;
      }
      case Packets.GameDataAll:
        //console.log("sending", packet, writePacket(packet).toString());
        if (!rooms.has(code)) console.error("no CODE!!!!")
        console.log("Broadcasting GameData for code:", code)
        rooms.get(code)?.broadcast(packet);
        break;
      case Packets.GameDataTo: {
        const room = rooms.get(code);
        console.dir(["sending", packet.toClient, packet, writePacket(packet).toString()], {
          depth: 6
        });
        room?.clients.get(packet.toClient!)?.connection.sendReliable(packet);
        break;
      }
      default:
        console.log(packet);
        rooms.get(code)?.broadcast(packet, connection);
    }
  })
});

await server.listen();