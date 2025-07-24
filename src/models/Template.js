const fs = require('fs');
const path = require('path');

// 模板文件路徑
const templatesFilePath = path.join(__dirname, '../../data/templates.json');

// 確保模板文件存在
function ensureTemplatesFile() {
    const dataDir = path.dirname(templatesFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(templatesFilePath)) {
        fs.writeFileSync(templatesFilePath, JSON.stringify({}, null, 2));
        return {};
    }
    
    return JSON.parse(fs.readFileSync(templatesFilePath, 'utf8'));
}

// 保存模板數據
function saveTemplates(templates) {
    fs.writeFileSync(templatesFilePath, JSON.stringify(templates, null, 2));
}

// 模板類
class Template {
    constructor(data) {
        this.name = data.name;
        this.guildId = data.guildId;
        this.creatorId = data.creatorId;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        
        // 抽獎設置
        this.duration = data.duration || '1d';
        this.winnerCount = data.winnerCount || 1;
        this.prize = data.prize || '';
        this.embedColor = data.embedColor || '#FF0000';
        this.reaction = data.reaction || '🎉';
        
        // 高級設置
        this.requiredRoles = data.requiredRoles || [];
        this.excludedRoles = data.excludedRoles || [];
        this.requiredServerDays = data.requiredServerDays || 0;
        this.minAccountAge = data.minAccountAge || 0;
        this.allowMultipleWinners = data.allowMultipleWinners !== undefined ? data.allowMultipleWinners : true;
        this.language = data.language || 'zh-TW';
    }
    
    // 保存模板
    save() {
        const templates = ensureTemplatesFile();
        
        if (!templates[this.guildId]) {
            templates[this.guildId] = {};
        }
        
        this.updatedAt = new Date();
        templates[this.guildId][this.name] = this;
        
        saveTemplates(templates);
        return this;
    }
    
    // 刪除模板
    delete() {
        const templates = ensureTemplatesFile();
        
        if (templates[this.guildId] && templates[this.guildId][this.name]) {
            delete templates[this.guildId][this.name];
            saveTemplates(templates);
            return true;
        }
        
        return false;
    }
    
    // 靜態方法：獲取伺服器的所有模板
    static getAll(guildId) {
        const templates = ensureTemplatesFile();
        
        if (!templates[guildId]) {
            return [];
        }
        
        return Object.values(templates[guildId]).map(data => new Template(data));
    }
    
    // 靜態方法：獲取特定模板
    static get(guildId, name) {
        const templates = ensureTemplatesFile();
        
        if (!templates[guildId] || !templates[guildId][name]) {
            return null;
        }
        
        return new Template(templates[guildId][name]);
    }
    
    // 靜態方法：檢查模板是否存在
    static exists(guildId, name) {
        const templates = ensureTemplatesFile();
        return !!(templates[guildId] && templates[guildId][name]);
    }
    
    // 將模板轉換為抽獎選項
    toGiveawayOptions(channel, hostId) {
        const ms = require('ms');
        
        return {
            channel: channel,
            duration: this.duration,
            winnerCount: this.winnerCount,
            prize: this.prize,
            hostId: hostId,
            embedColor: this.embedColor,
            reaction: this.reaction,
            requiredRoles: this.requiredRoles,
            excludedRoles: this.excludedRoles,
            requiredServerDays: this.requiredServerDays,
            minAccountAge: this.minAccountAge,
            allowMultipleWinners: this.allowMultipleWinners,
            templateName: this.name,
            language: this.language
        };
    }
}

module.exports = Template;
