import Message from "../util/message.ts";

export enum Reasons {
  ExitGame = 0,
  GameFull = 1,
  GameStarted = 2,
  GameNotFound = 3,
  CustomOld = 4,
  IncorrectVersion = 5,
  Banned = 6,
  Kicked = 7,
  Custom = 8,
  InvalidName = 9,
  Hacking = 10,

  Destroy = 16,
  Error = 17,
  IncorrectGame = 18,
  ServerRequest = 19,
  ServerFull = 20,

  FocusLostBackground = 207,
  IntentionalLeaving = 208,
  FocusLost = 209,
  NewConnection = 210,
}

export default class DisconnectReason {
  custom?: string;
  constructor(public reason: Reasons, custom?: string | Message) {
    if (custom != undefined && reason == Reasons.Custom) {
      if (custom instanceof Message) {
        this.custom = custom.readString();
      } else if (typeof (custom) == "string") {
        this.custom = custom;
      }
    }
  }

  static fromMessage(message: Message): DisconnectReason | undefined {
    if (message.length == message.cursor) return undefined;
    const reason = message.readU8();
    if (reason == Reasons.Custom) {
      return new DisconnectReason(reason, message.readString());
    }
    return new DisconnectReason(reason);
  }

  toMessage(useU32 = false): Message {
    const message = new Message();

    if (useU32) message.writeU32(this.reason);
    else message.writeU8(this.reason);
    if (this.reason == Reasons.Custom) message.writeString(this.custom!);

    return message;
  }
}
