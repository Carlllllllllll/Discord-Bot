const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { EmbedBuilder } = require('@discordjs/builders');
const { printWatermark } = require('./events/handler');
const config = require('./config.json');  // Include config.json

// Connect to MongoDB
mongoose.connect(config.mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

// Initialize client
const client = new Client({
    intents: Object.keys(GatewayIntentBits).map(key => GatewayIntentBits[key]),
});

// Initialize collections for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

let totalCommands = 0;
const commands = [];
const logDetails = [];

printWatermark();
console.log('\x1b[33m%s\x1b[0m', '┌───────────────────────────────────────────┐');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter(file => file.endsWith('.js'));
    const numCommands = commandFiles.length;

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, folder, file);
        const command = require(filePath);

        if (command.data) {
            try {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            } catch (error) {
                console.error(`Error registering command ${command.data.name}:`, error);
            }
        } else {
            console.error(`Command file ${file} does not export a valid command object.`);
        }
    }

    const folderDetails = `Folder: ${folder}, Number of commands: ${numCommands}`;
    logDetails.push(folderDetails);
    console.log('\x1b[33m%s\x1b[0m', `│ ${folderDetails.padEnd(34)} `);
    totalCommands += numCommands;
}
console.log('\x1b[35m%s\x1b[0m', `│ Total number of commands: ${totalCommands}`);
console.log('\x1b[33m%s\x1b[0m', '└───────────────────────────────────────────┘');

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    await client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

// Load event handlers
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    event(client);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(config.token);
