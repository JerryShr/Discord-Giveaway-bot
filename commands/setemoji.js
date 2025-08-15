const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setemoji')
    .setDescription('設置抽獎按鈕所使用的表情符號')
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('表情符號（例如：🎉, 🎁, 🎊）')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    const emoji = interaction.options.getString('emoji');
    
    // 驗證表情符號
    // 簡單檢查：表情符號通常是1-2個字符
    if (emoji.length > 2 && !emoji.startsWith('<') && !emoji.endsWith('>')) {
      return await interaction.reply({
        content: '請提供有效的表情符號（例如：🎉, 🎁, 🎊）',
        ephemeral: true
      });
    }
    
    try {
      // 讀取配置文件
      const configPath = path.join(__dirname, '..', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 更新表情符號
      config.emoji = emoji;
      
      // 寫入配置文件
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      
      // 創建嵌入
      const embed = new EmbedBuilder()
        .setTitle('😄 表情符號已更新')
        .setDescription(`抽獎按鈕所使用的表情符號已更新為 ${emoji}`)
        .setColor(config.embedColor)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('更新表情符號時出錯:', error);
      await interaction.reply({
        content: '更新表情符號時發生錯誤。',
        ephemeral: true
      });
    }
  },
};
