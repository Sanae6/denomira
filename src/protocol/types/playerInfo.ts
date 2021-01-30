import Message from "../../util/message.ts";

export interface PlayerInfo {
  id: number;
  name: string;
  color: number;
  hat: number;
  pet: number;
  skin: number;
  flags: number;
  tasks: TaskInfo[];
}

export interface TaskInfo {
  id: number;
  completed: boolean;
}

export function readPlayerInfo(message: Message): PlayerInfo {
  return {
    id: message.tag!,
    name: message.readString(),
    color: message.readU8(),
    hat: message.readUPacked(),
    pet: message.readUPacked(),
    skin: message.readUPacked(),
    flags: message.readU8(),
    tasks: message.readList((sub) => {
      return {
        id: sub.readUPacked(),
        completed: sub.readBoolean(),
      };
    }, false),
  };
}

export function writePlayerInfo(info: PlayerInfo): Message {
  return new Message().startMessage(info.id)
    .writeString(info.name)
    .writeU8(info.color)
    .writeUPacked(info.hat)
    .writeUPacked(info.pet)
    .writeUPacked(info.skin)
    .writeU8(info.flags)
    .writeList(info.tasks, (task) =>
      new Message()
        .writeUPacked(task.id)
        .writeBoolean(task.completed), false)
    .endMessage();
}
