const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('顯示所有可用的指令'),
  
  async execute(interaction, client) {
    const commands = client.commands;
    
    const embed = new EmbedBuilder()
      .setTitle('📚 抽獎機器人指令列表')
      .setColor('#3498db')
      .setDescription('以下是所有可用的指令：')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.user.tag} 請求`, iconURL: interaction.user.displayAvatarURL() });
    
    commands.forEach(cmd => {
      embed.addFields({ name: `/${cmd.data.name}`, value: cmd.data.description });
    });
    
    await interaction.reply({ embeds: [embed] });
  },
};
