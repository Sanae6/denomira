import Message from "../util/message.ts";

/*
 * This class has been taken from NodePolus (rewrite) and slightly modified to be used in denomira.
 */

/**
 * The versions of lobby codes and their corresponding character length.
 */
export enum LobbyCodeVersion {
  One = 4,
  Two = 6,
}

/**
 * A mapping of characters to integers used when encoding V2 codes.
 */
export const CHAR_MAP: number[] = [
  25,
  21,
  19,
  10,
  8,
  11,
  12,
  13,
  22,
  15,
  16,
  6,
  24,
  23,
  18,
  7,
  0,
  3,
  9,
  4,
  14,
  20,
  1,
  2,
  5,
  17,
];

/**
 * A mapping of integers to characters used when decoding V2 codes.
 */
export const CHAR_SET = "QWXRTYLPESDFGHUJKZOCVBINMA";

/**
 * A helper class used to generate, encode, and decode Among Us lobby codes.
 */
export class LobbyCode {
  /**
   * Gets a special lobby code that, when rendered in-game, hides the code as
   * well as the "Code" text.
   */
  static getHiddenCode(): string {
    return "A[][";
  }

  /**
   * Gets a special lobby code that, when rendered in-game, replaces the code
   * with an empty translucent box.
   */
  static getRemovedCode(): string {
    return "9999";
  }

  /**
   * Gets a randomized lobby code of the given version.
   *
   * @param version The version to generate (default `LobbyCodeVersion.Two`)
   */
  static generate(version: LobbyCodeVersion = LobbyCodeVersion.Two): string {
    return new Array(version)
      .fill(0)
      .map(() => CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)])
      .join("");
  }

  /**
   * Gets the encoded integer value of the given lobby code whose version is
   * inferred based on its length.
   *
   * @param code The lobby code
   * @returns The encoded integer value
   */
  static encode(code: string): number {
    code = code.toUpperCase();

    if (code.length == 4) {
      return LobbyCode.encodeV1(code);
    }

    if (code.length == 6) {
      return LobbyCode.encodeV2(code);
    }

    throw new TypeError(
      `Invalid lobby code, expected 4 or 6 characters: ${code}`,
    );
  }

  /**
   * Gets the encoded integer value of the given V1 lobby code.
   *
   * @param code The lobby code
   * @returns The encoded integer value
   */
  static encodeV1(code: string): number {
    const buf = new Message();

    buf.writeBytes(new TextEncoder().encode(code));
    buf.cursor = 0;

    return buf.read32();
  }

  /**
   * Gets the encoded integer value of the given V2 lobby code.
   *
   * @param code The lobby code
   * @returns The encoded integer value
   */
  static encodeV2(code: string): number {
    const a = CHAR_MAP[code.charCodeAt(0) - 65];
    const b = CHAR_MAP[code.charCodeAt(1) - 65];
    const c = CHAR_MAP[code.charCodeAt(2) - 65];
    const d = CHAR_MAP[code.charCodeAt(3) - 65];
    const e = CHAR_MAP[code.charCodeAt(4) - 65];
    const f = CHAR_MAP[code.charCodeAt(5) - 65];

    const one = (a + (26 * b)) & 0x3ff;
    const two = c + (26 * (d + (26 * (e + (26 * f)))));

    return one | ((two << 10) & 0x3ffffc00) | 0x80000000;
  }

  /**
   * Gets the lobby code from the given encoded integer value whose version is
   * inferred based on its sign.
   *
   * @param id The encoded integer value
   * @returns The lobby code
   */
  static decode(id: number): string {
    return id < 0 ? LobbyCode.decodeV2(id) : LobbyCode.decodeV1(id);
  }

  /**
   * Gets the V1 lobby code from the given encoded integer value.
   *
   * @param id The encoded integer value
   * @returns The lobby code
   */
  static decodeV1(id: number): string {
    return new TextDecoder().decode(new Int32Array(id));
  }

  /**
   * Gets the V2 lobby code from the given encoded integer value.
   *
   * @param id The encoded integer value
   * @returns The lobby code
   */
  static decodeV2(id: number): string {
    const a = id & 0x3ff;
    let b = (id >> 10) & 0xfffff;

    return [
      CHAR_SET[Math.floor(a % 26)],
      CHAR_SET[Math.floor(a / 26)],
      CHAR_SET[Math.floor(b % 26)],
      CHAR_SET[Math.floor((b /= 26) % 26)],
      CHAR_SET[Math.floor((b /= 26) % 26)],
      CHAR_SET[Math.floor((b / 26) % 26)],
    ].join("");
  }
}
