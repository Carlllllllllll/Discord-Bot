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
const config = require('./config.json');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map(key => GatewayIntentBits[key]),
});

client.commands = new Collection();

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

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (typeof event === 'function') {
        event(client);
    } else {
        console.error(`Event file ${file} does not export a valid function.`);
    }
}

client.login(process.env.TOKEN);
