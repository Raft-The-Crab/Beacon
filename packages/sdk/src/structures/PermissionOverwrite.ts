import type { Client } from '../client';
import type { RawPermissionOverwrite } from '../types/index';
import { Permissions } from '../utils/Permissions';

export class PermissionOverwrite {
  public id: string;
  public type: number;
  public allow: Permissions;
  public deny: Permissions;

  constructor(public readonly client: Client, data: RawPermissionOverwrite) {
    this.id = data.id;
    this.type = data.type;
    this.allow = new Permissions(BigInt(data.allow));
    this.deny = new Permissions(BigInt(data.deny));
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      allow: this.allow.bitfield.toString(),
      deny: this.deny.bitfield.toString()
    };
  }
}
