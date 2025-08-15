const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const ms = require('ms');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('創建一個新的抽獎（交互式設置）'),
  
  async execute(interaction, client, db) {
    // 創建模態對話框
    const modal = new ModalBuilder()
      .setCustomId('giveaway-create-modal')
      .setTitle('創建抽獎');
    
    // 添加獎品輸入
    const prizeInput = new TextInputBuilder()
      .setCustomId('prize')
      .setLabel('獎品是什麼？')
      .setPlaceholder('例如：Nitro, Steam遊戲, 等等...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    // 添加持續時間輸入
    const durationInput = new TextInputBuilder()
      .setCustomId('duration')
      .setLabel('抽獎持續多久？')
      .setPlaceholder('例如：1m, 1h, 1d (m=分鐘, h=小時, d=天)')
      .setStyle(TextInputStyle.Short)
      .setValue(config.defaultDuration)
      .setRequired(true);
    
    // 添加獲獎者數量輸入
    const winnersInput = new TextInputBuilder()
      .setCustomId('winners')
      .setLabel('獲獎者數量')
      .setPlaceholder('輸入一個數字')
      .setStyle(TextInputStyle.Short)
      .setValue(config.defaultWinners.toString())
      .setRequired(true);
    
    // 添加描述輸入
    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('抽獎描述（可選）')
      .setPlaceholder('輸入抽獎的額外描述...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);
    
    // 創建動作行
    const prizeRow = new ActionRowBuilder().addComponents(prizeInput);
    const durationRow = new ActionRowBuilder().addComponents(durationInput);
    const winnersRow = new ActionRowBuilder().addComponents(winnersInput);
    const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
    
    // 將動作行添加到模態對話框
    modal.addComponents(prizeRow, durationRow, winnersRow, descriptionRow);
    
    // 顯示模態對話框
    await interaction.showModal(modal);
    
    // 等待模態提交
    const filter = i => i.customId === 'giveaway-create-modal' && i.user.id === interaction.user.id;
    
    try {
      const modalSubmission = await interaction.awaitModalSubmit({ filter, time: 300000 }); // 5分鐘超時
      
      // 獲取輸入值
      const prize = modalSubmission.fields.getTextInputValue('prize');
      const durationStr = modalSubmission.fields.getTextInputValue('duration');
      const winnersStr = modalSubmission.fields.getTextInputValue('winners');
      const description = modalSubmission.fields.getTextInputValue('description') || '';
      
      // 驗證持續時間
      let duration;
      try {
        duration = ms(durationStr);
        if (!duration) throw new Error('無效的持續時間');
      } catch (error) {
        return await modalSubmission.reply({ content: '請提供有效的持續時間格式（例如：1m, 1h, 1d）', ephemeral: true });
      }
      
      // 驗證獲獎者數量
      const winners = parseInt(winnersStr);
      if (isNaN(winners) || winners < 1) {
        return await modalSubmission.reply({ content: '獲獎者數量必須是大於0的數字', ephemeral: true });
      }
      
      // 計算結束時間
      const endTime = Date.now() + duration;
      
      // 創建抽獎ID
      const giveawayId = uuidv4();
      
      // 創建嵌入
      const embed = new EmbedBuilder()
        .setTitle('🎉 抽獎')
        .setDescription(`**獎品**: ${prize}\n${description ? `**描述**: ${description}\n` : ''}**結束時間**: <t:${Math.floor(endTime / 1000)}:R>\n**獲獎者數量**: ${winners}\n**主辦人**: <@${interaction.user.id}>`)
        .setColor(config.embedColor)
        .setTimestamp();
      
      // 創建按鈕
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway-enter-${giveawayId}`)
            .setLabel('參與抽獎')
            .setEmoji(config.emoji)
            .setStyle(ButtonStyle.Primary)
        );
      
      // 發送抽獎消息
      const response = await modalSubmission.reply({ embeds: [embed], components: [row], fetchReply: false });
      const message = await modalSubmission.fetchReply();
      
      // 保存抽獎數據
      const giveawayData = {
        id: giveawayId,
        prize,
        description,
        endTime,
        winnerCount: winners,
        hostId: interaction.user.id,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        messageId: message.id,
        participants: [],
        ended: false,
        winners: []
      };
      
      // 將抽獎數據保存到數據庫
      await db.set(`giveaways.${giveawayId}`, giveawayData);
      
      console.log(`創建了新的抽獎 ID: ${giveawayId}`);
    } catch (error) {
      if (error.code === 'InteractionCollectorError') {
        console.log('模態對話框超時');
      } else {
        console.error('創建抽獎時出錯:', error);
      }
    }
  },
};
