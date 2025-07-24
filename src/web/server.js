const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 導入模型和工具
const Giveaway = require('../models/Giveaway');
const Template = require('../models/Template');
const { updateGuildStats, generateParticipationChart } = require('../utils/statsManager');
const { getServerLanguage, translate } = require('../utils/languageManager');

// 創建Express應用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 設置視圖引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中間件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'giveaway-bot-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 } // 1天
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Discord客戶端
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Passport配置
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        return done(null, profile);
    });
}));

// 身份驗證中間件
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// 檢查是否是伺服器管理員
function isGuildAdmin(req, res, next) {
    const guildId = req.params.guildId;
    const userGuilds = req.user.guilds;
    
    const guild = userGuilds.find(g => g.id === guildId);
    
    if (!guild) {
        return res.status(403).render('error', {
            title: '訪問被拒絕',
            message: '您不是該伺服器的成員。'
        });
    }
    
    // 檢查用戶是否有管理伺服器的權限
    const isAdmin = (guild.permissions & 0x8) === 0x8;
    
    if (!isAdmin) {
        return res.status(403).render('error', {
            title: '訪問被拒絕',
            message: '您需要管理員權限才能管理此伺服器的抽獎活動。'
        });
    }
    
    next();
}

// 路由
app.get('/', (req, res) => {
    res.render('index', {
        title: 'GiveawayBot - Discord抽獎機器人',
        user: req.user
    });
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.render('login', {
        title: '登入 - GiveawayBot',
        message: req.flash('error')
    });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error('登出錯誤:', err);
        }
        res.redirect('/');
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    // 過濾用戶有管理權限的伺服器
    const adminGuilds = req.user.guilds.filter(guild => (guild.permissions & 0x8) === 0x8);
    
    res.render('dashboard', {
        title: '控制面板 - GiveawayBot',
        user: req.user,
        guilds: adminGuilds
    });
});

app.get('/guild/:guildId', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取伺服器的抽獎活動
        const giveaways = await Giveaway.find({ guildId });
        const activeGiveaways = giveaways.filter(g => !g.ended);
        const endedGiveaways = giveaways.filter(g => g.ended);
        
        // 獲取伺服器的模板
        const templates = Template.getAll(guildId);
        
        // 獲取伺服器的統計數據
        const stats = await updateGuildStats(guildId);
        
        res.render('guild', {
            title: `${guild.name} - GiveawayBot`,
            user: req.user,
            guild,
            activeGiveaways,
            endedGiveaways,
            templates,
            stats
        });
    } catch (error) {
        console.error('獲取伺服器數據時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取伺服器數據時出錯。'
        });
    }
});

app.get('/guild/:guildId/giveaway/new', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取伺服器的模板
        const templates = Template.getAll(guildId);
        
        // 獲取伺服器的頻道
        const guildChannels = await client.guilds.fetch(guildId)
            .then(g => g.channels.cache.filter(c => c.type === 0).map(c => ({
                id: c.id,
                name: c.name
            })));
        
        res.render('new-giveaway', {
            title: '創建抽獎 - GiveawayBot',
            user: req.user,
            guild,
            templates,
            channels: guildChannels
        });
    } catch (error) {
        console.error('獲取伺服器數據時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取伺服器數據時出錯。'
        });
    }
});

app.post('/guild/:guildId/giveaway/new', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    
    try {
        const {
            channelId,
            prize,
            winnerCount,
            duration,
            embedColor,
            reaction,
            requiredRoles,
            excludedRoles,
            requiredServerDays,
            minAccountAge,
            allowMultipleWinners,
            templateName
        } = req.body;
        
        // 創建抽獎
        const giveawayManager = require('../utils/giveawayManager');
        
        await giveawayManager.createGiveaway({
            guildId,
            channelId,
            prize,
            winnerCount: parseInt(winnerCount),
            duration,
            hostId: req.user.id,
            embedColor,
            reaction,
            requiredRoles: requiredRoles ? (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]) : [],
            excludedRoles: excludedRoles ? (Array.isArray(excludedRoles) ? excludedRoles : [excludedRoles]) : [],
            requiredServerDays: parseInt(requiredServerDays || 0),
            minAccountAge: parseInt(minAccountAge || 0),
            allowMultipleWinners: allowMultipleWinners === 'true',
            templateName: templateName || ''
        }, client);
        
        // 如果提供了模板名稱，保存為模板
        if (templateName && templateName.trim() !== '') {
            const template = new Template({
                name: templateName,
                guildId,
                creatorId: req.user.id,
                duration,
                winnerCount: parseInt(winnerCount),
                prize,
                embedColor,
                reaction,
                requiredRoles: requiredRoles ? (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]) : [],
                excludedRoles: excludedRoles ? (Array.isArray(excludedRoles) ? excludedRoles : [excludedRoles]) : [],
                requiredServerDays: parseInt(requiredServerDays || 0),
                minAccountAge: parseInt(minAccountAge || 0),
                allowMultipleWinners: allowMultipleWinners === 'true'
            });
            
            template.save();
        }
        
        res.redirect(`/guild/${guildId}`);
    } catch (error) {
        console.error('創建抽獎時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '創建抽獎時出錯: ' + error.message
        });
    }
});

app.get('/guild/:guildId/giveaway/:giveawayId', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    const giveawayId = req.params.giveawayId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取抽獎
        const giveaway = await Giveaway.findOne({ messageId: giveawayId });
        
        if (!giveaway) {
            return res.status(404).render('error', {
                title: '找不到抽獎',
                message: '找不到指定的抽獎活動。'
            });
        }
        
        // 獲取參與者信息
        const participantsInfo = [];
        const guildObj = await client.guilds.fetch(guildId);
        
        for (const participantId of giveaway.participants) {
            try {
                const member = await guildObj.members.fetch(participantId);
                participantsInfo.push({
                    id: participantId,
                    username: member.user.username,
                    displayName: member.displayName,
                    avatar: member.user.displayAvatarURL(),
                    isWinner: giveaway.winners.includes(participantId)
                });
            } catch (error) {
                console.error(`獲取成員信息時出錯 (${participantId}):`, error);
                participantsInfo.push({
                    id: participantId,
                    username: '未知用戶',
                    displayName: '未知用戶',
                    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
                    isWinner: giveaway.winners.includes(participantId)
                });
            }
        }
        
        res.render('giveaway-details', {
            title: `抽獎詳情: ${giveaway.prize} - GiveawayBot`,
            user: req.user,
            guild,
            giveaway,
            participants: participantsInfo
        });
    } catch (error) {
        console.error('獲取抽獎詳情時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取抽獎詳情時出錯: ' + error.message
        });
    }
});

app.get('/guild/:guildId/templates', isAuthenticated, isGuildAdmin, (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取伺服器的模板
        const templates = Template.getAll(guildId);
        
        res.render('templates', {
            title: '抽獎模板 - GiveawayBot',
            user: req.user,
            guild,
            templates
        });
    } catch (error) {
        console.error('獲取模板時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取模板時出錯: ' + error.message
        });
    }
});

app.get('/guild/:guildId/stats', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取伺服器的統計數據
        const stats = await updateGuildStats(guildId);
        
        res.render('stats', {
            title: '抽獎統計 - GiveawayBot',
            user: req.user,
            guild,
            stats
        });
    } catch (error) {
        console.error('獲取統計數據時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取統計數據時出錯: ' + error.message
        });
    }
});

app.get('/guild/:guildId/settings', isAuthenticated, isGuildAdmin, (req, res) => {
    const guildId = req.params.guildId;
    const guild = req.user.guilds.find(g => g.id === guildId);
    
    try {
        // 獲取伺服器的語言設置
        const language = getServerLanguage(guildId);
        
        // 獲取支持的語言列表
        const supportedLanguages = [
            { code: 'zh-TW', name: '繁體中文' },
            { code: 'zh-CN', name: '简体中文' },
            { code: 'en-US', name: 'English (US)' }
        ];
        
        res.render('settings', {
            title: '伺服器設置 - GiveawayBot',
            user: req.user,
            guild,
            language,
            supportedLanguages
        });
    } catch (error) {
        console.error('獲取設置時出錯:', error);
        res.status(500).render('error', {
            title: '錯誤',
            message: '獲取設置時出錯: ' + error.message
        });
    }
});

// API路由
app.get('/api/guild/:guildId/stats/chart', isAuthenticated, isGuildAdmin, async (req, res) => {
    const guildId = req.params.guildId;
    
    try {
        const chart = await generateParticipationChart(guildId);
        res.set('Content-Type', 'image/png');
        res.send(chart.attachment);
    } catch (error) {
        console.error('生成圖表時出錯:', error);
        res.status(500).json({ error: '生成圖表時出錯' });
    }
});

// 404頁面
app.use((req, res) => {
    res.status(404).render('error', {
        title: '頁面未找到',
        message: '您請求的頁面不存在。'
    });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: '伺服器錯誤',
        message: '發生了伺服器錯誤。'
    });
});

// 啟動伺服器
const PORT = process.env.WEB_PORT || 3000;

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log('Discord客戶端已登入');
    
    server.listen(PORT, () => {
        console.log(`Web控制面板已啟動: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Discord客戶端登入失敗:', error);
    process.exit(1);
});

// Socket.IO連接
io.on('connection', (socket) => {
    console.log('用戶已連接:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('用戶已斷開連接:', socket.id);
    });
});
