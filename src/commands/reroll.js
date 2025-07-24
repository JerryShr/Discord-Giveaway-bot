const { SlashCommandBuilder } = require('discord.js');
const { rerollGiveaway } = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greroll')
        .setDescription('從指定的抽獎中重新抽出一個新的中獎者')
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
            // 重新抽取獲獎者
            const winners = await rerollGiveaway(giveawayId, client);
            
            // 檢查是否有獲獎者
            if (winners && winners.length > 0) {
                const winnerCount = winners.length;
                await interaction.followUp({ content: `已重新抽出 ${winnerCount} 位獲獎者！`, ephemeral: true });
            } else {
                await interaction.followUp({ content: '重新抽獎失敗，沒有足夠的參與者來抽取獲獎者。', ephemeral: true });
            }
        } catch (error) {
            console.error('重新抽取獲獎者時出錯:', error);
            
            // 處理常見錯誤
            if (error.message.includes('找不到抽獎活動')) {
                await interaction.followUp({ content: '找不到指定的抽獎活動。請確保您提供了正確的抽獎ID。', ephemeral: true });
            } else if (error.message.includes('尚未結束')) {
                await interaction.followUp({ content: '此抽獎活動尚未結束，無法重新抽取獲獎者。', ephemeral: true });
            } else {
                await interaction.followUp({ content: `重新抽取獲獎者時出錯: ${error.message}`, ephemeral: true });
            }
        }
    }
};
