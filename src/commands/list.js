const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('glist')
        .setDescription('列出伺服器上所有當前運行的抽獎'),
    
    async execute(interaction, client) {
        // 延遲回覆，表示正在處理
        await interaction.deferReply();
        
        try {
            // 獲取當前伺服器的所有未結束的抽獎
            const giveaways = await Giveaway.find({ 
                guildId: interaction.guild.id,
                ended: false
            });
            
            if (giveaways.length === 0) {
                return interaction.followUp('此伺服器目前沒有運行中的抽獎活動。');
            }
            
            // 創建嵌入消息
            const embed = new EmbedBuilder()
                .setTitle('🎉 運行中的抽獎活動')
                .setColor('#FF0000')
                .setDescription(`此伺服器有 ${giveaways.length} 個運行中的抽獎活動`)
                .setTimestamp();
            
            // 添加每個抽獎的信息
            for (const giveaway of giveaways) {
                const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
                const channelName = channel ? `<#${channel.id}>` : '未知頻道';
                
                embed.addFields({
                    name: `🎁 ${giveaway.prize}`,
                    value: `• 頻道: ${channelName}\n• 獲獎人數: ${giveaway.winnerCount}\n• 結束時間: <t:${Math.floor(new Date(giveaway.endAt).getTime() / 1000)}:R>\n• 抽獎ID: \`${giveaway.messageId}\``
                });
            }
            
            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            console.error('列出抽獎時出錯:', error);
            await interaction.followUp({ content: `列出抽獎時出錯: ${error.message}` });
        }
    }
};
