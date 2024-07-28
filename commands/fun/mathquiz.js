const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

let mathQuizActive = false;
let correctAnswer = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathquiz')
        .setDescription('Starts a math quiz game')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new math quiz'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('answer')
                .setDescription('Answer the math quiz')
                .addIntegerOption(option => option.setName('number').setDescription('Your answer').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End the current math quiz')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            if (mathQuizActive) {
                return interaction.reply('A math quiz is already active!');
            }
            startMathQuiz(interaction);
        } else if (subcommand === 'answer') {
            if (!mathQuizActive) {
                return interaction.reply('There is no active math quiz. Start one with `/mathquiz start`.');
            }
            const userAnswer = interaction.options.getInteger('number');
            checkAnswer(interaction, userAnswer);
        } else if (subcommand === 'end') {
            if (!mathQuizActive) {
                return interaction.reply('There is no active math quiz.');
            }
            endMathQuiz(interaction);
        }
    }
};

function startMathQuiz(interaction) {
    const num1 = Math.floor(Math.random() * 100) + 1;
    const num2 = Math.floor(Math.random() * 100) + 1;
    correctAnswer = num1 + num2;

    mathQuizActive = true;

    const embed = new EmbedBuilder()
        .setTitle('Math Quiz Started!')
        .setDescription(`What is ${num1} + ${num2}?`)
        .setColor('RANDOM');

    interaction.reply({ embeds: [embed] });
}

function checkAnswer(interaction, userAnswer) {
    if (userAnswer === correctAnswer) {
        mathQuizActive = false;
        correctAnswer = null;
        return interaction.reply(`Correct! The answer was ${userAnswer}.`);
    } else {
        return interaction.reply(`Incorrect. Try again!`);
    }
}

function endMathQuiz(interaction) {
    mathQuizActive = false;
    correctAnswer = null;
    interaction.reply('Math quiz ended.');
}
