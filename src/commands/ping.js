const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gping')
        .setDescription('檢查機器人是否在線'),
    
    async execute(interaction, client) {
        // 發送初始回覆
        const sent = await interaction.reply({ content: '正在計算延遲...', fetchReply: true });
        
        // 計算延遲
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        // 計算API延遲
        const apiLatency = Math.round(client.ws.ping);
        
        // 創建嵌入消息
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor('#FF0000')
            .addFields(
                { name: '機器人延遲', value: `${latency}ms`, inline: true },
                { name: 'API延遲', value: `${apiLatency}ms`, inline: true }
            )
            .setFooter({ text: 'GiveawayBot', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // 編輯回覆
        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
