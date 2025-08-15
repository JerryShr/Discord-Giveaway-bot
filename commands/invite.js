const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('顯示將機器人添加到伺服器的邀請連結'),
  
  async execute(interaction, client) {
    const clientId = client.user.id;
    
    // 創建邀請連結
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    
    const embed = new EmbedBuilder()
      .setTitle('📨 邀請機器人')
      .setColor('#3498db')
      .setDescription('點擊下方按鈕將機器人添加到您的伺服器！')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.user.tag} 請求`, iconURL: interaction.user.displayAvatarURL() });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('邀請機器人')
          .setURL(inviteLink)
          .setStyle(ButtonStyle.Link)
      );
    
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
