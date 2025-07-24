const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');

// 統計數據文件路徑
const statsFilePath = path.join(__dirname, '../../data/stats.json');

// 確保統計數據文件存在
function ensureStatsFile() {
    const dataDir = path.dirname(statsFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(statsFilePath)) {
        const defaultStats = {
            global: {
                totalGiveaways: 0,
                activeGiveaways: 0,
                completedGiveaways: 0,
                totalParticipants: 0,
                totalWinners: 0,
                averageParticipantsPerGiveaway: 0,
                averageJoinRate: 0,
                mostPopularPrize: '',
                mostActiveGuild: '',
                dailyStats: {},
                weeklyStats: {},
                monthlyStats: {}
            },
            guilds: {}
        };
        
        fs.writeFileSync(statsFilePath, JSON.stringify(defaultStats, null, 2));
        return defaultStats;
    }
    
    return JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
}

// 保存統計數據
function saveStats(stats) {
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
}

// 更新全局統計數據
async function updateGlobalStats() {
    const stats = ensureStatsFile();
    const Giveaway = require('../models/Giveaway');
    
    // 獲取所有抽獎
    const allGiveaways = await Giveaway.find();
    const activeGiveaways = allGiveaways.filter(g => !g.ended);
    const completedGiveaways = allGiveaways.filter(g => g.ended);
    
    // 計算總參與者和獲獎者
    let totalParticipants = 0;
    let totalWinners = 0;
    let totalJoinRate = 0;
    let prizeCount = {};
    let guildCount = {};
    
    allGiveaways.forEach(giveaway => {
        totalParticipants += giveaway.participants.length;
        totalWinners += giveaway.winners.length;
        
        if (giveaway.viewCount > 0) {
            totalJoinRate += (giveaway.participants.length / giveaway.viewCount) * 100;
        }
        
        // 計算最受歡迎的獎品
        if (giveaway.prize) {
            prizeCount[giveaway.prize] = (prizeCount[giveaway.prize] || 0) + 1;
        }
        
        // 計算最活躍的伺服器
        if (giveaway.guildId) {
            guildCount[giveaway.guildId] = (guildCount[giveaway.guildId] || 0) + 1;
        }
    });
    
    // 找出最受歡迎的獎品和最活躍的伺服器
    let mostPopularPrize = '';
    let maxPrizeCount = 0;
    for (const [prize, count] of Object.entries(prizeCount)) {
        if (count > maxPrizeCount) {
            mostPopularPrize = prize;
            maxPrizeCount = count;
        }
    }
    
    let mostActiveGuild = '';
    let maxGuildCount = 0;
    for (const [guildId, count] of Object.entries(guildCount)) {
        if (count > maxGuildCount) {
            mostActiveGuild = guildId;
            maxGuildCount = count;
        }
    }
    
    // 更新全局統計數據
    stats.global.totalGiveaways = allGiveaways.length;
    stats.global.activeGiveaways = activeGiveaways.length;
    stats.global.completedGiveaways = completedGiveaways.length;
    stats.global.totalParticipants = totalParticipants;
    stats.global.totalWinners = totalWinners;
    stats.global.averageParticipantsPerGiveaway = allGiveaways.length > 0 ? totalParticipants / allGiveaways.length : 0;
    stats.global.averageJoinRate = allGiveaways.length > 0 ? totalJoinRate / allGiveaways.length : 0;
    stats.global.mostPopularPrize = mostPopularPrize;
    stats.global.mostActiveGuild = mostActiveGuild;
    
    // 更新日期統計
    updateDateStats(stats, allGiveaways);
    
    saveStats(stats);
    return stats.global;
}

// 更新日期統計
function updateDateStats(stats, giveaways) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentWeek = getWeekNumber(now);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 初始化日期統計
    if (!stats.global.dailyStats) stats.global.dailyStats = {};
    if (!stats.global.weeklyStats) stats.global.weeklyStats = {};
    if (!stats.global.monthlyStats) stats.global.monthlyStats = {};
    
    // 初始化今天的統計
    if (!stats.global.dailyStats[today]) {
        stats.global.dailyStats[today] = {
            newGiveaways: 0,
            completedGiveaways: 0,
            participants: 0,
            winners: 0
        };
    }
    
    // 初始化本週的統計
    if (!stats.global.weeklyStats[currentWeek]) {
        stats.global.weeklyStats[currentWeek] = {
            newGiveaways: 0,
            completedGiveaways: 0,
            participants: 0,
            winners: 0
        };
    }
    
    // 初始化本月的統計
    if (!stats.global.monthlyStats[currentMonth]) {
        stats.global.monthlyStats[currentMonth] = {
            newGiveaways: 0,
            completedGiveaways: 0,
            participants: 0,
            winners: 0
        };
    }
    
    // 重置今天的統計
    stats.global.dailyStats[today] = {
        newGiveaways: 0,
        completedGiveaways: 0,
        participants: 0,
        winners: 0
    };
    
    // 重置本週的統計
    stats.global.weeklyStats[currentWeek] = {
        newGiveaways: 0,
        completedGiveaways: 0,
        participants: 0,
        winners: 0
    };
    
    // 重置本月的統計
    stats.global.monthlyStats[currentMonth] = {
        newGiveaways: 0,
        completedGiveaways: 0,
        participants: 0,
        winners: 0
    };
    
    // 更新統計數據
    giveaways.forEach(giveaway => {
        const startDate = new Date(giveaway.startAt);
        const startDay = startDate.toISOString().split('T')[0];
        const startWeek = getWeekNumber(startDate);
        const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        // 更新日統計
        if (startDay === today) {
            stats.global.dailyStats[today].newGiveaways++;
            stats.global.dailyStats[today].participants += giveaway.participants.length;
        }
        
        // 更新週統計
        if (startWeek === currentWeek) {
            stats.global.weeklyStats[currentWeek].newGiveaways++;
            stats.global.weeklyStats[currentWeek].participants += giveaway.participants.length;
        }
        
        // 更新月統計
        if (startMonth === currentMonth) {
            stats.global.monthlyStats[currentMonth].newGiveaways++;
            stats.global.monthlyStats[currentMonth].participants += giveaway.participants.length;
        }
        
        // 如果抽獎已結束，更新完成統計
        if (giveaway.ended) {
            const endDate = new Date(giveaway.endAt);
            const endDay = endDate.toISOString().split('T')[0];
            const endWeek = getWeekNumber(endDate);
            const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
            
            // 更新日統計
            if (endDay === today) {
                stats.global.dailyStats[today].completedGiveaways++;
                stats.global.dailyStats[today].winners += giveaway.winners.length;
            }
            
            // 更新週統計
            if (endWeek === currentWeek) {
                stats.global.weeklyStats[currentWeek].completedGiveaways++;
                stats.global.weeklyStats[currentWeek].winners += giveaway.winners.length;
            }
            
            // 更新月統計
            if (endMonth === currentMonth) {
                stats.global.monthlyStats[currentMonth].completedGiveaways++;
                stats.global.monthlyStats[currentMonth].winners += giveaway.winners.length;
            }
        }
    });
    
    // 清理舊數據（保留最近30天、12週和12個月的數據）
    cleanupOldStats(stats);
}

// 清理舊統計數據
function cleanupOldStats(stats) {
    // 保留最近30天的數據
    const dailyStats = stats.global.dailyStats;
    const dailyDates = Object.keys(dailyStats).sort();
    if (dailyDates.length > 30) {
        const datesToRemove = dailyDates.slice(0, dailyDates.length - 30);
        datesToRemove.forEach(date => {
            delete dailyStats[date];
        });
    }
    
    // 保留最近12週的數據
    const weeklyStats = stats.global.weeklyStats;
    const weeklyDates = Object.keys(weeklyStats).sort();
    if (weeklyDates.length > 12) {
        const weeksToRemove = weeklyDates.slice(0, weeklyDates.length - 12);
        weeksToRemove.forEach(week => {
            delete weeklyStats[week];
        });
    }
    
    // 保留最近12個月的數據
    const monthlyStats = stats.global.monthlyStats;
    const monthlyDates = Object.keys(monthlyStats).sort();
    if (monthlyDates.length > 12) {
        const monthsToRemove = monthlyDates.slice(0, monthlyDates.length - 12);
        monthsToRemove.forEach(month => {
            delete monthlyStats[month];
        });
    }
}

// 獲取週數
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
}

// 更新伺服器統計數據
async function updateGuildStats(guildId) {
    const stats = ensureStatsFile();
    const Giveaway = require('../models/Giveaway');
    
    // 初始化伺服器統計
    if (!stats.guilds[guildId]) {
        stats.guilds[guildId] = {
            totalGiveaways: 0,
            activeGiveaways: 0,
            completedGiveaways: 0,
            totalParticipants: 0,
            totalWinners: 0,
            averageParticipantsPerGiveaway: 0,
            averageJoinRate: 0,
            mostPopularPrize: '',
            topHosts: [],
            recentGiveaways: []
        };
    }
    
    // 獲取伺服器的所有抽獎
    const guildGiveaways = await Giveaway.find({ guildId });
    const activeGiveaways = guildGiveaways.filter(g => !g.ended);
    const completedGiveaways = guildGiveaways.filter(g => g.ended);
    
    // 計算總參與者和獲獎者
    let totalParticipants = 0;
    let totalWinners = 0;
    let totalJoinRate = 0;
    let prizeCount = {};
    let hostCount = {};
    
    guildGiveaways.forEach(giveaway => {
        totalParticipants += giveaway.participants.length;
        totalWinners += giveaway.winners.length;
        
        if (giveaway.viewCount > 0) {
            totalJoinRate += (giveaway.participants.length / giveaway.viewCount) * 100;
        }
        
        // 計算最受歡迎的獎品
        if (giveaway.prize) {
            prizeCount[giveaway.prize] = (prizeCount[giveaway.prize] || 0) + 1;
        }
        
        // 計算最活躍的主持人
        if (giveaway.hostId) {
            hostCount[giveaway.hostId] = (hostCount[giveaway.hostId] || 0) + 1;
        }
    });
    
    // 找出最受歡迎的獎品
    let mostPopularPrize = '';
    let maxPrizeCount = 0;
    for (const [prize, count] of Object.entries(prizeCount)) {
        if (count > maxPrizeCount) {
            mostPopularPrize = prize;
            maxPrizeCount = count;
        }
    }
    
    // 找出最活躍的主持人
    const topHosts = Object.entries(hostCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hostId, count]) => ({ hostId, count }));
    
    // 獲取最近的抽獎
    const recentGiveaways = guildGiveaways
        .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
        .slice(0, 5)
        .map(g => ({
            messageId: g.messageId,
            prize: g.prize,
            winnerCount: g.winnerCount,
            participants: g.participants.length,
            ended: g.ended,
            startAt: g.startAt,
            endAt: g.endAt
        }));
    
    // 更新伺服器統計數據
    stats.guilds[guildId].totalGiveaways = guildGiveaways.length;
    stats.guilds[guildId].activeGiveaways = activeGiveaways.length;
    stats.guilds[guildId].completedGiveaways = completedGiveaways.length;
    stats.guilds[guildId].totalParticipants = totalParticipants;
    stats.guilds[guildId].totalWinners = totalWinners;
    stats.guilds[guildId].averageParticipantsPerGiveaway = guildGiveaways.length > 0 ? totalParticipants / guildGiveaways.length : 0;
    stats.guilds[guildId].averageJoinRate = guildGiveaways.length > 0 ? totalJoinRate / guildGiveaways.length : 0;
    stats.guilds[guildId].mostPopularPrize = mostPopularPrize;
    stats.guilds[guildId].topHosts = topHosts;
    stats.guilds[guildId].recentGiveaways = recentGiveaways;
    
    saveStats(stats);
    return stats.guilds[guildId];
}

// 生成參與統計圖表
async function generateParticipationChart(guildId) {
    const Giveaway = require('../models/Giveaway');
    
    // 獲取伺服器的所有已完成抽獎
    const completedGiveaways = await Giveaway.find({ guildId, ended: true });
    
    // 按時間排序
    completedGiveaways.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    
    // 準備圖表數據
    const labels = completedGiveaways.map(g => g.prize.substring(0, 15) + (g.prize.length > 15 ? '...' : ''));
    const participantsData = completedGiveaways.map(g => g.participants.length);
    const winnersData = completedGiveaways.map(g => g.winners.length);
    const joinRateData = completedGiveaways.map(g => g.joinRate);
    
    // 創建圖表
    const width = 800;
    const height = 400;
    const chartCallback = (ChartJS) => {
        ChartJS.defaults.font.family = 'Arial';
        ChartJS.defaults.font.size = 14;
        ChartJS.defaults.color = '#666';
    };
    
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    
    const configuration = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '參與人數',
                    data: participantsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: '獲獎人數',
                    data: winnersData,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '抽獎參與統計',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '人數'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '抽獎獎品'
                    }
                }
            }
        }
    };
    
    // 生成圖表圖像
    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    
    // 創建Discord附件
    return new AttachmentBuilder(image, { name: 'participation-chart.png' });
}

// 生成參與率圖表
async function generateJoinRateChart(guildId) {
    const Giveaway = require('../models/Giveaway');
    
    // 獲取伺服器的所有已完成抽獎
    const completedGiveaways = await Giveaway.find({ guildId, ended: true });
    
    // 按時間排序
    completedGiveaways.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    
    // 準備圖表數據
    const labels = completedGiveaways.map(g => g.prize.substring(0, 15) + (g.prize.length > 15 ? '...' : ''));
    const joinRateData = completedGiveaways.map(g => g.joinRate);
    
    // 創建圖表
    const width = 800;
    const height = 400;
    const chartCallback = (ChartJS) => {
        ChartJS.defaults.font.family = 'Arial';
        ChartJS.defaults.font.size = 14;
        ChartJS.defaults.color = '#666';
    };
    
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    
    const configuration = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '參與率 (%)',
                    data: joinRateData,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '抽獎參與率統計',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '參與率 (%)'
                    },
                    max: 100
                },
                x: {
                    title: {
                        display: true,
                        text: '抽獎獎品'
                    }
                }
            }
        }
    };
    
    // 生成圖表圖像
    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    
    // 創建Discord附件
    return new AttachmentBuilder(image, { name: 'join-rate-chart.png' });
}

module.exports = {
    updateGlobalStats,
    updateGuildStats,
    generateParticipationChart,
    generateJoinRateChart
};
