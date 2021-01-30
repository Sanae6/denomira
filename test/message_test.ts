import * as test from "https://deno.land/std@0.83.0/testing/asserts.ts";
import Message from "../src/util/message.ts";

Deno.test({
  name: "read bytes from message",
  fn: function () {
    const message = new Message(
      new Uint8Array([8, 0x10, 0, 1, 7, 0x56, 32, 0, 0, 0]),
    );

    test.assertEquals(message.readU8(), 8, "failed u8 read");
    test.assertEquals(message.readU16BE(), 4096, "failed u16BE read");
    test.assertEquals(message.readU8(), 1, "second failed u8 read");
    test.assertEquals(message.readU16(), 22023, "failed u16 read");
    test.assertEquals(message.readU32(), 32, "failed u32 read");
  },
});

Deno.test({
  name: "write bytes to message",
  fn: function () {
    const message = new Message();
    message.writeU8(0);
    message.write8(1);
    message.writeU16(22023);
    message.write16(-2303);
    message.writeU16BE(22023);
    message.write16BE(-2303);
    message.writeU32(320397);
    message.write32(-328444);
    console.log(message);
  },
});

Deno.test({
  name: "write ip address to message",
  fn: function () {
    const message = new Message();
    message.writeAddress("12.34.56.78");
    test.assertEquals(
      message.toUint8Array(),
      new Uint8Array([12, 34, 56, 78]),
      "failed write ip address",
    );
  },
});

Deno.test({
  name: "read ip address from message",
  fn: function () {
    const message = new Message(new Uint8Array([127, 0, 0, 1]));
    test.assertEquals(
      message.readAddress(),
      "127.0.0.1",
      "failed read ip address",
    );
  },
});
