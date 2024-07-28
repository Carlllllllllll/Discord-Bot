const connectDB = require('./database'); // Import the MongoDB connection function
const client = require('./main'); // Import the client from main.js
require('./bot'); // Import bot initialization (if needed)

// Connect to MongoDB
connectDB(); // Connect to MongoDB before loading event handlers

// Function to load event handlers
const loadEventHandlers = () => {
    console.log('\x1b[36m[ WELCOME ]\x1b[0m', '\x1b[32mWelcome System Active ✅\x1b[0m');
    const guildMemberAddHandler = require('./events/guildMemberAdd');
    guildMemberAddHandler(client); // Pass client to event handler

    console.log('\x1b[36m[ TICKET ]\x1b[0m', '\x1b[32mTicket System Active ✅\x1b[0m');
    const ticketHandler = require('./events/ticketHandler');
    ticketHandler(client);

    console.log('\x1b[36m[ VOICE CHANNEL ]\x1b[0m', '\x1b[32mVoice Channel System Active ✅\x1b[0m');
    const voiceChannelHandler = require('./events/voiceChannelHandler');
    voiceChannelHandler(client);

    console.log('\x1b[36m[ GIVEAWAY ]\x1b[0m', '\x1b[32mGiveaway System Active ✅\x1b[0m');
    const giveawayHandler = require('./events/giveaway');
    giveawayHandler(client);

    console.log('\x1b[36m[ AUTOROLE ]\x1b[0m', '\x1b[32mAutorole System Active ✅\x1b[0m');
    const autoroleHandler = require('./events/autorole');
    autoroleHandler(client);

    console.log('\x1b[36m[ REACTION ROLES ]\x1b[0m', '\x1b[32mReaction Roles System Active ✅\x1b[0m');
    const reactionRoleHandler = require('./events/reactionroles');
    reactionRoleHandler(client);

    console.log('\x1b[36m[ NQN Module ]\x1b[0m', '\x1b[32mEmoji System Active ✅\x1b[0m');
    const nqnHandler = require('./events/nqn');
    nqnHandler(client);

    const emojiHandler = require('./events/emojiHandler');
    emojiHandler(client);

    require('./events/music')(client);
};

// Load event handlers after connecting to MongoDB
loadEventHandlers();
