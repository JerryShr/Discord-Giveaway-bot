const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const ms = require('ms');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quick')
    .setDescription('快速開始一個抽獎')
    .addStringOption(option => 
      option.setName('prize')
        .setDescription('抽獎的獎品')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('抽獎持續時間 (例如: 1m, 1h, 1d)')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('winners')
        .setDescription('獲獎者數量')
        .setMinValue(1)
        .setRequired(false))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('抽獎的額外描述')
        .setRequired(false)),
  
  async execute(interaction, client, db) {
    // 獲取選項值
    const prize = interaction.options.getString('prize');
    const durationStr = interaction.options.getString('duration') || config.defaultDuration;
    const winners = interaction.options.getInteger('winners') || config.defaultWinners;
    const description = interaction.options.getString('description') || '';
    
    // 驗證持續時間
    let duration;
    try {
      duration = ms(durationStr);
      if (!duration) throw new Error('無效的持續時間');
    } catch (error) {
      return await interaction.reply({ content: '請提供有效的持續時間格式（例如：1m, 1h, 1d）', ephemeral: true });
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
    await interaction.reply({ embeds: [embed], components: [row] });
    const message = await interaction.fetchReply();
    
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
    
    console.log(`快速創建了新的抽獎 ID: ${giveawayId}`);
  },
};
