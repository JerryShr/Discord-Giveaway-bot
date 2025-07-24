const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const { parseTime } = require('./timeUtils');

/**
 * 創建新的抽獎活動
 * @param {Object} options 抽獎選項
 * @param {Object} interaction Discord交互對象
 * @returns {Promise<Object>} 創建的抽獎對象
 */
async function createGiveaway(options, interaction) {
    try {
        const { duration, winnerCount, prize, channel } = options;
        
        // 解析持續時間
        const ms = parseTime(duration);
        if (!ms) {
            throw new Error('無效的持續時間格式。請使用有效的格式，例如 1d, 2h, 30m, 10s');
        }
        
        // 計算結束時間
        const endAt = new Date(Date.now() + ms);
        
        // 創建嵌入消息
        const embed = new EmbedBuilder()
            .setTitle(`🎉 抽獎: ${prize}`)
            .setDescription(`由 <@${interaction.user.id}> 舉辦\n點擊下方按鈕參加!\n結束時間: <t:${Math.floor(endAt.getTime() / 1000)}:R>\n獎品: **${prize}**\n獲獎人數: **${winnerCount}**`)
            .setColor(options.embedColor || '#FF0000')
            .setTimestamp(endAt);
            
        if (options.embedImage) {
            embed.setImage(options.embedImage);
        }
        
        // 創建按鈕
        const button = new ButtonBuilder()
            .setCustomId('giveaway-join')
            .setLabel('參加抽獎')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(options.reaction || '🎉');
            
        const row = new ActionRowBuilder().addComponents(button);
        
        // 發送抽獎消息
        const message = await channel.send({
            embeds: [embed],
            components: [row]
        });
        
        // 創建抽獎數據
        const giveaway = new Giveaway({
            messageId: message.id,
            channelId: channel.id,
            guildId: interaction.guild.id,
            startAt: new Date(),
            endAt: endAt,
            winnerCount: winnerCount,
            prize: prize,
            hostedBy: interaction.user.id,
            embedColor: options.embedColor || '#FF0000',
            embedImage: options.embedImage || null,
            reaction: options.reaction || '🎉'
        });
        
        // 保存抽獎數據
        await giveaway.save();
        
        return giveaway;
    } catch (error) {
        console.error('創建抽獎時出錯:', error);
        throw error;
    }
}

/**
 * 結束抽獎並選擇獲獎者
 * @param {string} messageId 抽獎消息ID
 * @param {Object} client Discord客戶端
 * @returns {Promise<Object>} 結束的抽獎對象
 */
async function endGiveaway(messageId, client) {
    try {
        // 查找抽獎數據
        const giveaway = await Giveaway.findOne({ messageId: messageId });
        if (!giveaway) {
            throw new Error('找不到抽獎活動');
        }
        
        if (giveaway.ended) {
            throw new Error('此抽獎活動已結束');
        }
        
        // 標記為已結束
        giveaway.ended = true;
        
        // 選擇獲獎者
        const winners = selectWinners(giveaway);
        giveaway.winners = winners.map(winner => winner.id);
        
        // 保存更新
        await giveaway.save();
        
        // 獲取頻道和消息
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) {
            throw new Error('找不到抽獎頻道');
        }
        
        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!message) {
            throw new Error('找不到抽獎消息');
        }
        
        // 更新嵌入消息
        const embed = EmbedBuilder.from(message.embeds[0])
            .setDescription(`抽獎已結束!\n獎品: **${giveaway.prize}**\n獲獎人數: **${giveaway.winnerCount}**\n由 <@${giveaway.hostedBy}> 舉辦`);
        
        // 禁用按鈕
        const disabledButton = ButtonBuilder.from(message.components[0].components[0])
            .setDisabled(true)
            .setLabel('抽獎已結束');
            
        const row = new ActionRowBuilder().addComponents(disabledButton);
        
        // 更新消息
        await message.edit({
            embeds: [embed],
            components: [row]
        });
        
        // 發送獲獎者通知
        if (winners.length > 0) {
            const winnerMentions = winners.map(user => `<@${user.id}>`).join(', ');
            await channel.send({
                content: `恭喜 ${winnerMentions}! 你們贏得了 **${giveaway.prize}**!`,
                allowedMentions: { users: winners.map(user => user.id) }
            });
        } else {
            await channel.send(`沒有足夠的參與者來決定「${giveaway.prize}」的獲獎者!`);
        }
        
        return giveaway;
    } catch (error) {
        console.error('結束抽獎時出錯:', error);
        throw error;
    }
}

/**
 * 重新抽取獲獎者
 * @param {string} messageId 抽獎消息ID
 * @param {Object} client Discord客戶端
 * @returns {Promise<Array>} 新的獲獎者列表
 */
async function rerollGiveaway(messageId, client) {
    try {
        // 查找抽獎數據
        const giveaway = await Giveaway.findOne({ messageId: messageId });
        if (!giveaway) {
            throw new Error('找不到抽獎活動');
        }
        
        if (!giveaway.ended) {
            throw new Error('此抽獎活動尚未結束');
        }
        
        // 選擇新的獲獎者
        const winners = selectWinners(giveaway);
        giveaway.winners = winners.map(winner => winner.id);
        
        // 保存更新
        await giveaway.save();
        
        // 獲取頻道
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) {
            throw new Error('找不到抽獎頻道');
        }
        
        // 發送獲獎者通知
        if (winners.length > 0) {
            const winnerMentions = winners.map(user => `<@${user.id}>`).join(', ');
            await channel.send({
                content: `重新抽獎! 恭喜 ${winnerMentions}! 你們贏得了 **${giveaway.prize}**!`,
                allowedMentions: { users: winners.map(user => user.id) }
            });
        } else {
            await channel.send(`沒有足夠的參與者來重新決定「${giveaway.prize}」的獲獎者!`);
        }
        
        return winners;
    } catch (error) {
        console.error('重新抽取獲獎者時出錯:', error);
        throw error;
    }
}

/**
 * 刪除抽獎
 * @param {string} messageId 抽獎消息ID
 * @param {Object} client Discord客戶端
 * @returns {Promise<boolean>} 是否成功刪除
 */
async function deleteGiveaway(messageId, client) {
    try {
        // 查找抽獎數據
        const giveaway = await Giveaway.findOne({ messageId: messageId });
        if (!giveaway) {
            throw new Error('找不到抽獎活動');
        }
        
        // 獲取頻道和消息
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (channel) {
            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (message) {
                await message.delete().catch(() => {});
            }
        }
        
        // 從數據庫中刪除
        await Giveaway.deleteOne({ messageId: messageId });
        
        return true;
    } catch (error) {
        console.error('刪除抽獎時出錯:', error);
        throw error;
    }
}

/**
 * 定期檢查抽獎是否結束
 * @param {Object} client Discord客戶端
 */
async function checkGiveaways(client) {
    try {
        // 獲取所有未結束且已過期的抽獎
        const now = new Date();
        const giveaways = await Giveaway.find({ ended: false });
        
        const endedGiveaways = giveaways.filter(g => new Date(g.endAt) <= now);
        
        // 結束已過期的抽獎
        for (const giveaway of endedGiveaways) {
            try {
                await endGiveaway(giveaway.messageId, client);
            } catch (error) {
                console.error(`自動結束抽獎 ${giveaway.messageId} 時出錯:`, error);
            }
        }
    } catch (error) {
        console.error('檢查抽獎時出錯:', error);
    }
}

/**
 * 從參與者中選擇獲獎者
 * @param {Object} giveaway 抽獎對象
 * @returns {Array} 獲獎者列表
 */
function selectWinners(giveaway) {
    const participants = giveaway.participants || [];
    const winnerCount = Math.min(giveaway.winnerCount, participants.length);
    const winners = [];
    
    // 如果沒有參與者，返回空列表
    if (participants.length === 0) {
        return [];
    }
    
    // 隨機選擇獲獎者
    const availableParticipants = [...participants];
    for (let i = 0; i < winnerCount; i++) {
        if (availableParticipants.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * availableParticipants.length);
        const winnerId = availableParticipants.splice(randomIndex, 1)[0];
        
        winners.push({ id: winnerId });
    }
    
    return winners;
}

module.exports = {
    createGiveaway,
    endGiveaway,
    rerollGiveaway,
    deleteGiveaway,
    checkGiveaways
};
