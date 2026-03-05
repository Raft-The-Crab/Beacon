/**
 * CommandBuilder - Build slash commands for bots
 */

export enum CommandOptionType {
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11
}

export interface CommandOption {
  type: CommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: { name: string; value: string | number }[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

export interface Command {
  name: string;
  description: string;
  options?: CommandOption[];
  default_member_permissions?: string;
  dm_permission?: boolean;
  nsfw?: boolean;
}

export class CommandBuilder {
  private command: Partial<Command> = {};

  setName(name: string): this {
    if (!/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Command name must be 1-32 characters and alphanumeric');
    }
    this.command.name = name.toLowerCase();
    return this;
  }

  setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error('Description must be 1-100 characters');
    }
    this.command.description = description;
    return this;
  }

  addStringOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.STRING)));
  }

  addIntegerOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.INTEGER)));
  }

  addBooleanOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.BOOLEAN)));
  }

  addUserOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.USER)));
  }

  addChannelOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.CHANNEL)));
  }

  addRoleOption(builder: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    return this.addOption(builder(new CommandOptionBuilder(CommandOptionType.ROLE)));
  }

  private addOption(builder: CommandOptionBuilder): this {
    if (!this.command.options) {
      this.command.options = [];
    }
    if (this.command.options.length >= 25) {
      throw new Error('Commands can have at most 25 options');
    }
    this.command.options.push(builder.toJSON());
    return this;
  }

  setDefaultMemberPermissions(permissions: bigint | null): this {
    this.command.default_member_permissions = permissions?.toString() ?? undefined;
    return this;
  }

  setDMPermission(enabled: boolean): this {
    this.command.dm_permission = enabled;
    return this;
  }

  setNSFW(nsfw: boolean): this {
    this.command.nsfw = nsfw;
    return this;
  }

  toJSON(): Command {
    if (!this.command.name || !this.command.description) {
      throw new Error('Command must have name and description');
    }
    return this.command as Command;
  }
}

export class CommandOptionBuilder {
  private option: Partial<CommandOption>;

  constructor(type: CommandOptionType) {
    this.option = { type };
  }

  setName(name: string): this {
    if (!/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Option name must be 1-32 characters and alphanumeric');
    }
    this.option.name = name.toLowerCase();
    return this;
  }

  setDescription(description: string): this {
    if (description.length < 1 || description.length > 100) {
      throw new Error('Description must be 1-100 characters');
    }
    this.option.description = description;
    return this;
  }

  setRequired(required: boolean): this {
    this.option.required = required;
    return this;
  }

  addChoices(...choices: { name: string; value: string | number }[]): this {
    if (!this.option.choices) {
      this.option.choices = [];
    }
    this.option.choices.push(...choices);
    if (this.option.choices.length > 25) {
      throw new Error('Option can have at most 25 choices');
    }
    return this;
  }

  setMinValue(min: number): this {
    this.option.min_value = min;
    return this;
  }

  setMaxValue(max: number): this {
    this.option.max_value = max;
    return this;
  }

  setMinLength(min: number): this {
    this.option.min_length = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.option.max_length = max;
    return this;
  }

  toJSON(): CommandOption {
    if (!this.option.name || !this.option.description) {
      throw new Error('Option must have name and description');
    }
    return this.option as CommandOption;
  }
}
