import { Component } from "./component.ts";
import Message from "../util/message.ts";
import {SpawnFlags} from "../types/enums/spawnFlags.ts";

export abstract class Entity {
    constructor(
        public flags: SpawnFlags,
        public owner: number = -2,
        public components: Component[]
    ) {

    }

    abstract serialize(spawn: boolean): Message;
    abstract deserialize(spawn: boolean, message: Message): void;
}