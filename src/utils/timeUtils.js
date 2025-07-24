const ms = require('ms');

/**
 * 將時間字符串轉換為毫秒
 * @param {string} time - 時間字符串，例如 "1h", "30m", "2d"
 * @returns {number} 毫秒數
 */
function parseTime(time) {
    if (!time) return 0;
    return ms(time);
}

/**
 * 將毫秒轉換為人類可讀的時間格式
 * @param {number} ms - 毫秒數
 * @returns {string} 格式化的時間字符串
 */
function formatTime(ms) {
    if (!ms || isNaN(ms)) return '0 秒';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) parts.push(`${days} 天`);
    if (hours > 0) parts.push(`${hours} 小時`);
    if (minutes > 0) parts.push(`${minutes} 分鐘`);
    if (seconds > 0) parts.push(`${seconds} 秒`);
    
    return parts.join(' ');
}

/**
 * 檢查時間字符串格式是否有效
 * @param {string} time - 時間字符串
 * @returns {boolean} 是否有效
 */
function isValidTimeFormat(time) {
    if (!time) return false;
    
    // 檢查格式是否為數字後跟S/M/H/D (不區分大小寫)
    const regex = /^\d+[smhd]$/i;
    return regex.test(time);
}

module.exports = {
    parseTime,
    formatTime,
    isValidTimeFormat
};
