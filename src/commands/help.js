const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ghelp')
        .setDescription('顯示可用的指令'),
    
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 GiveawayBot 幫助')
            .setColor('#FF0000')
            .setDescription('以下是所有可用的指令：')
            .addFields(
                { name: '/ghelp', value: '顯示可用的指令。' },
                { name: '/gabout', value: '顯示有關機器人的信息。' },
                { name: '/gping', value: '檢查機器人是否在線。' },
                { name: '/ginvite', value: '顯示將機器人添加到伺服器的邀請連結。' },
                { name: '/gcreate', value: '創建贈品。(交互式設置)' },
                { name: '/gstart <duration> <winners> <prize>', value: '依序輸入<截止時間><中獎人數><獎品名稱>開始抽獎。' },
                { name: '/gend <giveaway_id>', value: '結束指定的抽獎並立即抽出中獎者。' },
                { name: '/gdelete <giveaway_id>', value: '刪除指定的抽獎而不抽出中獎者。' },
                { name: '/glist', value: '列出伺服器上所有當前運行的抽獎。' },
                { name: '/greroll <giveaway_id>', value: '從指定的抽獎中重新抽出一個新的中獎者。' },
                { name: '/gsettings show', value: '顯示 GiveawayBot 的當前設置。' },
                { name: '/gsettings set color <hex>', value: '設置抽獎的嵌入顏色。' },
                { name: '/gsettings set emoji <emoji>', value: '設置抽獎按鈕所使用的表情符號。' }
            )
            .setFooter({ text: 'GiveawayBot', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
