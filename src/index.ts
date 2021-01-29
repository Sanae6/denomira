import Message from "./message.ts";
const fromHexString = (hexString: string) =>
  new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
const b = fromHexString("");//pass 
const msg = new Message(b);
msg.readBytes(3);

while (msg.hasBytesLeft()) {
  const m = msg.readMessage();
  console.log(m.tag)
}