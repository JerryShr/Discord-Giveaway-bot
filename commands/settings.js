const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('顯示機器人的當前設置'),
  
  async execute(interaction, client, db) {
    // 創建嵌入
    const embed = new EmbedBuilder()
      .setTitle('⚙️ 機器人設置')
      .setColor(config.embedColor)
      .setDescription('以下是機器人的當前設置：')
      .addFields(
        { name: '嵌入顏色', value: config.embedColor },
        { name: '表情符號', value: config.emoji },
        { name: '預設持續時間', value: config.defaultDuration },
        { name: '預設獲獎者數量', value: config.defaultWinners.toString() }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.user.tag} 請求`, iconURL: interaction.user.displayAvatarURL() });
    
    await interaction.reply({ embeds: [embed] });
  },
};
