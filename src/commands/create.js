const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createGiveaway } = require('../utils/giveawayManager');
const { parseTime, isValidTimeFormat } = require('../utils/timeUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gcreate')
        .setDescription('創建贈品。(交互式設置)'),
    
    async execute(interaction, client) {
        // 創建一個模態對話框
        const modal = new ModalBuilder()
            .setCustomId('giveaway-create-modal')
            .setTitle('創建抽獎活動');
        
        // 添加持續時間輸入
        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('持續時間 (例如: 1h, 30m, 2d)')
            .setPlaceholder('輸入持續時間，例如: 1h')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        // 添加獲獎人數輸入
        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('獲獎人數')
            .setPlaceholder('輸入獲獎人數，例如: 3')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        // 添加獎品輸入
        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('獎品')
            .setPlaceholder('輸入獎品名稱，例如: 卡蘭德的魔鏡*1')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        // 創建動作行
        const durationRow = new ActionRowBuilder().addComponents(durationInput);
        const winnersRow = new ActionRowBuilder().addComponents(winnersInput);
        const prizeRow = new ActionRowBuilder().addComponents(prizeInput);
        
        // 添加動作行到模態對話框
        modal.addComponents(durationRow, winnersRow, prizeRow);
        
        // 顯示模態對話框
        await interaction.showModal(modal);
        
        // 等待模態對話框提交
        try {
            const filter = i => i.customId === 'giveaway-create-modal' && i.user.id === interaction.user.id;
            const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 60000 });
            
            // 獲取輸入值
            const duration = modalSubmit.fields.getTextInputValue('duration');
            const winnersCount = modalSubmit.fields.getTextInputValue('winners');
            const prize = modalSubmit.fields.getTextInputValue('prize');
            
            // 驗證持續時間格式
            if (!isValidTimeFormat(duration)) {
                return modalSubmit.reply({ content: '無效的持續時間格式。請使用數字後跟S/M/H/D，例如: 1h, 30m, 2d', ephemeral: true });
            }
            
            // 驗證獲獎人數
            const winnerCount = parseInt(winnersCount);
            if (isNaN(winnerCount) || winnerCount <= 0) {
                return modalSubmit.reply({ content: '獲獎人數必須是大於0的數字。', ephemeral: true });
            }
            
            // 驗證獎品
            if (!prize || prize.trim() === '') {
                return modalSubmit.reply({ content: '獎品名稱不能為空。', ephemeral: true });
            }
            
            // 延遲回覆，表示正在處理
            await modalSubmit.deferReply();
            
            // 創建抽獎
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
                const giveaway = await createGiveaway(options, modalSubmit);
                
                await modalSubmit.followUp({ content: `抽獎活動已創建！獎品: ${prize}, 獲獎人數: ${winnerCount}, 持續時間: ${duration}`, ephemeral: true });
            } catch (error) {
                console.error('創建抽獎時出錯:', error);
                await modalSubmit.followUp({ content: `創建抽獎時出錯: ${error.message}`, ephemeral: true });
            }
        } catch (error) {
            console.error('等待模態對話框提交時出錯:', error);
            // 如果是超時錯誤，不需要回覆，因為互動可能已經過期
            if (error.code !== 'INTERACTION_COLLECTOR_ERROR') {
                await interaction.followUp({ content: '創建抽獎時出錯，請稍後再試。', ephemeral: true });
            }
        }
    }
};
