const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

class UnoGame {
    constructor(channel, players = [], currentPlayerIndex = 0, deck = [], discardPile = [], gameStarted = false) {
        this.channel = channel;
        this.players = players;
        this.currentPlayerIndex = currentPlayerIndex;
        this.deck = deck;
        this.discardPile = discardPile;
        this.gameStarted = gameStarted;
    }

    startGame() {
        this.gameStarted = true;
        this.shuffleDeck();
        this.dealCards();
    }

    shuffleDeck() {
        // Implement card shuffling logic here
    }

    dealCards() {
        // Implement card dealing logic here
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.players[this.currentPlayerIndex];
    }

    playCard(player, card) {
        // Implement card playing logic here
    }
}

class GameManager {
    constructor() {
        this.games = new Map();
    }

    createGame(channel) {
        const game = new UnoGame(channel);
        this.games.set(channel.id, game);
        return game;
    }

    getGame(channel) {
        return this.games.get(channel.id);
    }

    deleteGame(channel) {
        this.games.delete(channel.id);
    }
}

const gameManager = new GameManager();

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
                .setName('playcard')
                .setDescription('Play a card in your hand')
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

        if (subcommand === 'start') {
            let game = gameManager.getGame(interaction.channel);
            if (game) {
                return interaction.reply('A game is already in progress in this channel.');
            }
            game = gameManager.createGame(interaction.channel);
            game.startGame();
            return interaction.reply('Started a new UNO game! Use /uno join to join the game.');
        } else if (subcommand === 'join') {
            const game = gameManager.getGame(interaction.channel);
            if (!game) {
                return interaction.reply('There is no game in progress in this channel.');
            }
            if (game.players.includes(interaction.user)) {
                return interaction.reply('You are already in the game.');
            }
            game.players.push(interaction.user);
            return interaction.reply(`${interaction.user.username} joined the game!`);
        } else if (subcommand === 'playcard') {
            const game = gameManager.getGame(interaction.channel);
            if (!game) {
                return interaction.reply('There is no game in progress in this channel.');
            }
            const card = interaction.options.getString('card');
            // Implement card playing logic
            return interaction.reply(`${interaction.user.username} played ${card}!`);
        } else if (subcommand === 'endgame') {
            const game = gameManager.getGame(interaction.channel);
            if (!game) {
                return interaction.reply('There is no game in progress in this channel.');
            }
            if (interaction.user.id !== game.players[0].id) {
                return interaction.reply('Only the user who started the game can end it.');
            }
            gameManager.deleteGame(interaction.channel);
            return interaction.reply('The UNO game has been ended.');
        }
    }
};
