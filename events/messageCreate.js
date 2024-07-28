const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        let config;
        try {
            const data = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (err) {
            console.error('Error reading or parsing config file:', err);
            return message.reply('There was an error reading the configuration.');
        }

        const serverPrefixes = config.prefixes && config.prefixes.server_specific;
        const prefix = (serverPrefixes && serverPrefixes[message.guild.id]) || config.prefixes.default;

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands || !client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error('Error executing command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Command Error')
                .setDescription(`An error occurred while executing the \`${commandName}\` command.`)
                .addFields({ name: 'Error Details:', value: error.message });

            if (message.reply) {
                await message.reply({ embeds: [errorEmbed] });
            } else {
                console.error('Message object does not have a reply method.');
            }
        }
    },
};
