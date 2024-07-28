const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, Permissions } = require('discord.js');
const UnoGame = require('../utils/UnoGame');
const gameManager = require('../utils/gameManager');
const client = require('../main');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uno')
        .setDescription('Play UNO!')
        .addSubcommand(subcommand => 
            subcommand
                .setName('start')
                .setDescription('Start a new UNO game'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join an existing UNO game'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ready')
                .setDescription('Start the game once all players are ready'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('playcard')
                .setDescription('Play a card')
                .addStringOption(option =>
                    option.setName('card')
                        .setDescription('The card to play')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('endgame')
                .setDescription('End the current UNO game')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        switch (subcommand) {
            case 'start':
                await startGame(interaction);
                break;
            case 'join':
                await joinGame(interaction);
                break;
            case 'ready':
                await readyGame(interaction);
                break;
            case 'playcard':
                await playCard(interaction);
                break;
            case 'endgame':
                await endGame(interaction);
                break;
            default:
                await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
                break;
        }
    }
};

async function startGame(interaction) {
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;

    if (gameManager.hasGame(guildId)) {
        await interaction.reply({ content: 'There is already an ongoing game in this server.', ephemeral: true });
        return;
    }

    const channel = await interaction.guild.channels.create(`uno-game-${interaction.user.username}`, {
        type: 'GUILD_TEXT',
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                allow: ['VIEW_CHANNEL'],
                deny: ['SEND_MESSAGES']
            },
            {
                id: interaction.user.id,
                allow: ['SEND_MESSAGES']
            }
        ]
    });

    const game = new UnoGame(channel.id);
    gameManager.addGame(guildId, game);

    await interaction.reply({ content: `UNO game started! Join the game in ${channel}.` });
}

async function joinGame(interaction) {
    const guildId = interaction.guildId;

    if (!gameManager.hasGame(guildId)) {
        await interaction.reply({ content: 'There is no ongoing game in this server.', ephemeral: true });
        return;
    }

    const game = gameManager.getGame(guildId);
    const user = interaction.user;

    if (game.hasPlayer(user.id)) {
        await interaction.reply({ content: 'You have already joined the game.', ephemeral: true });
        return;
    }

    game.addPlayer(user);
    await interaction.reply({ content: `${user.username} has joined the game!` });
}

async function readyGame(interaction) {
    const guildId = interaction.guildId;

    if (!gameManager.hasGame(guildId)) {
        await interaction.reply({ content: 'There is no ongoing game in this server.', ephemeral: true });
        return;
    }

    const game = gameManager.getGame(guildId);

    if (!game.hasPlayer(interaction.user.id)) {
        await interaction.reply({ content: 'You are not part of this game.', ephemeral: true });
        return;
    }

    if (game.isReady()) {
        await interaction.reply({ content: 'The game is already ready.', ephemeral: true });
        return;
    }

    game.setReady(true);
    await interaction.reply({ content: 'The game is now ready to start!' });

    const channel = interaction.guild.channels.cache.get(game.channelId);
    await channel.permissionOverwrites.edit(interaction.guild.id, { VIEW_CHANNEL: false });
    await channel.permissionOverwrites.edit(game.players.map(player => player.id), { VIEW_CHANNEL: true, SEND_MESSAGES: true });

    game.start();
}

async function playCard(interaction) {
    const guildId = interaction.guildId;

    if (!gameManager.hasGame(guildId)) {
        await interaction.reply({ content: 'There is no ongoing game in this server.', ephemeral: true });
        return;
    }

    const game = gameManager.getGame(guildId);
    const card = interaction.options.getString('card');

    if (!game.hasPlayer(interaction.user.id)) {
        await interaction.reply({ content: 'You are not part of this game.', ephemeral: true });
        return;
    }

    if (!game.isPlayerTurn(interaction.user.id)) {
        await interaction.reply({ content: 'It is not your turn.', ephemeral: true });
        return;
    }

    const result = game.playCard(interaction.user.id, card);

    if (!result.success) {
        await interaction.reply({ content: result.message, ephemeral: true });
        return;
    }

    await interaction.reply({ content: `${interaction.user.username} played ${card}` });

    if (result.gameOver) {
        await interaction.channel.send(`${interaction.user.username} has won the game!`);
        gameManager.removeGame(guildId);
    } else {
        game.nextTurn();
        await interaction.channel.send(`It is now ${game.currentPlayer.username}'s turn!`);
    }
}

async function endGame(interaction) {
    const guildId = interaction.guildId;

    if (!gameManager.hasGame(guildId)) {
        await interaction.reply({ content: 'There is no ongoing game in this server.', ephemeral: true });
        return;
    }

    gameManager.removeGame(guildId);
    await interaction.reply({ content: 'The game has been ended.' });
}
