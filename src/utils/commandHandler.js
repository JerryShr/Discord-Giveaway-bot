const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 命令集合
const commands = new Collection();

// 加載所有命令
function loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        // 設置新的命令
        if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
            console.log(`已加載命令: ${command.data.name}`);
        } else {
            console.log(`[警告] 命令 ${filePath} 缺少必要的 "data" 或 "execute" 屬性`);
        }
    }
}

// 初始化時加載命令
loadCommands();

/**
 * 處理斜線命令
 * @param {Object} interaction - 互動對象
 * @param {Object} client - Discord客戶端
 */
async function handleCommands(interaction, client) {
    if (!interaction.isCommand()) return;
    
    const command = commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`找不到命令: ${interaction.commandName}`);
        return;
    }
    
    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`執行命令時出錯: ${interaction.commandName}`);
        console.error(error);
        
        const errorMessage = '執行命令時出錯!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}

/**
 * 處理按鈕互動
 * @param {Object} interaction - 互動對象
 * @param {Object} client - Discord客戶端
 */
async function handleButton(interaction, client) {
    if (!interaction.isButton()) return;
    
    const { customId } = interaction;
    
    // 處理抽獎參加按鈕
    if (customId === 'giveaway-join') {
        const Giveaway = require('../models/Giveaway');
        
        try {
            const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
            
            if (!giveaway) {
                return interaction.reply({
                    content: '找不到此抽獎活動或已結束。',
                    ephemeral: true
                });
            }
            
            if (giveaway.ended) {
                return interaction.reply({
                    content: '此抽獎活動已結束。',
                    ephemeral: true
                });
            }
            
            // 檢查用戶是否已參與
            if (giveaway.participants.includes(interaction.user.id)) {
                // 用戶已參與，移除參與
                giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
                await giveaway.save();
                
                return interaction.reply({
                    content: `您已退出「${giveaway.prize}」的抽獎活動。`,
                    ephemeral: true
                });
            } else {
                // 用戶未參與，添加參與
                giveaway.participants.push(interaction.user.id);
                await giveaway.save();
                
                return interaction.reply({
                    content: `您已成功參加「${giveaway.prize}」的抽獎活動！`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('處理抽獎參加按鈕時出錯:', error);
            await interaction.reply({
                content: '參加抽獎時出錯: ' + error.message,
                ephemeral: true
            });
        }
    }
}

module.exports = {
    handleCommands,
    handleButton,
    commands
};
