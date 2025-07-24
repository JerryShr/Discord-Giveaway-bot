const fs = require('fs');
const path = require('path');
const { formatTime } = require('../utils/timeUtils');

// 數據文件路徑
const dataFilePath = path.join(__dirname, '../../data/giveaways.json');

// 確保數據目錄和文件存在
function ensureDataFile() {
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
        return [];
    }
    
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// 保存數據到文件
function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// 抽獎類
class Giveaway {
    constructor(data) {
        this.messageId = data.messageId;
        this.channelId = data.channelId;
        this.guildId = data.guildId;
        this.startAt = data.startAt || new Date();
        this.endAt = data.endAt;
        this.ended = data.ended || false;
        this.prize = data.prize;
        this.winnerCount = data.winnerCount;
        this.hostId = data.hostId;
        this.winners = data.winners || [];
        this.participants = data.participants || [];
        this.embedColor = data.embedColor || '#FF0000';
        this.reaction = data.reaction || '🎉';
        
        // 新增的高級設置
        this.requiredRoles = data.requiredRoles || []; // 需要的角色ID
        this.excludedRoles = data.excludedRoles || []; // 排除的角色ID
        this.requiredServerDays = data.requiredServerDays || 0; // 需要在伺服器的天數
        this.minAccountAge = data.minAccountAge || 0; // 最小帳戶年齡（天）
        this.allowMultipleWinners = data.allowMultipleWinners || true; // 是否允許多次獲獎
        this.templateName = data.templateName || ''; // 模板名稱
        this.language = data.language || 'zh-TW'; // 語言
        
        // 統計數據
        this.viewCount = data.viewCount || 0; // 查看次數
        this.joinRate = data.joinRate || 0; // 參與率
        this.completionRate = data.completionRate || 0; // 完成率
    }
    
    // 保存抽獎數據
    async save() {
        const giveaways = ensureDataFile();
        const index = giveaways.findIndex(g => g.messageId === this.messageId);
        
        if (index !== -1) {
            giveaways[index] = this;
        } else {
            giveaways.push(this);
        }
        
        saveData(giveaways);
        return this;
    }
    
    // 更新抽獎統計數據
    updateStats() {
        // 計算參與率
        this.viewCount++;
        if (this.viewCount > 0) {
            this.joinRate = (this.participants.length / this.viewCount) * 100;
        }
        
        // 計算完成率
        if (this.ended && this.winnerCount > 0) {
            this.completionRate = (this.winners.length / this.winnerCount) * 100;
        }
        
        return this.save();
    }
    
    // 檢查用戶是否符合參與條件
    async checkEligibility(member) {
        // 檢查所需角色
        if (this.requiredRoles.length > 0) {
            const hasRequiredRole = member.roles.cache.some(role => this.requiredRoles.includes(role.id));
            if (!hasRequiredRole) {
                return { eligible: false, reason: '您沒有參與此抽獎所需的角色。' };
            }
        }
        
        // 檢查排除角色
        if (this.excludedRoles.length > 0) {
            const hasExcludedRole = member.roles.cache.some(role => this.excludedRoles.includes(role.id));
            if (hasExcludedRole) {
                return { eligible: false, reason: '您擁有被排除參與此抽獎的角色。' };
            }
        }
        
        // 檢查伺服器加入時間
        if (this.requiredServerDays > 0) {
            const joinedAt = member.joinedAt;
            const daysSinceJoin = (new Date() - joinedAt) / (1000 * 60 * 60 * 24);
            if (daysSinceJoin < this.requiredServerDays) {
                return { eligible: false, reason: `您需要在伺服器中至少 ${this.requiredServerDays} 天才能參與此抽獎。` };
            }
        }
        
        // 檢查帳戶年齡
        if (this.minAccountAge > 0) {
            const createdAt = member.user.createdAt;
            const accountAgeDays = (new Date() - createdAt) / (1000 * 60 * 60 * 24);
            if (accountAgeDays < this.minAccountAge) {
                return { eligible: false, reason: `您的Discord帳戶需要至少 ${this.minAccountAge} 天的歷史才能參與此抽獎。` };
            }
        }
        
        return { eligible: true };
    }
    
    // 靜態方法：查找所有抽獎
    static async find(query = {}) {
        const giveaways = ensureDataFile();
        
        return giveaways.filter(giveaway => {
            for (const key in query) {
                if (giveaway[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        }).map(data => new Giveaway(data));
    }
    
    // 靜態方法：查找一個抽獎
    static async findOne(query = {}) {
        const giveaways = ensureDataFile();
        
        const found = giveaways.find(giveaway => {
            for (const key in query) {
                if (giveaway[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        });
        
        return found ? new Giveaway(found) : null;
    }
    
    // 靜態方法：更新一個抽獎
    static async updateOne(query = {}, update = {}) {
        const giveaways = ensureDataFile();
        
        const index = giveaways.findIndex(giveaway => {
            for (const key in query) {
                if (giveaway[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        });
        
        if (index !== -1) {
            for (const key in update) {
                if (key.startsWith('$')) {
                    // 處理特殊操作符
                    if (key === '$set') {
                        for (const setKey in update[key]) {
                            giveaways[index][setKey] = update[key][setKey];
                        }
                    } else if (key === '$push') {
                        for (const pushKey in update[key]) {
                            if (!Array.isArray(giveaways[index][pushKey])) {
                                giveaways[index][pushKey] = [];
                            }
                            giveaways[index][pushKey].push(update[key][pushKey]);
                        }
                    }
                } else {
                    // 直接更新
                    giveaways[index][key] = update[key];
                }
            }
            
            saveData(giveaways);
            return { matchedCount: 1, modifiedCount: 1 };
        }
        
        return { matchedCount: 0, modifiedCount: 0 };
    }
    
    // 靜態方法：刪除一個抽獎
    static async deleteOne(query = {}) {
        const giveaways = ensureDataFile();
        
        const initialLength = giveaways.length;
        const newGiveaways = giveaways.filter(giveaway => {
            for (const key in query) {
                if (giveaway[key] !== query[key]) {
                    return true;
                }
            }
            return false;
        });
        
        if (newGiveaways.length !== initialLength) {
            saveData(newGiveaways);
            return { deletedCount: initialLength - newGiveaways.length };
        }
        
        return { deletedCount: 0 };
    }
    
    // 獲取剩餘時間
    getRemainingTime() {
        if (this.ended) return '已結束';
        
        const now = new Date();
        const endTime = new Date(this.endAt);
        const remaining = endTime - now;
        
        if (remaining <= 0) return '即將結束';
        
        return formatTime(remaining);
    }
    
    // 獲取抽獎嵌入消息
    getEmbed(client) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle(`🎉 抽獎: ${this.prize}`)
            .setColor(this.embedColor)
            .setDescription(`點擊下方的 ${this.reaction} 按鈕參加抽獎！\n\n**獲獎人數:** ${this.winnerCount}\n**結束時間:** <t:${Math.floor(new Date(this.endAt).getTime() / 1000)}:R>\n**舉辦者:** <@${this.hostId}>`)
            .setFooter({ text: `抽獎ID: ${this.messageId}`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // 添加參與條件
        const conditions = [];
        if (this.requiredRoles.length > 0) {
            conditions.push(`• 需要角色: ${this.requiredRoles.map(id => `<@&${id}>`).join(', ')}`);
        }
        if (this.requiredServerDays > 0) {
            conditions.push(`• 需要在伺服器中至少 ${this.requiredServerDays} 天`);
        }
        if (this.minAccountAge > 0) {
            conditions.push(`• 需要Discord帳戶年齡至少 ${this.minAccountAge} 天`);
        }
        
        if (conditions.length > 0) {
            embed.addFields({ name: '參與條件', value: conditions.join('\n') });
        }
        
        // 添加參與統計
        embed.addFields({ name: '參與情況', value: `• 參與人數: ${this.participants.length}` });
        
        return embed;
    }
    
    // 獲取結束嵌入消息
    getEndEmbed(client) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle(`🎊 抽獎結束: ${this.prize}`)
            .setColor(this.embedColor)
            .setTimestamp()
            .setFooter({ text: `抽獎ID: ${this.messageId}`, iconURL: client.user.displayAvatarURL() });
        
        if (this.winners.length > 0) {
            const winnerMentions = this.winners.map(id => `<@${id}>`).join(', ');
            embed.setDescription(`🎉 恭喜 ${winnerMentions} 獲得了 **${this.prize}**!\n\n**舉辦者:** <@${this.hostId}>`);
        } else {
            embed.setDescription(`沒有足夠的參與者來抽取獲獎者。\n\n**舉辦者:** <@${this.hostId}>`);
        }
        
        // 添加統計數據
        embed.addFields(
            { name: '參與統計', value: `• 總參與人數: ${this.participants.length}\n• 參與率: ${this.joinRate.toFixed(2)}%\n• 完成率: ${this.completionRate.toFixed(2)}%` }
        );
        
        return embed;
    }
}

module.exports = Giveaway;
