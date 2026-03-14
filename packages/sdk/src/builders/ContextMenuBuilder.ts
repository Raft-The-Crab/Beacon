/**
 * ContextMenuBuilder — Build user and message context menu commands.
 */

export type ContextMenuType = 'USER' | 'MESSAGE';

export interface ContextMenuData {
  name: string;
  type: ContextMenuType;
  /** Only allow in servers */
  dmPermission?: boolean;
  /** Permission bit string */
  defaultMemberPermissions?: string;
}

export class ContextMenuBuilder {
  private data: Partial<ContextMenuData> = {};

  setName(name: string): this {
    if (!/^[\w- ]{1,32}$/.test(name)) throw new Error('Context menu name must be 1-32 chars');
    this.data.name = name;
    return this;
  }

  setType(type: ContextMenuType): this {
    this.data.type = type;
    return this;
  }

  /** Allow or disallow use in DMs (default true) */
  setDMPermission(enabled: boolean): this {
    this.data.dmPermission = enabled;
    return this;
  }

  /** Set permission bits required to see this command (e.g. "8" for ADMINISTRATOR) */
  setDefaultMemberPermissions(bits: bigint | null): this {
    this.data.defaultMemberPermissions = bits?.toString() ?? undefined;
    return this;
  }

  toJSON(): ContextMenuData {
    if (!this.data.name) throw new Error('ContextMenuBuilder: name is required');
    if (!this.data.type) throw new Error('ContextMenuBuilder: type is required');
    return this.data as ContextMenuData;
  }
}
