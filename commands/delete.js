const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('刪除指定的抽獎而不抽出中獎者')
    .addStringOption(option => 
      option.setName('message_id')
        .setDescription('抽獎消息的ID')
        .setRequired(true)),
  
  async execute(interaction, client, db) {
    await interaction.deferReply({ ephemeral: true });
    
    const messageId = interaction.options.getString('message_id');
    
    // 查找抽獎
    const giveaways = await db.get('giveaways') || {};
    let targetGiveaway = null;
    let giveawayId = null;
    
    for (const [id, giveaway] of Object.entries(giveaways)) {
      if (giveaway.messageId === messageId) {
        targetGiveaway = giveaway;
        giveawayId = id;
        break;
      }
    }
    
    if (!targetGiveaway) {
      return await interaction.editReply('找不到指定ID的抽獎消息。');
    }
    
    // 檢查權限
    if (targetGiveaway.hostId !== interaction.user.id && !interaction.memberPermissions.has('MANAGE_GUILD')) {
      return await interaction.editReply('你沒有權限刪除這個抽獎。');
    }
    
    try {
      // 獲取抽獎消息
      const guild = await client.guilds.fetch(targetGiveaway.guildId);
      const channel = await guild.channels.fetch(targetGiveaway.channelId);
      const message = await channel.messages.fetch(targetGiveaway.messageId);
      
      // 更新嵌入
      const embed = EmbedBuilder.from(message.embeds[0])
        .setDescription(`**獎品**: ${targetGiveaway.prize}\n${targetGiveaway.description ? `**描述**: ${targetGiveaway.description}\n` : ''}**參與人數**: ${targetGiveaway.participants.length}\n\n**抽獎已被取消**`)
        .setColor('#e74c3c');
      
      // 更新按鈕
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway-enter-${giveawayId}`)
            .setLabel('抽獎已取消')
            .setEmoji(config.emoji)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      
      // 更新消息
      await message.edit({ embeds: [embed], components: [row] });
      
      // 從數據庫中刪除抽獎
      await db.delete(`giveaways.${giveawayId}`);
      
      await interaction.editReply('抽獎已成功刪除！');
    } catch (error) {
      console.error('刪除抽獎時出錯:', error);
      await interaction.editReply('刪除抽獎時發生錯誤。');
    }
  },
};
