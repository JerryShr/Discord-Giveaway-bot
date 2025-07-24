require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleCommands, handleButton } = require('./src/utils/commandHandler');
const { checkGiveaways } = require('./src/utils/giveawayManager');

// 創建Discord客戶端
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// 確保數據目錄存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 當機器人準備就緒時
client.once('ready', () => {
    console.log(`已登入為 ${client.user.tag}!`);
    
    // 設置機器人狀態
    client.user.setActivity('/ghelp', { type: 'PLAYING' });
    
    // 啟動定時檢查抽獎的任務
    setInterval(() => {
        checkGiveaways(client);
    }, 10000); // 每10秒檢查一次
});

// 處理交互（斜線命令和按鈕）
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            await handleCommands(interaction, client);
        } else if (interaction.isButton()) {
            await handleButton(interaction, client);
        }
    } catch (error) {
        console.error('處理交互時出錯:', error);
        
        // 如果交互尚未回覆，則發送錯誤消息
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '執行操作時發生錯誤，請稍後再試。',
                ephemeral: true
            }).catch(console.error);
        } else if (interaction.deferred) {
            await interaction.editReply({
                content: '執行操作時發生錯誤，請稍後再試。'
            }).catch(console.error);
        }
    }
});

// 登入Discord
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('機器人已成功登入Discord!');
    })
    .catch(error => {
        console.error('登入Discord時出錯:', error);
    });

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
    console.error('未捕獲的異常:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的Promise拒絕:', error);
});
