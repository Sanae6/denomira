/**
 * Components are referred to as InnerNetObject in the game's code and on {@link https://sus.wiki}
 */
export abstract class Component {
    constructor(
        public netId: number,
    ) {}
}