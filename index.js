const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { QuickDB } = require('quick.db');
const ms = require('ms');

// 載入配置
const config = require('./config.json');

// 創建客戶端實例
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 創建數據庫實例
const db = new QuickDB({
  filePath: config.database.path
});

// 命令集合
client.commands = new Collection();
const commands = [];

// 讀取命令文件
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath, { recursive: true });
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // 將命令添加到集合中
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`[警告] ${filePath} 中的命令缺少必要的 "data" 或 "execute" 屬性。`);
  }
}

// 當機器人準備就緒時
client.once('ready', async () => {
  console.log(`已登入為 ${client.user.tag}!`);
  
  // 註冊斜線命令
  const rest = new REST({ version: '10' }).setToken(config.token);
  
  try {
    console.log('開始重新整理應用程式 (/) 命令。');
    
    // 根據配置決定是全局註冊還是僅在特定伺服器中註冊
    if (config.registerGlobally) {
      // 全局註冊命令（所有伺服器可用，但可能需要1小時更新）
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands },
      );
      console.log('成功全局註冊應用程式 (/) 命令。');
    } else {
      // 僅在特定伺服器中註冊命令（立即更新）
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands },
      );
      console.log(`成功在伺服器 ${config.guildId} 中註冊應用程式 (/) 命令。`);
    }
  } catch (error) {
    console.error('註冊命令時出錯:', error);
  }
  
  // 檢查進行中的抽獎
  checkGiveaways();
});

// 處理斜線命令
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`找不到命令 ${interaction.commandName}`);
    return;
  }
  
  try {
    await command.execute(interaction, client, db);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '執行此命令時發生錯誤！',
      ephemeral: true
    });
  }
});

// 處理按鈕互動
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  
  // 處理抽獎參與按鈕
  if (interaction.customId.startsWith('giveaway-enter-')) {
    const giveawayId = interaction.customId.replace('giveaway-enter-', '');
    const giveaway = await db.get(`giveaways.${giveawayId}`);
    
    if (!giveaway) {
      return await interaction.reply({
        content: '這個抽獎已經不存在了！',
        ephemeral: true
      });
    }
    
    if (giveaway.ended) {
      return await interaction.reply({
        content: '這個抽獎已經結束了！',
        ephemeral: true
      });
    }
    
    // 檢查用戶是否已經參與
    if (giveaway.participants.includes(interaction.user.id)) {
      // 從參與者列表中移除用戶
      giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
      await db.set(`giveaways.${giveawayId}`, giveaway);
      
      return await interaction.reply({
        content: '你已退出這個抽獎！',
        ephemeral: true
      });
    } else {
      // 將用戶添加到參與者列表
      giveaway.participants.push(interaction.user.id);
      await db.set(`giveaways.${giveawayId}`, giveaway);
      
      return await interaction.reply({
        content: '你已成功參與這個抽獎！',
        ephemeral: true
      });
    }
  }
});

// 檢查進行中的抽獎
async function checkGiveaways() {
  const giveaways = await db.get('giveaways') || {};
  
  for (const [id, giveaway] of Object.entries(giveaways)) {
    if (!giveaway.ended && giveaway.endTime <= Date.now()) {
      await endGiveaway(id);
    }
  }
  
  // 每分鐘檢查一次
  setTimeout(checkGiveaways, 60000);
}

// 結束抽獎並選擇獲獎者
async function endGiveaway(giveawayId) {
  const giveaway = await db.get(`giveaways.${giveawayId}`);
  
  if (!giveaway || giveaway.ended) return;
  
  // 標記抽獎為已結束
  giveaway.ended = true;
  
  // 選擇獲獎者
  const winners = selectWinners(giveaway.participants, giveaway.winnerCount);
  giveaway.winners = winners;
  
  // 更新數據庫
  await db.set(`giveaways.${giveawayId}`, giveaway);
  
  // 獲取抽獎消息
  try {
    const guild = await client.guilds.fetch(giveaway.guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    
    // 創建獲獎者列表
    let winnerText = '沒有有效參與者';
    
    if (winners.length > 0) {
      winnerText = winners.map(id => `<@${id}>`).join(', ');
    }
    
    // 更新嵌入
    const embed = EmbedBuilder.from(message.embeds[0])
      .setDescription(`**獎品**: ${giveaway.prize}\n**獲獎者**: ${winnerText}\n**參與人數**: ${giveaway.participants.length}\n\n**抽獎已結束**`)
      .setColor(config.embedColor);
    
    // 更新按鈕
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway-enter-${giveawayId}`)
          .setLabel(`已有 ${giveaway.participants.length} 人參與`)
          .setEmoji(config.emoji)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    
    // 更新消息
    await message.edit({ embeds: [embed], components: [row] });
    
    // 發送獲獎通知
    if (winners.length > 0) {
      await channel.send({
        content: `恭喜 ${winnerText}! 你贏得了 **${giveaway.prize}**!`,
        allowedMentions: { users: winners }
      });
    } else {
      await channel.send(`沒有人贏得 **${giveaway.prize}** 因為沒有有效參與者。`);
    }
  } catch (error) {
    console.error('更新抽獎消息時出錯:', error);
  }
}

// 選擇獲獎者
function selectWinners(participants, winnerCount) {
  if (participants.length === 0) return [];
  
  const winners = [];
  const participantsCopy = [...participants];
  
  for (let i = 0; i < Math.min(winnerCount, participants.length); i++) {
    const randomIndex = Math.floor(Math.random() * participantsCopy.length);
    winners.push(participantsCopy[randomIndex]);
    participantsCopy.splice(randomIndex, 1);
  }
  
  return winners;
}

// 登入 Discord
client.login(config.token);
