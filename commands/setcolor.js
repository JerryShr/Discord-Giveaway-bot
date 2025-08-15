const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcolor')
    .setDescription('設置抽獎的嵌入顏色')
    .addStringOption(option => 
      option.setName('color')
        .setDescription('顏色代碼（例如：#FF5733）')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    const color = interaction.options.getString('color');
    
    // 驗證顏色格式
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      return await interaction.reply({
        content: '請提供有效的顏色代碼（例如：#FF5733）',
        ephemeral: true
      });
    }
    
    try {
      // 讀取配置文件
      const configPath = path.join(__dirname, '..', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 更新顏色
      config.embedColor = color;
      
      // 寫入配置文件
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      
      // 創建嵌入
      const embed = new EmbedBuilder()
        .setTitle('🎨 顏色已更新')
        .setDescription(`抽獎的嵌入顏色已更新為 ${color}`)
        .setColor(color)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('更新顏色時出錯:', error);
      await interaction.reply({
        content: '更新顏色時發生錯誤。',
        ephemeral: true
      });
    }
  },
};
