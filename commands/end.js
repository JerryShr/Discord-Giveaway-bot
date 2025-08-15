const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end')
    .setDescription('結束指定的抽獎並立即抽出中獎者')
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
    
    if (targetGiveaway.ended) {
      return await interaction.editReply('這個抽獎已經結束了。');
    }
    
    // 檢查權限
    if (targetGiveaway.hostId !== interaction.user.id && !interaction.memberPermissions.has('MANAGE_GUILD')) {
      return await interaction.editReply('你沒有權限結束這個抽獎。');
    }
    
    try {
      // 結束抽獎
      await endGiveaway(giveawayId, client, db);
      await interaction.editReply('抽獎已成功結束！');
    } catch (error) {
      console.error('結束抽獎時出錯:', error);
      await interaction.editReply('結束抽獎時發生錯誤。');
    }
  },
};

// 結束抽獎並選擇獲獎者
async function endGiveaway(giveawayId, client, db) {
  const giveaway = await db.get(`giveaways.${giveawayId}`);
  
  if (!giveaway || giveaway.ended) return;
  
  // 標記抽獎為已結束
  giveaway.ended = true;
  
  // 選擇獲獎者
  const winners = selectWinners(giveaway.participants, giveaway.winnerCount);
  giveaway.winners = winners;
  
  // 更新數據庫
  await db.set(`giveaways.${giveawayId}`, giveaway);
  
  // 獲取抽獎消息
  try {
    const guild = await client.guilds.fetch(giveaway.guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    
    // 創建獲獎者列表
    let winnerText = '沒有有效參與者';
    
    if (winners.length > 0) {
      winnerText = winners.map(id => `<@${id}>`).join(', ');
    }
    
    // 更新嵌入
    const embed = EmbedBuilder.from(message.embeds[0])
      .setDescription(`**獎品**: ${giveaway.prize}\n${giveaway.description ? `**描述**: ${giveaway.description}\n` : ''}**獲獎者**: ${winnerText}\n**參與人數**: ${giveaway.participants.length}\n\n**抽獎已結束**`)
      .setColor(config.embedColor);
    
    // 更新按鈕
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway-enter-${giveawayId}`)
          .setLabel(`已有 ${giveaway.participants.length} 人參與`)
          .setEmoji(config.emoji)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    
    // 更新消息
    await message.edit({ embeds: [embed], components: [row] });
    
    // 發送獲獎通知
    if (winners.length > 0) {
      await channel.send({
        content: `恭喜 ${winnerText}! 你贏得了 **${giveaway.prize}**!`,
        allowedMentions: { users: winners }
      });
    } else {
      await channel.send(`沒有人贏得 **${giveaway.prize}** 因為沒有有效參與者。`);
    }
  } catch (error) {
    console.error('更新抽獎消息時出錯:', error);
  }
}

// 選擇獲獎者
function selectWinners(participants, winnerCount) {
  if (participants.length === 0) return [];
  
  const winners = [];
  const participantsCopy = [...participants];
  
  for (let i = 0; i < Math.min(winnerCount, participants.length); i++) {
    const randomIndex = Math.floor(Math.random() * participantsCopy.length);
    winners.push(participantsCopy[randomIndex]);
    participantsCopy.splice(randomIndex, 1);
  }
  
  return winners;
}
