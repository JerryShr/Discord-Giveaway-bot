const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('列出伺服器上所有當前運行的抽獎'),
  
  async execute(interaction, client, db) {
    await interaction.deferReply();
    
    // 獲取所有抽獎
    const giveaways = await db.get('giveaways') || {};
    
    // 過濾出當前伺服器的抽獎
    const serverGiveaways = Object.entries(giveaways).filter(([_, giveaway]) => 
      giveaway.guildId === interaction.guildId && !giveaway.ended
    );
    
    if (serverGiveaways.length === 0) {
      return await interaction.editReply('此伺服器上沒有正在進行的抽獎。');
    }
    
    // 創建嵌入
    const embed = new EmbedBuilder()
      .setTitle('🎉 正在進行的抽獎')
      .setColor('#3498db')
      .setDescription('以下是此伺服器上所有正在進行的抽獎：')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.user.tag} 請求`, iconURL: interaction.user.displayAvatarURL() });
    
    // 添加每個抽獎的信息
    for (const [id, giveaway] of serverGiveaways) {
      const timeLeft = giveaway.endTime - Date.now();
      const timeLeftStr = timeLeft > 0 ? `<t:${Math.floor(giveaway.endTime / 1000)}:R>` : '已結束';
      
      embed.addFields({
        name: `🎁 ${giveaway.prize}`,
        value: `**消息ID**: ${giveaway.messageId}\n**結束時間**: ${timeLeftStr}\n**獲獎者數量**: ${giveaway.winnerCount}\n**參與人數**: ${giveaway.participants.length}\n**頻道**: <#${giveaway.channelId}>`
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  },
};
