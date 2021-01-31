import { Component } from "./component.ts";

/**
 * Entities aren't ready for use yet, implement these yourself
 */
export abstract class Entity<T = number> {
  constructor(
    public flags: T,
    public owner: number = -2,
    public components: Component[],
  ) {}
}
