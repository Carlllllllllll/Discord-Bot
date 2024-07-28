const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const config = require('../../config.json');

// MongoDB setup
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const unoGameSchema = new mongoose.Schema({
    channelId: String,
    players: Array,
    currentPlayerIndex: Number,
    ready: Boolean,
    starterId: String,
});

const UnoGameModel = mongoose.model('UnoGame', unoGameSchema);

// UnoGame class
class UnoGame {
    constructor(channelId, starterId) {
        this.channelId = channelId;
        this.starterId = starterId;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.ready = false;
    }

    addPlayer(user) {
        this.players.push(user);
    }

    hasPlayer(userId) {
        return this.players.some(player => player.id === userId);
    }

    setReady(ready) {
        this.ready = ready;
    }

    isReady() {
        return this.ready;
    }

    isPlayerTurn(userId) {
        return this.players[this.currentPlayerIndex].id === userId;
    }

    playCard(userId, card) {
        // Dummy logic for card playing
        return { success: true, message: 'Card played successfully', gameOver: false };
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    start() {
        this.currentPlayerIndex = 0;
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    async save() {
        await UnoGameModel.findOneAndUpdate(
            { channelId: this.channelId },
            {
                channelId: this.channelId,
                players: this.players,
                currentPlayerIndex: this.currentPlayerIndex,
                ready: this.ready,
                starterId: this.starterId,
            },
            { upsert: true }
        );
    }

    static async load(channelId) {
        const gameData = await UnoGameModel.findOne({ channelId });
        if (!gameData) return null;

        const game = new UnoGame(channelId, gameData.starterId);
        game.players = gameData.players;
        game.currentPlayerIndex = gameData.currentPlayerIndex;
        game.ready = gameData.ready;
        return game;
    }

    static async delete(channelId) {
        await UnoGameModel.findOneAndDelete({ channelId });
    }
}

// gameManager
const gameManager = {
    games: new Map(),

    async addGame(channelId, game) {
        this.games.set(channelId, game);
        await game.save();
    },

    async getGame(channelId) {
        if (this.games.has(channelId)) {
            return this.games.get(channelId);
        }
        const game = await UnoGame.load(channelId);
        if (game) {
            this.games.set(channelId, game);
        }
        return game;
    },

    async removeGame(channelId) {
        this.games.delete(channelId);
        await UnoGame.delete(channelId);
    },

    hasGame(channelId) {
        return this.games.has(channelId);
    },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uno')
        .setDescription('Play UNO with friends!')
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
                .setDescription('Ready to start the UNO game'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('playcard')
                .setDescription('Play a card in the UNO game')
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
        const channelId = interaction.channel.id;
        let game;

        switch (subcommand) {
            case 'start':
                if (await gameManager.hasGame(channelId)) {
                    return interaction.reply({ content: 'A game is already in progress in this channel.', ephemeral: true });
                }

                game = new UnoGame(channelId, interaction.user.id);
                game.addPlayer(interaction.user);
                await gameManager.addGame(channelId, game);

                return interaction.reply({ content: 'UNO game started! Use `/uno join` to join the game.', ephemeral: true });

            case 'join':
                game = await gameManager.getGame(channelId);
                if (!game) {
                    return interaction.reply({ content: 'No game in progress in this channel.', ephemeral: true });
                }

                if (game.hasPlayer(interaction.user.id)) {
                    return interaction.reply({ content: 'You are already in the game.', ephemeral: true });
                }

                game.addPlayer(interaction.user);
                await game.save();
                return interaction.reply({ content: `${interaction.user.username} joined the UNO game!`, ephemeral: true });

            case 'ready':
                game = await gameManager.getGame(channelId);
                if (!game) {
                    return interaction.reply({ content: 'No game in progress in this channel.', ephemeral: true });
                }

                if (!game.hasPlayer(interaction.user.id)) {
                    return interaction.reply({ content: 'You are not in the game.', ephemeral: true });
                }

                game.setReady(true);
                game.start();
                await game.save();
                return interaction.reply({ content: 'The game has started!', ephemeral: true });

            case 'playcard':
                game = await gameManager.getGame(channelId);
                if (!game) {
                    return interaction.reply({ content: 'No game in progress in this channel.', ephemeral: true });
                }

                if (!game.isReady()) {
                    return interaction.reply({ content: 'The game has not started yet.', ephemeral: true });
                }

                const card = interaction.options.getString('card');
                const userId = interaction.user.id;

                if (!game.isPlayerTurn(userId)) {
                    return interaction.reply({ content: 'It is not your turn.', ephemeral: true });
                }

                const result = game.playCard(userId, card);
                if (!result.success) {
                    return interaction.reply({ content: result.message, ephemeral: true });
                }

                if (result.gameOver) {
                    await gameManager.removeGame(channelId);
                    return interaction.reply({ content: `Game over! ${interaction.user.username} wins!`, ephemeral: true });
                }

                game.nextTurn();
                await game.save();
                return interaction.reply({ content: result.message, ephemeral: true });

            case 'endgame':
                game = await gameManager.getGame(channelId);
                if (!game) {
                    return interaction.reply({ content: 'No game in progress in this channel.', ephemeral: true });
                }

                if (game.starterId !== interaction.user.id) {
                    return interaction.reply({ content: 'Only the user who started the game can end it.', ephemeral: true });
                }

                await gameManager.removeGame(channelId);
                return interaction.reply({ content: 'The UNO game has been ended.', ephemeral: true });

            default:
                return interaction.reply({ content: 'Invalid command.', ephemeral: true });
        }
    },
};
