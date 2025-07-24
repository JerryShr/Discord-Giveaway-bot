const { SlashCommandBuilder } = require('discord.js');
const { endGiveaway } = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gend')
        .setDescription('結束指定的抽獎並立即抽出中獎者')
        .addStringOption(option => 
            option.setName('giveaway_id')
                .setDescription('抽獎ID（消息ID）')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // 獲取抽獎ID
        const giveawayId = interaction.options.getString('giveaway_id');
        
        // 延遲回覆，表示正在處理
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // 結束抽獎
            const giveaway = await endGiveaway(giveawayId, client);
            
            // 檢查是否有獲獎者
            if (giveaway.winners && giveaway.winners.length > 0) {
                const winnerCount = giveaway.winners.length;
                await interaction.followUp({ content: `抽獎已結束，已抽出 ${winnerCount} 位獲獎者！`, ephemeral: true });
            } else {
                await interaction.followUp({ content: '抽獎已結束，但沒有足夠的參與者來抽取獲獎者。', ephemeral: true });
            }
        } catch (error) {
            console.error('結束抽獎時出錯:', error);
            
            // 處理常見錯誤
            if (error.message.includes('找不到抽獎活動')) {
                await interaction.followUp({ content: '找不到指定的抽獎活動。請確保您提供了正確的抽獎ID。', ephemeral: true });
            } else {
                await interaction.followUp({ content: `結束抽獎時出錯: ${error.message}`, ephemeral: true });
            }
        }
    }
};
