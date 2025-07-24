const fs = require('fs');
const path = require('path');

// 語言文件目錄
const languagesDir = path.join(__dirname, '../../languages');

// 確保語言目錄存在
if (!fs.existsSync(languagesDir)) {
    fs.mkdirSync(languagesDir, { recursive: true });
}

// 伺服器語言設置文件
const serverLanguagesPath = path.join(__dirname, '../../data/server_languages.json');

// 確保伺服器語言設置文件存在
function ensureServerLanguagesFile() {
    const dataDir = path.dirname(serverLanguagesPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(serverLanguagesPath)) {
        fs.writeFileSync(serverLanguagesPath, JSON.stringify({}, null, 2));
        return {};
    }
    
    return JSON.parse(fs.readFileSync(serverLanguagesPath, 'utf8'));
}

// 保存伺服器語言設置
function saveServerLanguages(languages) {
    fs.writeFileSync(serverLanguagesPath, JSON.stringify(languages, null, 2));
}

// 加載語言文件
function loadLanguageFile(language) {
    const filePath = path.join(languagesDir, `${language}.json`);
    
    if (!fs.existsSync(filePath)) {
        // 如果語言文件不存在，返回空對象
        return {};
    }
    
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 獲取支持的語言列表
function getSupportedLanguages() {
    // 讀取語言目錄中的所有JSON文件
    const files = fs.readdirSync(languagesDir).filter(file => file.endsWith('.json'));
    
    // 提取語言代碼（文件名去掉.json後綴）
    return files.map(file => file.replace('.json', ''));
}

// 獲取伺服器的語言設置
function getServerLanguage(guildId) {
    const serverLanguages = ensureServerLanguagesFile();
    return serverLanguages[guildId] || 'zh-TW'; // 默認為繁體中文
}

// 設置伺服器的語言
function setServerLanguage(guildId, language) {
    const serverLanguages = ensureServerLanguagesFile();
    serverLanguages[guildId] = language;
    saveServerLanguages(serverLanguages);
}

// 獲取翻譯
function translate(key, language, replacements = {}) {
    // 加載語言文件
    const translations = loadLanguageFile(language);
    
    // 如果找不到翻譯，嘗試使用默認語言
    if (!translations[key] && language !== 'zh-TW') {
        const defaultTranslations = loadLanguageFile('zh-TW');
        if (defaultTranslations[key]) {
            return applyReplacements(defaultTranslations[key], replacements);
        }
    }
    
    // 返回翻譯，如果找不到則返回鍵名
    return translations[key] ? applyReplacements(translations[key], replacements) : key;
}

// 應用替換
function applyReplacements(text, replacements) {
    let result = text;
    
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    return result;
}

// 創建默認語言文件
function createDefaultLanguageFiles() {
    // 繁體中文（默認）
    const zhTW = {
        // 通用
        'giveaway.prize': '獎品',
        'giveaway.winners': '獲獎人數',
        'giveaway.duration': '持續時間',
        'giveaway.host': '舉辦者',
        'giveaway.ends': '結束時間',
        'giveaway.started': '開始時間',
        'giveaway.ended': '已結束',
        'giveaway.participants': '參與人數',
        'giveaway.click_to_participate': '點擊下方的 {reaction} 按鈕參加抽獎！',
        'giveaway.congratulations': '恭喜 {winners} 獲得了 **{prize}**!',
        'giveaway.no_winners': '沒有足夠的參與者來抽取獲獎者。',
        
        // 命令回覆
        'command.create.success': '抽獎活動已創建！獎品: {prize}, 獲獎人數: {winnerCount}, 持續時間: {duration}',
        'command.start.success': '抽獎活動已開始！獎品: {prize}, 獲獎人數: {winnerCount}, 持續時間: {duration}',
        'command.end.success': '抽獎已結束，已抽出 {winnerCount} 位獲獎者！',
        'command.end.no_winners': '抽獎已結束，但沒有足夠的參與者來抽取獲獎者。',
        'command.delete.success': '抽獎活動已成功刪除！',
        'command.reroll.success': '已重新抽出 {winnerCount} 位獲獎者！',
        'command.reroll.no_winners': '重新抽獎失敗，沒有足夠的參與者來抽取獲獎者。',
        
        // 錯誤消息
        'error.invalid_duration': '無效的持續時間格式。請使用數字後跟S/M/H/D，例如: 1h, 30m, 2d',
        'error.invalid_winner_count': '獲獎人數必須是大於0的數字。',
        'error.empty_prize': '獎品名稱不能為空。',
        'error.giveaway_not_found': '找不到指定的抽獎活動。請確保您提供了正確的抽獎ID。',
        'error.giveaway_not_ended': '此抽獎活動尚未結束，無法重新抽取獲獎者。',
        'error.no_permission': '您需要管理員權限才能使用此命令。',
        
        // 參與條件
        'eligibility.required_roles': '需要角色: {roles}',
        'eligibility.required_server_days': '需要在伺服器中至少 {days} 天',
        'eligibility.min_account_age': '需要Discord帳戶年齡至少 {days} 天',
        'eligibility.not_eligible': '您不符合參與此抽獎的條件: {reason}',
        
        // 設置
        'settings.title': 'GiveawayBot 設置',
        'settings.embed_color': '嵌入顏色',
        'settings.reaction': '抽獎表情符號',
        'settings.language': '語言',
        'settings.updated': '設置已更新',
        
        // 模板
        'template.created': '模板 "{name}" 已創建！',
        'template.updated': '模板 "{name}" 已更新！',
        'template.deleted': '模板 "{name}" 已刪除！',
        'template.not_found': '找不到名為 "{name}" 的模板。',
        'template.already_exists': '名為 "{name}" 的模板已存在。',
        'template.list_title': '可用的抽獎模板',
        'template.no_templates': '此伺服器沒有保存的模板。',
        
        // 統計
        'stats.view_count': '查看次數',
        'stats.join_rate': '參與率',
        'stats.completion_rate': '完成率',
        'stats.total_participants': '總參與人數'
    };
    
    // 簡體中文
    const zhCN = {
        // 通用
        'giveaway.prize': '奖品',
        'giveaway.winners': '获奖人数',
        'giveaway.duration': '持续时间',
        'giveaway.host': '举办者',
        'giveaway.ends': '结束时间',
        'giveaway.started': '开始时间',
        'giveaway.ended': '已结束',
        'giveaway.participants': '参与人数',
        'giveaway.click_to_participate': '点击下方的 {reaction} 按钮参加抽奖！',
        'giveaway.congratulations': '恭喜 {winners} 获得了 **{prize}**!',
        'giveaway.no_winners': '没有足够的参与者来抽取获奖者。',
        
        // 命令回覆
        'command.create.success': '抽奖活动已创建！奖品: {prize}, 获奖人数: {winnerCount}, 持续时间: {duration}',
        'command.start.success': '抽奖活动已开始！奖品: {prize}, 获奖人数: {winnerCount}, 持续时间: {duration}',
        'command.end.success': '抽奖已结束，已抽出 {winnerCount} 位获奖者！',
        'command.end.no_winners': '抽奖已结束，但没有足够的参与者来抽取获奖者。',
        'command.delete.success': '抽奖活动已成功删除！',
        'command.reroll.success': '已重新抽出 {winnerCount} 位获奖者！',
        'command.reroll.no_winners': '重新抽奖失败，没有足够的参与者来抽取获奖者。',
        
        // 錯誤消息
        'error.invalid_duration': '无效的持续时间格式。请使用数字后跟S/M/H/D，例如: 1h, 30m, 2d',
        'error.invalid_winner_count': '获奖人数必须是大于0的数字。',
        'error.empty_prize': '奖品名称不能为空。',
        'error.giveaway_not_found': '找不到指定的抽奖活动。请确保您提供了正确的抽奖ID。',
        'error.giveaway_not_ended': '此抽奖活动尚未结束，无法重新抽取获奖者。',
        'error.no_permission': '您需要管理员权限才能使用此命令。',
        
        // 參與條件
        'eligibility.required_roles': '需要角色: {roles}',
        'eligibility.required_server_days': '需要在服务器中至少 {days} 天',
        'eligibility.min_account_age': '需要Discord账户年龄至少 {days} 天',
        'eligibility.not_eligible': '您不符合参与此抽奖的条件: {reason}',
        
        // 設置
        'settings.title': 'GiveawayBot 设置',
        'settings.embed_color': '嵌入颜色',
        'settings.reaction': '抽奖表情符号',
        'settings.language': '语言',
        'settings.updated': '设置已更新',
        
        // 模板
        'template.created': '模板 "{name}" 已创建！',
        'template.updated': '模板 "{name}" 已更新！',
        'template.deleted': '模板 "{name}" 已删除！',
        'template.not_found': '找不到名为 "{name}" 的模板。',
        'template.already_exists': '名为 "{name}" 的模板已存在。',
        'template.list_title': '可用的抽奖模板',
        'template.no_templates': '此服务器没有保存的模板。',
        
        // 統計
        'stats.view_count': '查看次数',
        'stats.join_rate': '参与率',
        'stats.completion_rate': '完成率',
        'stats.total_participants': '总参与人数'
    };
    
    // 英文
    const enUS = {
        // 通用
        'giveaway.prize': 'Prize',
        'giveaway.winners': 'Winners',
        'giveaway.duration': 'Duration',
        'giveaway.host': 'Host',
        'giveaway.ends': 'Ends',
        'giveaway.started': 'Started',
        'giveaway.ended': 'Ended',
        'giveaway.participants': 'Participants',
        'giveaway.click_to_participate': 'Click the {reaction} button below to participate!',
        'giveaway.congratulations': 'Congratulations {winners} for winning **{prize}**!',
        'giveaway.no_winners': 'Not enough participants to draw winners.',
        
        // 命令回覆
        'command.create.success': 'Giveaway created! Prize: {prize}, Winners: {winnerCount}, Duration: {duration}',
        'command.start.success': 'Giveaway started! Prize: {prize}, Winners: {winnerCount}, Duration: {duration}',
        'command.end.success': 'Giveaway ended, {winnerCount} winners drawn!',
        'command.end.no_winners': 'Giveaway ended, but there were not enough participants to draw winners.',
        'command.delete.success': 'Giveaway successfully deleted!',
        'command.reroll.success': 'Rerolled {winnerCount} new winners!',
        'command.reroll.no_winners': 'Reroll failed, not enough participants to draw winners.',
        
        // 錯誤消息
        'error.invalid_duration': 'Invalid duration format. Please use a number followed by S/M/H/D, e.g., 1h, 30m, 2d',
        'error.invalid_winner_count': 'Winner count must be a number greater than 0.',
        'error.empty_prize': 'Prize name cannot be empty.',
        'error.giveaway_not_found': 'Giveaway not found. Please make sure you provided the correct giveaway ID.',
        'error.giveaway_not_ended': 'This giveaway has not ended yet, cannot reroll winners.',
        'error.no_permission': 'You need administrator permissions to use this command.',
        
        // 參與條件
        'eligibility.required_roles': 'Required roles: {roles}',
        'eligibility.required_server_days': 'Must be in the server for at least {days} days',
        'eligibility.min_account_age': 'Discord account must be at least {days} days old',
        'eligibility.not_eligible': 'You are not eligible to participate in this giveaway: {reason}',
        
        // 設置
        'settings.title': 'GiveawayBot Settings',
        'settings.embed_color': 'Embed Color',
        'settings.reaction': 'Giveaway Reaction',
        'settings.language': 'Language',
        'settings.updated': 'Settings updated',
        
        // 模板
        'template.created': 'Template "{name}" created!',
        'template.updated': 'Template "{name}" updated!',
        'template.deleted': 'Template "{name}" deleted!',
        'template.not_found': 'Template "{name}" not found.',
        'template.already_exists': 'Template "{name}" already exists.',
        'template.list_title': 'Available Giveaway Templates',
        'template.no_templates': 'This server has no saved templates.',
        
        // 統計
        'stats.view_count': 'View Count',
        'stats.join_rate': 'Join Rate',
        'stats.completion_rate': 'Completion Rate',
        'stats.total_participants': 'Total Participants'
    };
    
    // 寫入語言文件
    fs.writeFileSync(path.join(languagesDir, 'zh-TW.json'), JSON.stringify(zhTW, null, 2));
    fs.writeFileSync(path.join(languagesDir, 'zh-CN.json'), JSON.stringify(zhCN, null, 2));
    fs.writeFileSync(path.join(languagesDir, 'en-US.json'), JSON.stringify(enUS, null, 2));
}

// 初始化語言文件
createDefaultLanguageFiles();

module.exports = {
    getSupportedLanguages,
    getServerLanguage,
    setServerLanguage,
    translate
};
