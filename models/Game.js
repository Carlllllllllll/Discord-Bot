const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    players: [String],
    state: String,
    currentPlayer: String,
});

module.exports = mongoose.model('Game', gameSchema);
