const connectDB = require('./database'); // Import the MongoDB connection function
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config(); // Load environment variables from .env file

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.commands = new Collection(); // Initialize commands collection

// Import and initialize bot commands (if needed)
require('./bot')(client);

// Function to load event handlers
const loadEventHandlers = () => {
    const eventFiles = [
        { name: 'guildMemberAdd', file: './events/guildMemberAdd' },
        { name: 'ticketHandler', file: './events/ticketHandler' },
        { name: 'voiceChannelHandler', file: './events/voiceChannelHandler' },
        { name: 'giveawayHandler', file: './events/giveaway' },
        { name: 'autoroleHandler', file: './events/autorole' },
        { name: 'reactionRoleHandler', file: './events/reactionroles' },
        { name: 'nqnHandler', file: './events/nqn' },
        { name: 'emojiHandler', file: './events/emojiHandler' },
        { name: 'music', file: './events/music' },
    ];

    eventFiles.forEach(({ name, file }) => {
        const handler = require(file);
        if (typeof handler === 'function') {
            handler(client);
            console.log(`\x1b[36m[ ${name.toUpperCase()} ]\x1b[0m`, '\x1b[32mSystem Active ✅\x1b[0m');
        } else {
            console.error(`\x1b[31m[ ERROR ]\x1b[0m ${name} handler is not a function.`);
        }
    });
};

// Connect to MongoDB and load event handlers after successful connection
connectDB()
    .then(() => {
        console.log('Connected to MongoDB');
        loadEventHandlers();
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });

// Login to Discord with your app's token
client.login(process.env.TOKEN).then(() => {
    console.log('Bot is logged in and ready to operate');
}).catch((err) => {
    console.error('Failed to login to Discord', err);
});
