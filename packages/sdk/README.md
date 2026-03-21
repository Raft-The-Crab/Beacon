# beacon-sdk

The official, ultra-fast TypeScript SDK for the Beacon platform. Designed for building robust bots, rich integrations, and high-performance gateway clients.

## 🚀 Key Features

- **Fluent Builders**: Create Embeds, Buttons, Select Menus, and Modals with a clean, chainable API.
- **Unified Gateway**: Seamless WebSocket handling with automatic reconnection and event dispatching.
- **Type Safety**: Built from the ground up with TypeScript for a rock-solid developer experience.
- **Rich Interactions**: Native support for Slash Commands, Message Components, and Modal Submissions.

## 📦 Installation

```bash
npm install beacon-sdk
```

## 🛠 Quick Start

```typescript
import { BeaconClient, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'beacon-sdk';

const client = new BeaconClient({
  token: 'YOUR_BOT_TOKEN',
  intents: ['GUILDS', 'GUILD_MESSAGES', 'MESSAGE_CONTENT']
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    const embed = new EmbedBuilder()
      .setTitle('Beacon SDK v2.5.0')
      .setDescription('Stability, performance, and developer-first design.')
      .setColor('#5865F2')
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Documentation')
          .setStyle(ButtonStyle.Link)
          .setURL('https://beacon.qzz.io/docs')
      );

    await message.reply({ embeds: [embed], components: [row] });
  }
});

client.login();
```

## 📊 Interaction Builders

```typescript
import { CommandBuilder, ApplicationCommandOptionType } from 'beacon-sdk';

const pingCommand = new CommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')
  .addOption({
    name: 'ephemeral',
    description: 'Whether to show the response only to you',
    type: ApplicationCommandOptionType.Boolean,
    required: false
  });
```

## 🔒 Security

Beacon SDK uses high-entropy token systems and supports signed requests. All outgoing payloads are validated against internal schemas to ensure platform compatibility.

## 📄 License

MIT © Beacon Team
