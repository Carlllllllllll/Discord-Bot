const { ChannelType, PermissionsBitField, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const path = require('path');

const wordListPath = path.join(__dirname, '..', '..', '..', 'src', 'events', 'wordList.json');

let wordList;
try {
    wordList = JSON.parse(fs.readFileSync(wordListPath, 'utf8'));
} catch (error) {
    console.error('Error reading word list:', error);
    throw error;
}

module.exports = {
    name: 'wordassociation',
    description: 'Start a game of Word Association!',
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const commandUser = interaction.user;

        // Check if a channel already exists
        let existingChannel = interaction.guild.channels.cache.find(ch => ch.name === `${commandUser.username}-word-association` && ch.type === ChannelType.GuildText);

        if (existingChannel) {
            return interaction.reply({ content: 'You already have an active game channel. Please finish the current game before starting a new one.', ephemeral: true });
        }

        // Create a new channel for the game
        const newChannel = await interaction.guild.channels.create({
            name: `${commandUser.username}-word-association`,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: commandUser.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });

        // Notify the user
        await interaction.reply(`Game channel created: <#${newChannel.id}>`);

        // Send DM with the word and hint to the command user
        let currentWordObject = wordList[Math.floor(Math.random() * wordList.length)];
        let currentWord = currentWordObject.word;
        let currentHint = currentWordObject.hint;

        try {
            await commandUser.send(`The word is ${currentWord}.\nHint: ${currentHint}`);
        } catch (error) {
            console.error('Error sending DM:', error);
            return interaction.reply({ content: 'Failed to send a DM with the word and hint.', ephemeral: true });
        }

        // Filter messages in the game channel
        const filter = (msg) => {
            return !msg.content.startsWith('!') || msg.author.id === commandUser.id;
        };

        const collector = newChannel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (msg) => {
            if (msg.content.startsWith('!') && msg.author.id === commandUser.id) {
                await msg.delete();
                return;
            }

            if (msg.content.startsWith('!')) {
                if (msg.content.toLowerCase() === currentWord.toLowerCase()) {
                    try {
                        await commandUser.send(`Congratulations! You guessed the word correctly. The new word is being sent to you.`);
                    } catch (error) {
                        console.error('Error sending DM:', error);
                    }

                    // Pick a new word and hint
                    currentWordObject = wordList[Math.floor(Math.random() * wordList.length)];
                    currentWord = currentWordObject.word;
                    currentHint = currentWordObject.hint;

                    try {
                        await commandUser.send(`The new word is ${currentWord}.\nHint: ${currentHint}`);
                    } catch (error) {
                        console.error('Error sending DM:', error);
                        return interaction.reply({ content: 'Failed to send a DM with the new word and hint.', ephemeral: true });
                    }
                } else {
                    await msg.reply('The message is not related to the word.');
                }
            }
        });

        collector.on('end', async () => {
            await newChannel.send('The game has ended.');
            setTimeout(() => newChannel.delete(), 5000);
        });
    },
};
