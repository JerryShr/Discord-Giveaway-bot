const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ginvite')
        .setDescription('顯示將機器人添加到伺服器的邀請連結'),
    
    async execute(interaction, client) {
        // 創建邀請連結
        const clientId = config.clientId || client.user.id;
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
        
        // 創建嵌入消息
        const embed = new EmbedBuilder()
            .setTitle('🔗 邀請 GiveawayBot')
            .setColor('#FF0000')
            .setDescription('點擊下方按鈕將 GiveawayBot 添加到您的伺服器！')
            .addFields(
                { name: '需要的權限', value: '• 發送消息\n• 嵌入鏈接\n• 添加反應\n• 使用外部表情符號\n• 管理消息（用於刪除抽獎）' },
                { name: '支持', value: '如果您有任何問題或需要幫助，請加入我們的支持伺服器。' }
            )
            .setFooter({ text: 'GiveawayBot', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // 創建邀請按鈕
        const inviteButton = new ButtonBuilder()
            .setLabel('邀請機器人')
            .setURL(inviteLink)
            .setStyle(ButtonStyle.Link);
        
        // 創建支持伺服器按鈕
        const supportButton = new ButtonBuilder()
            .setLabel('支持伺服器')
            .setURL('https://discord.gg/qk37pgfDMY')
            .setStyle(ButtonStyle.Link);
        
        // 創建動作行
        const row = new ActionRowBuilder().addComponents(inviteButton, supportButton);
        
        // 發送回覆
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
