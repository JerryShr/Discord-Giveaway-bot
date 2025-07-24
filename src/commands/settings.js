const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

// 設置文件路徑
const settingsFilePath = path.join(__dirname, '../../data/settings.json');

// 確保設置文件存在
function ensureSettingsFile() {
    if (!fs.existsSync(path.dirname(settingsFilePath))) {
        fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
    }
    
    if (!fs.existsSync(settingsFilePath)) {
        const defaultSettings = {};
        fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    }
    
    return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
}

// 獲取伺服器設置
function getGuildSettings(guildId) {
    const settings = ensureSettingsFile();
    if (!settings[guildId]) {
        settings[guildId] = {
            embedColor: config.defaultEmbedColor || '#FF0000',
            reaction: config.defaultReaction || '🎉'
        };
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    }
    return settings[guildId];
}

// 更新伺服器設置
function updateGuildSettings(guildId, newSettings) {
    const settings = ensureSettingsFile();
    settings[guildId] = { ...getGuildSettings(guildId), ...newSettings };
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    return settings[guildId];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gsettings')
        .setDescription('管理GiveawayBot的設置')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('顯示當前設置'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('設置抽獎的嵌入顏色或表情符號')
                .addStringOption(option =>
                    option
                        .setName('option')
                        .setDescription('要設置的選項')
                        .setRequired(true)
                        .addChoices(
                            { name: '顏色', value: 'color' },
                            { name: '表情符號', value: 'emoji' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setDescription('選項的值')
                        .setRequired(true))),
    
    async execute(interaction, client) {
        // 檢查是否有管理員權限
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: '您需要管理員權限才能管理設置。', ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'show') {
            // 顯示當前設置
            const settings = getGuildSettings(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setTitle('🔧 GiveawayBot 設置')
                .setColor(settings.embedColor)
                .addFields(
                    { name: '嵌入顏色', value: settings.embedColor },
                    { name: '抽獎表情符號', value: settings.reaction }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'set') {
            const option = interaction.options.getString('option');
            const value = interaction.options.getString('value');
            
            if (option === 'color') {
                // 驗證顏色格式
                const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if (!hexColorRegex.test(value)) {
                    return interaction.reply({ content: '無效的顏色格式。請使用十六進制格式，例如: #FF0000', ephemeral: true });
                }
                
                // 更新顏色設置
                const settings = updateGuildSettings(interaction.guild.id, { embedColor: value });
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ 設置已更新')
                    .setColor(settings.embedColor)
                    .setDescription(`嵌入顏色已設置為: ${value}`)
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } else if (option === 'emoji') {
                // 更新表情符號設置
                const settings = updateGuildSettings(interaction.guild.id, { reaction: value });
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ 設置已更新')
                    .setColor(settings.embedColor)
                    .setDescription(`抽獎表情符號已設置為: ${value}`)
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            }
        }
    }
};
