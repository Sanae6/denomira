import Message from "../util/message.ts";

/**
 * Incomplete, soon to be ready for use.
 * Components are referred to as InnerNetObject in the game's code and on {@link https://sus.wiki}
 */
export abstract class Component {
  constructor(
    public netId: number,
  ) {}

  abstract serialize(spawn: boolean): Message;
  abstract deserialize(spawn: boolean, message: Message): void;
}
