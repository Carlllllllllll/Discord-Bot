const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const embeds = [
    new EmbedBuilder()
        .setAuthor({
            name: "Beezo Bot",
            iconURL: "https://cdn.discordapp.com/attachments/1230824451990622299/1253655046835408917/2366-discord-developers.gif?ex=6676a4be&is=6675533e&hm=0b39917ea5a274d222a001017886e3b43725191f671b34efe5349f82be57968c&"
        })
        .setTitle('Bot Info')
        .setDescription('This bot offers a comprehensive suite of commands designed to enhance your Discord server experience. It seamlessly integrates both prefix and slash commands \n\n **Bot Developer : GlaceYT** \n **Version : 2.0.0** \n **Node Version: v20.12.2** \n **Discord.js Version: 14.15.3** \n\n\n **Features:** \n - Moderation tools for managing your server \n - Fun commands to entertain your members \n - Multiple music systems for listening to music \n - Utility commands for various practical tasks \n - Meme Commands')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Anime",
            iconURL: "https://c.tenor.com/UUkvJV2JA_AAAAAM/chainsaw-man-kobeni.gif"
        })
        .setTitle('Anime Commands')
        .setDescription('Type: Commands \n Total Commands: 20 \n Commands: \n **blush, bonk, bored, bully, cry, cuddle, dance, highfive, hug, kiss, nervous, pat, sad, scream, slap, stare, thinking, wave, wink, yes** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Music",
            iconURL: "https://th.bing.com/th/id/R.e2afa3dcc7557f14715ceece1ae9a026?rik=tP3YcCvEzca%2bVw&pid=ImgRaw&r=0"
        })
        .setTitle('Music Commands')
        .setDescription('Type: Commands / Prefix \n Total Commands: 10 \n Commands: \n **autoplay, loop, nowplaying, pause, play, queue, resume, seek, skip, stop** \n\n Prefix Command: ! \n Total Commands: 10 \n Commands: \n **mnp, mpause, mplay, mqueue, mremove, mresume, mshuffle, mskip, mstop, mvolume** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Basic",
            iconURL: "https://th.bing.com/th/id/R.ddd4c51a719eb9a9da52a9c8612ccbbb?rik=HdheShCAUkEV3Q&pid=ImgRaw&r=0"
        })
        .setTitle('Basic Commands')
        .setDescription('Type: Command \n Total Commands: 10 \n Commands: \n **avatar, channelinfo, help, invite, ping, register, servericon, serverinfo, support, userinfo** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Fun",
            iconURL: "https://th.bing.com/th/id/OIP.3bLuZY9mlw8Kp_i2iO_Q4QHaHa?w=1024&h=1024&rs=1&pid=ImgDetMain"
        })
        .setTitle('Fun Commands')
        .setDescription('Type: Command \n Total Commands: 10 \n Commands: \n **choose, fact, flip, joke, meme, quote, randomnum, rate, rockpaperscissors, roll** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Moderation",
            iconURL: "https://cdn.discordapp.com/attachments/1230824451990622299/1255164064192270418/2861-tool.gif?ex=66a3af20&is=66a25da0&hm=aaa1e109ac0e6925ecb65803375a44bf5688e31cfc90c43dde53bdc4e317a7f5&"
        })
        .setTitle('Moderation Commands')
        .setDescription('Type: Commands \n Total Commands: 15 \n Commands: \n **addrole, ban, dm, kick, lockchannel, mute, setnickname, purge, removerole, removeslowmode, setslowmode, timeout, unlockchannel, unmute, warn** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Utility",
            iconURL: "https://cdn.discordapp.com/attachments/1230824451990622299/1252165467842416680/1667-yellow-gears.gif?ex=66a35277&is=66a200f7&hm=ab3527f27b44206ca3a426f9bb40b7ee0ec666e3b9d30348c10ddb173f761f8d&"
        })
        .setTitle('Utility Commands')
        .setDescription('Type: Commands / Prefix \n Total Commands: 13 \n Commands: \n **addreactionrole, antisetup, autorole, close-ticket, define, dictionary, giveaway, poll, generateqr, remind, status, timer, translate** \n Prefix: ! \n Total Commands: 5 \n Commands: \n **binary, button, emoji, password, worldclock** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setAuthor({
            name: "Other",
            iconURL: "https://th.bing.com/th/id/R.690462d4455063585b8501e92a3dae9b?rik=N1qEroT8tljsGg&pid=ImgRaw&r=0"
        })
        .setTitle('Other Commands')
        .setDescription('Type: Prefix \n Total Commands: 6 \n Prefix: ! \n Commands: \n **christmas, diwali, dussehra, holi, ramadan, rpc** ')
        .setColor('#87CEEB'),
    new EmbedBuilder()
        .setTitle('Troll Commands')
        .setAuthor({
            name: "Troll",
            iconURL: "https://prod.cloud.rockstargames.com/crews/sc/5253/9055445/publish/emblem/emblem_128.png"
        })
        .setDescription('Type: Prefix \n Total Commands: 5 \n Prefix: ! \n Commands: \n **assassinate, hack, howgay, roast, say** ')
        .setColor('#87CEEB')
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of commands'),
    async execute(interaction) {
        try {
            let currentPage = 0;

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('embed_select')
                .setPlaceholder('Select an embed')
                .addOptions(
                    embeds.map((embed, index) => ({
                        label: embed.data.title || `Page ${index + 1}`,
                        value: index.toString()
                    }))
                );

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === embeds.length - 1)
            );

            const message = await interaction.reply({
                content: 'Please select an option from the menu below:',
                embeds: [embeds[currentPage]],
                components: [row1, row2],
                fetchReply: true
            });

            setTimeout(() => {
                message.delete().catch(err => console.error('Failed to delete message:', err));
            }, 5 * 60 * 1000); // 5 minutes in milliseconds

            const filter = i => i.user.id === interaction.user.id && i.isStringSelectMenu();

            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'embed_select') {
                    const selectedIndex = parseInt(i.values[0], 10);
                    currentPage = selectedIndex;
                    await i.update({
                        content: ' ',
                        embeds: [embeds[currentPage]],
                        components: [row1, row2]
                    });
                } else if (i.customId === 'next') {
                    if (currentPage < embeds.length - 1) {
                        currentPage++;
                        await i.update({
                            content: ' ',
                            embeds: [embeds[currentPage]],
                            components: [row1, row2]
                        });
                    }
                } else if (i.customId === 'previous') {
                    if (currentPage > 0) {
                        currentPage--;
                        await i.update({
                            content: ' ',
                            embeds: [embeds[currentPage]],
                            components: [row1, row2]
                        });
                    }
                }

                row2.components[0].setDisabled(currentPage === 0); // Previous button
                row2.components[1].setDisabled(currentPage === embeds.length - 1); // Next button

                await i.update({
                    content: ' ',
                    embeds: [embeds[currentPage]],
                    components: [row1, row2]
                });
            });

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} interactions.`);
            });

        } catch (error) {
            console.error('Error handling select menu and buttons:', error);
            await interaction.reply('Something went wrong while processing your request. Please try again later.');
        }
    },
};
