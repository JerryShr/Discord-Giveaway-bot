const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('從指定的抽獎中重新抽出一個新的中獎者')
    .addStringOption(option => 
      option.setName('message_id')
        .setDescription('抽獎消息的ID')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('count')
        .setDescription('要重新抽取的獲獎者數量')
        .setMinValue(1)
        .setRequired(false)),
  
  async execute(interaction, client, db) {
    await interaction.deferReply();
    
    const messageId = interaction.options.getString('message_id');
    const count = interaction.options.getInteger('count') || 1;
    
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
    
    if (!targetGiveaway.ended) {
      return await interaction.editReply('這個抽獎還沒有結束，無法重新抽取獲獎者。');
    }
    
    // 檢查權限
    if (targetGiveaway.hostId !== interaction.user.id && !interaction.memberPermissions.has('MANAGE_GUILD')) {
      return await interaction.editReply('你沒有權限重新抽取這個抽獎的獲獎者。');
    }
    
    // 檢查參與者
    if (targetGiveaway.participants.length === 0) {
      return await interaction.editReply('這個抽獎沒有參與者，無法重新抽取獲獎者。');
    }
    
    try {
      // 重新抽取獲獎者
      const newWinners = [];
      const participants = [...targetGiveaway.participants];
      
      // 如果之前有獲獎者，從參與者列表中移除他們
      if (targetGiveaway.winners && targetGiveaway.winners.length > 0) {
        for (const winner of targetGiveaway.winners) {
          const index = participants.indexOf(winner);
          if (index !== -1) {
            participants.splice(index, 1);
          }
        }
      }
      
      // 檢查是否還有足夠的參與者
      if (participants.length === 0) {
        return await interaction.editReply('沒有更多的參與者可以抽取了。');
      }
      
      // 抽取新的獲獎者
      for (let i = 0; i < Math.min(count, participants.length); i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        newWinners.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
      }
      
      // 獲取頻道
      const guild = await client.guilds.fetch(targetGiveaway.guildId);
      const channel = await guild.channels.fetch(targetGiveaway.channelId);
      
      // 創建獲獎者列表
      const winnerText = newWinners.map(id => `<@${id}>`).join(', ');
      
      // 發送獲獎通知
      await channel.send({
        content: `恭喜新的獲獎者 ${winnerText}! 你贏得了 **${targetGiveaway.prize}**!`,
        allowedMentions: { users: newWinners }
      });
      
      // 更新抽獎數據
      targetGiveaway.winners = [...(targetGiveaway.winners || []), ...newWinners];
      await db.set(`giveaways.${giveawayId}`, targetGiveaway);
      
      await interaction.editReply(`成功重新抽取了 ${newWinners.length} 名獲獎者！`);
    } catch (error) {
      console.error('重新抽取獲獎者時出錯:', error);
      await interaction.editReply('重新抽取獲獎者時發生錯誤。');
    }
  },
};
