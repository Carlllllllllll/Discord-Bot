const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../database/ticketdb');
const configPath = path.join(__dirname, '..', 'config.json');
const ticketIcons = require('../UI/icons/ticketicons');

let config = {};

function loadConfig() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(data);
    } catch (err) {
        console.error('Error reading or parsing config file:', err);
    }
}

loadConfig();
setInterval(loadConfig, 5000);

module.exports = (client) => {
    client.on('ready', async () => {
        monitorConfigChanges(client);
    });

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
            handleSelectMenu(interaction, client);
        } else if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
            handleCloseButton(interaction, client);
        }
    });
};

async function monitorConfigChanges(client) {
    let previousConfig = JSON.parse(JSON.stringify(config));

    setInterval(async () => {
        if (JSON.stringify(config) !== JSON.stringify(previousConfig)) {
            for (const guildId of Object.keys(config.tickets)) {
                const settings = config.tickets[guildId];
                const previousSettings = previousConfig.tickets[guildId];

                if (settings && settings.status && settings.ticketChannelId && (!previousSettings || settings.ticketChannelId !== previousSettings.ticketChannelId)) {
                    const guild = client.guilds.cache.get(guildId);
                    if (!guild) continue;

                    const ticketChannel = guild.channels.cache.get(settings.ticketChannelId);
                    if (!ticketChannel) continue;

                    db.get('SELECT embedSent, channelId FROM ticket_settings WHERE guildId = ?', [guildId], async (err, row) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        const embedSent = row ? row.embedSent : 0;
                        const savedChannelId = row ? row.channelId : null;

                        if (savedChannelId && savedChannelId !== settings.ticketChannelId) {
                            const oldChannel = guild.channels.cache.get(savedChannelId);
                            if (oldChannel) {
                                await oldChannel.messages.fetch({ limit: 100 }).then(messages => {
                                    messages.forEach(msg => {
                                        if (msg.embeds.length > 0 && msg.author.bot) {
                                            msg.delete().catch(console.error);
                                        }
                                    });
                                }).catch(console.error);
                            }
                        }

                        db.run('INSERT OR REPLACE INTO ticket_settings (guildId, embedSent, channelId) VALUES (?, ?, ?)', [guildId, 0, settings.ticketChannelId], (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        });

                        if (!embedSent || savedChannelId !== settings.ticketChannelId) {
                            const embed = new EmbedBuilder()
                                .setAuthor({
                                    name: "Welcome to Ticket Support",
                                    iconURL: ticketIcons.mainIcon,
                                    url: "https://discord.gg/xQF9f9yUEM"
                                })
                                .setDescription('- Please click below menu to create a new ticket.\n\n' +
                                    '**Ticket Guidelines:**\n' +
                                    '- Empty tickets are not permitted.\n' +
                                    '- Please be patient while waiting for a response from our support team.')
                                .setFooter({ text: 'We are here to Help!', iconURL: ticketIcons.modIcon })
                                .setColor('#00FF00')
                                .setTimestamp();

                            const menu = new StringSelectMenuBuilder()
                                .setCustomId('select_ticket_type')
                                .setPlaceholder('Choose ticket type')
                                .addOptions([
                                    { label: '🆘 Support', value: 'support' },
                                    { label: '📂 Suggestion', value: 'suggestion' },
                                    { label: '💜 Feedback', value: 'feedback' },
                                    { label: '⚠️ Report', value: 'report' }
                                ]);

                            const row = new ActionRowBuilder().addComponents(menu);

                            await ticketChannel.send({
                                embeds: [embed],
                                components: [row]
                            });

                            db.run('INSERT OR REPLACE INTO ticket_settings (guildId, embedSent, channelId) VALUES (?, ?, ?)', [guildId, 1, settings.ticketChannelId]);
                        }
                    });
                }
            }
            previousConfig = JSON.parse(JSON.stringify(config));
        }
    }, 5000);
}

async function handleSelectMenu(interaction, client) {
    await interaction.deferReply({ ephemeral: true }); 

    const { guild, user, values } = interaction;
    if (!guild || !user) return;

    const guildId = guild.id;
    const userId = user.id;
    const ticketType = values[0];
    const settings = config.tickets[guildId];
    if (!settings) return;

    db.get('SELECT * FROM tickets WHERE guildId = ? AND userId = ?', [guildId, userId], async (err, row) => {
        if (err) {
            console.error(err);
            return interaction.followUp({ content: 'An error occurred while creating your ticket.', ephemeral: true });
        }

        if (row) {
            return interaction.followUp({ content: 'You already have an open ticket.', ephemeral: true });
        }

        const ticketChannel = await guild.channels.create({
            name: `${user.username}-${ticketType}-ticket`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: userId,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
                ...settings.supportRoleIds.map(roleId => ({
                    id: roleId,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                }))
            ],
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Ticket Created',
                iconURL: ticketIcons.mainIcon
            })
            .setDescription(`Ticket type: **${ticketType}**\n\nPlease describe your issue in detail to receive the best support.`)
            .setFooter({ text: 'Support Team', iconURL: ticketIcons.modIcon })
            .setColor('#00FF00')
            .setTimestamp();

        const closeButton = new ButtonBuilder()
            .setCustomId(`close_ticket_${userId}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const closeRow = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({
            content: `Hello ${user}, thank you for reaching out to our support team. Our team will assist you shortly.`,
            embeds: [embed],
            components: [closeRow]
        });

        db.run('INSERT INTO tickets (guildId, userId, channelId, ticketType, status) VALUES (?, ?, ?, ?, ?)', [guildId, userId, ticketChannel.id, ticketType, 'open'], (err) => {
            if (err) {
                console.error(err);
                return interaction.followUp({ content: 'An error occurred while saving your ticket.', ephemeral: true });
            }
            interaction.followUp({ content: 'Your ticket has been created successfully.', ephemeral: true });
        });
    });
}

async function handleCloseButton(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const { guild, user, customId, channel } = interaction;
    if (!guild || !user || !channel) return;

    const ticketOwnerId = customId.split('_')[2];
    if (user.id !== ticketOwnerId) {
        return interaction.followUp({ content: 'Only the ticket owner can close the ticket.', ephemeral: true });
    }

    db.get('SELECT * FROM tickets WHERE guildId = ? AND channelId = ?', [guild.id, channel.id], async (err, row) => {
        if (err) {
            console.error(err);
            return interaction.followUp({ content: 'An error occurred while closing your ticket.', ephemeral: true });
        }

        if (!row) {
            return interaction.followUp({ content: 'No ticket found for this channel.', ephemeral: true });
        }

        await channel.delete();

        db.run('DELETE FROM tickets WHERE guildId = ? AND channelId = ?', [guild.id, channel.id], (err) => {
            if (err) {
                console.error(err);
                return interaction.followUp({ content: 'An error occurred while removing the ticket from the database.', ephemeral: true });
            }
            interaction.followUp({ content: 'Your ticket has been closed and the channel has been deleted.', ephemeral: true });
        });
    });
}
