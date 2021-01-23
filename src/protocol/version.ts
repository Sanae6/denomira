//rewrite this to not be stolen from NodePolus' rewrite

export default class ClientVersion {
  constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number,
    public readonly revision: number,
  ) {}

  static decode(version: number): ClientVersion {
    const year = Math.floor(version / 25000);

    version %= 25000;

    const month = Math.floor(version / 1800);

    version %= 1800;

    const day = Math.floor(version / 50);
    const revision = version % 50;

    return new this(year, month, day, revision);
  }

  encode(): number {
    return (this.year * 25000) + (this.month * 1800) + (this.day * 50) + this.revision;
  }

  equals(otherVersion: ClientVersion): boolean {
    return (
      this.year == otherVersion.year &&
      this.month == otherVersion.month &&
      this.day == otherVersion.day &&
      this.revision == otherVersion.revision
    );
  }
}