const { SlashCommandBuilder, EmbedBuilder, version: discordJsVersion } = require('discord.js');
const { version } = require('../../package.json');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gabout')
        .setDescription('顯示有關機器人的信息'),
    
    async execute(interaction, client) {
        // 計算機器人正常運行時間
        const uptime = formatUptime(client.uptime);
        
        // 計算記憶體使用量
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        
        // 創建嵌入消息
        const embed = new EmbedBuilder()
            .setTitle('🤖 關於 GiveawayBot')
            .setColor('#FF0000')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '版本', value: `v${version}`, inline: true },
                { name: 'Discord.js', value: `v${discordJsVersion}`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: '正常運行時間', value: uptime, inline: true },
                { name: '記憶體使用量', value: `${memoryUsage.toFixed(2)} MB`, inline: true },
                { name: '伺服器數量', value: `${client.guilds.cache.size}`, inline: true },
                { name: '操作系統', value: `${os.platform()} ${os.release()}`, inline: true },
                { name: '處理器', value: os.cpus()[0].model, inline: true },
                { name: '開發者', value: 'October', inline: true }
            )
            .setDescription('GiveawayBot是一個功能豐富的Discord抽獎機器人，可以幫助您輕鬆創建和管理抽獎活動。')
            .setFooter({ text: `GiveawayBot • ${new Date().getFullYear()}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};

// 格式化正常運行時間
function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) parts.push(`${days} 天`);
    if (hours > 0) parts.push(`${hours} 小時`);
    if (minutes > 0) parts.push(`${minutes} 分鐘`);
    if (seconds > 0) parts.push(`${seconds} 秒`);
    
    return parts.join(' ');
}
