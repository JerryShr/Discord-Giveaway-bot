const { SlashCommandBuilder } = require('discord.js');
const { deleteGiveaway } = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gdelete')
        .setDescription('刪除指定的抽獎而不抽出中獎者')
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
            // 刪除抽獎
            await deleteGiveaway(giveawayId, client);
            
            await interaction.followUp({ content: '抽獎活動已成功刪除！', ephemeral: true });
        } catch (error) {
            console.error('刪除抽獎時出錯:', error);
            
            // 處理常見錯誤
            if (error.message.includes('找不到抽獎活動')) {
                await interaction.followUp({ content: '找不到指定的抽獎活動。請確保您提供了正確的抽獎ID。', ephemeral: true });
            } else {
                await interaction.followUp({ content: `刪除抽獎時出錯: ${error.message}`, ephemeral: true });
            }
        }
    }
};
