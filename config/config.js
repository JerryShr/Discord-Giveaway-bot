require('dotenv').config();

module.exports = {
    // Discord機器人設置
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: process.env.BOT_PREFIX || 'g',
    ownerId: process.env.BOT_OWNER_ID,
    
    // 抽獎設置
    giveaway: {
        embedColor: process.env.DEFAULT_EMBED_COLOR || '#FF0000',
        reaction: process.env.DEFAULT_REACTION || '🎉',
        // 數據存儲路徑
        dataDir: process.env.DATA_DIR || './data',
        giveawaysFile: process.env.GIVEAWAYS_FILE || 'giveaways.json'
    },
    
    // 機器人信息
    bot: {
        name: 'GiveawayBot',
        version: '1.0.0',
        description: '一個功能豐富的Discord抽獎機器人',
        github: 'https://github.com/yourusername/giveaway-bot',
        supportServer: 'https://discord.gg/your-support-server'
    }
};
