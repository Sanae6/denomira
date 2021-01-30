import { Component } from "./component";
import Message from "../util/message";
import { SpawnFlags } from "../types/enums/spawnFlags";

export abstract class Entity {
  constructor(
    public flags: SpawnFlags,
    public owner: number = -2,
    public components: Component[],
  ) {
  }

  abstract serialize(spawn: boolean): Message;
  abstract deserialize(spawn: boolean, message: Message): void;
}
