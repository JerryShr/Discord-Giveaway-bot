const { SlashCommandBuilder } = require('discord.js');
const { createGiveaway } = require('../utils/giveawayManager');
const { parseTime, isValidTimeFormat } = require('../utils/timeUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gstart')
        .setDescription('依序輸入<截止時間><中獎人數><獎品名稱>開始抽獎')
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('抽獎持續時間 (例如: 1h, 30m, 2d)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('winners')
                .setDescription('獲獎人數')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option => 
            option.setName('prize')
                .setDescription('獎品名稱')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // 獲取選項值
        const duration = interaction.options.getString('duration');
        const winnerCount = interaction.options.getInteger('winners');
        const prize = interaction.options.getString('prize');
        
        // 驗證持續時間格式
        if (!isValidTimeFormat(duration)) {
            return interaction.reply({ content: '無效的持續時間格式。請使用數字後跟S/M/H/D，例如: 1h, 30m, 2d', ephemeral: true });
        }
        
        // 延遲回覆，表示正在處理
        await interaction.deferReply();
        
        try {
            // 獲取頻道
            const channel = interaction.channel;
            
            // 創建抽獎選項
            const options = {
                channel: channel,
                duration: duration,
                winnerCount: winnerCount,
                prize: prize,
                embedColor: '#FF0000',
                reaction: '🎉'
            };
            
            // 創建抽獎
            const giveaway = await createGiveaway(options, interaction);
            
            await interaction.followUp({ content: `抽獎活動已開始！獎品: ${prize}, 獲獎人數: ${winnerCount}, 持續時間: ${duration}`, ephemeral: true });
        } catch (error) {
            console.error('開始抽獎時出錯:', error);
            await interaction.followUp({ content: `開始抽獎時出錯: ${error.message}`, ephemeral: true });
        }
    }
};
