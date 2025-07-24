require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 獲取命令文件
const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 加載所有命令
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`已加載命令: ${command.data.name}`);
    } else {
        console.log(`[警告] 命令 ${filePath} 缺少必要的 "data" 屬性`);
    }
}

// 檢查環境變量
if (!process.env.DISCORD_TOKEN) {
    console.error('錯誤: 環境變量 DISCORD_TOKEN 未設置');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('錯誤: 環境變量 CLIENT_ID 未設置');
    console.error('請在 .env 文件中添加 CLIENT_ID=your_bot_client_id');
    process.exit(1);
}

// 準備註冊
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 註冊命令
(async () => {
    try {
        console.log(`開始註冊 ${commands.length} 個斜線命令...`);
        
        // 檢查是否提供了伺服器ID
        const guildId = process.argv[2];
        
        let data;
        
        if (guildId) {
            // 註冊到特定伺服器
            console.log(`正在註冊命令到伺服器 ${guildId}...`);
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
            console.log(`成功註冊 ${data.length} 個斜線命令到伺服器 ${guildId}`);
        } else {
            // 全局註冊
            console.log('正在全局註冊命令...');
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log(`成功全局註冊 ${data.length} 個斜線命令`);
        }
    } catch (error) {
        console.error('註冊斜線命令時出錯:', error);
    }
})();

// 使用說明
if (process.argv.length <= 2) {
    console.log('\n使用說明:');
    console.log('  全局註冊命令: node scripts/register-commands.js');
    console.log('  註冊到特定伺服器: node scripts/register-commands.js <伺服器ID>');
    console.log('\n請確保在 .env 文件中設置了 DISCORD_TOKEN 和 CLIENT_ID');
}
