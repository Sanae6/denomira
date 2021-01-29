//Message reader/writer class
// TODO: writing related problems
// - writing has no cap on integer size, don't rely on internal dataview for checks all the time

export default class Message {
  public buffer: ArrayBufferLike;
  public cursor = 0;
  public tag?: number;
  private view: DataView;
  private u8view: Uint8Array;
  private messageStarts: number[] = [];

  constructor(buffer?: Uint8Array) {
    if (buffer != undefined) {
      this.buffer = buffer.buffer;
      this.u8view = buffer;
    } else {
      this.buffer = new ArrayBuffer(1);
      this.u8view = new Uint8Array(this.buffer);
    }
    this.view = new DataView(this.buffer);
  }

  private resize(add: number) {
    const newBuffer = new ArrayBuffer(this.cursor + add);
    const newU8view = new Uint8Array(newBuffer);
    newU8view.set(this.u8view, 0);
    this.u8view = newU8view;
    this.buffer = newBuffer;
    this.view = new DataView(newBuffer);
  }

  readU8(): number {
    const value = this.view.getUint8(this.cursor);

    this.cursor++;

    return value;
  }

  read8(): number {
    const value = this.view.getInt8(this.cursor);

    this.cursor++;

    return value;
  }

  readBoolean(): boolean {
    return !!this.readU8();
  }

  readU16(): number {
    const value = this.view.getUint16(this.cursor, true);

    this.cursor += 2;

    return value;
  }

  read16(): number {
    const value = this.view.getInt16(this.cursor, true);

    this.cursor += 2;

    return value;
  }

  readU16BE(): number {
    const value = this.view.getUint16(this.cursor, false);

    this.cursor += 2;

    return value;
  }

  read16BE(): number {
    const value = this.view.getInt16(this.cursor, false);

    this.cursor += 2;

    return value;
  }

  readU32(): number {
    const value = this.view.getUint32(this.cursor, true);

    this.cursor += 4;

    return value;
  }

  read32(): number {
    const value = this.view.getInt32(this.cursor, true);

    this.cursor += 4;

    return value;
  }

  readU32BE(): number {
    const value = this.view.getUint32(this.cursor, false);

    this.cursor += 4;

    return value;
  }

  read32BE(): number {
    const value = this.view.getInt32(this.cursor, false);

    this.cursor += 4;

    return value;
  }

  readF32(): number {
    const value = this.view.getFloat32(this.cursor, true);

    this.cursor += 4;

    return value;
  }

  readPacked(): number {
    let readMore = true;
    let shift = 0;
    let output = 0;

    while (readMore) {
      if (this.u8view.byteLength <= this.cursor) {
        throw new Error(`No bytes left to read`);
      }

      let next = this.readU8();

      if (next >= 0x80) {
        readMore = true;
        next ^= 0x80;
      } else {
        readMore = false;
      }

      output |= next << shift;
      shift += 7;
    }

    return output;
  }

  readUPacked(): number {
    return this.readPacked() >>> 0;
  }

  readMessage(): Message {
    const len = this.readU16();
    const tag = this.readU8();
    const msg = new Message(
      this.u8view.slice(this.cursor, this.cursor + len)
    );

    msg.tag = tag;
    this.cursor += len;

    return msg;
  }

  writeU8(value: number): Message {
    this.resize(1);

    this.view.setUint8(this.cursor, value);

    this.cursor++;

    return this;
  }

  write8(value: number): Message {
    this.resize(1);

    this.view.setInt8(this.cursor, value);

    this.cursor++;

    return this;
  }

  writeBoolean(value: boolean): Message {
    this.writeU8(value?1:0);

    return this;
  }

  writeU16(value: number): Message {
    this.resize(2);

    this.view.setUint16(this.cursor, value, true);

    this.cursor += 2;

    return this;
  }

  write16(value: number): Message {
    this.resize(2);

    this.view.setInt16(this.cursor, value, true);

    this.cursor += 2;

    return this;
  }

  writeU16BE(value: number): Message {
    this.resize(2);

    this.view.setUint16(this.cursor, value, false);

    this.cursor += 2;

    return this;
  }

  write16BE(value: number): Message {
    this.resize(2);

    this.view.setInt16(this.cursor, value, false);

    this.cursor += 2;

    return this;
  }

  writeU32(value: number): Message {
    this.resize(4);

    this.view.setUint32(this.cursor, value, true);

    this.cursor += 4;

    return this;
  }

  write32(value: number): Message {
    this.resize(4);

    this.view.setInt32(this.cursor, value, true);

    this.cursor += 4;

    return this;
  }

  writeU32BE(value: number): Message {
    this.resize(4);

    this.view.setUint32(this.cursor, value, false);

    this.cursor += 4;

    return this;
  }

  write32BE(value: number): Message {
    this.resize(4);

    this.view.setInt32(this.cursor, value, false);

    this.cursor += 4;

    return this;
  }

  writeF32(value: number): Message {
    this.resize(4);

    this.view.setFloat32(this.cursor, value, true);

    this.cursor += 4;

    return this;
  }

  writePacked(value: number): Message {
    this.writeUPacked(value >>> 0);

    return this;
  }

  writeUPacked(value: number): Message {
    // if (value > MaxValue.UInt32 || value < MinValue.UInt32) {
    //   throw new RangeError(`Value outside of UInt32 range: ${MinValue.UInt32} <= ${value} <= ${MaxValue.UInt32}`);
    // }

    do {
      let b = value & 0xff;

      if (value >= 0x80) {
        b |= 0x80;
      }

      this.writeU8(b);

      value >>>= 7;
    } while (value != 0);

    return this;
  }

  writeBytes(value: Uint8Array | Message): Message {
    if (value instanceof Message) {
      value = value.toUint8Array();
    }

    this.resize(value.length);

    this.u8view.set(value, this.cursor);

    this.cursor += value.length;

    return this;
  }

  writeAddress(value: string): Message {
    const bytes = value.split(".").map(x => parseInt(x))

    bytes.forEach(x => this.writeU8(x));

    return this;
  }

  writeString(value: string): Message {
    this.writeUPacked(value.length).writeBytes(new TextEncoder().encode(value));

    return this;
  }

  startMessage(tag = 0): this {
    this.writeU16(0).writeU8(tag);

    this.messageStarts.push(this.cursor);

    return this;
  }

  endMessage(): this {
    const start = this.messageStarts.pop();

    if (start) {
      const length = this.cursor - start;

      // if (length > MaxValue.UInt16) {
      //   throw new Error(`Message length is greater than UInt16 max: ${length} <= ${MaxValue.UInt16}`);
      // }

      this.view.setUint16(start - 3, length, true);
    } else {
      throw new Error("No open nested messages to end");
    }

    return this;
  }

  readBytes(count?: number): Uint8Array {
    if (count == undefined) count = this.u8view.length - this.cursor;
    const slice = this.u8view.slice(this.cursor, this.cursor + count);

    this.cursor += count;

    return slice;
  }

  readAddress(): string {
    return this.readBytes(4).join(".");
  }

  readString(): string {
    return new TextDecoder().decode(this.readBytes(this.readUPacked()));
  }

  readList<T>(reader: (subMessage: Message) => T, packed = true): T[] {
    const result = [];

    const len = this[packed ? "readUPacked" : "readU8"]();
    for (let i = 0; i < len; i++) {
      result.push(reader(this));
    }

    return result;
  }

  readMessageList<T>(reader: (subMessage: Message) => T): T[] {
    const result = [];

    while (this.u8view.length > this.cursor) {
      const msg = this.readMessage();
      result.push(reader(msg));
    }

    return result;
  }

  writeList<T>(value: T[], writer: (value: T) => Message, packed = true): Message {
    this[packed ? "writeUPacked" : "writeU8"](value.length);
    for (const val of value) {
      const message = writer(val);
      this.writeBytes(message.u8view);
    }

    return this;
  }

  writeMessages(value: Message[]): Message {
    for (const val of value) {
      this.writeBytes(val.toUint8Array());
    }

    return this;
  }

  toString(): string {
    return ([...this.u8view]).map((val) => val.toString(16).padStart(2, "0"))
      .join(" ");
  }

  toUint8Array(): Uint8Array {
    return this.u8view;
  }

  hasBytesLeft(): boolean {
    return this.u8view.length > this.cursor;
  }

  get length(): number {
    return this.u8view.length;
  }
}
