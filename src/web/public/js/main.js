// 等待DOM加載完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Bootstrap工具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // 初始化Bootstrap彈出框
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // 添加淡入動畫
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // 處理模板選擇
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            if (this.value) {
                loadTemplate(this.value);
            }
        });
    }
    
    // 處理顏色選擇器
    const colorPicker = document.getElementById('embed-color');
    if (colorPicker) {
        colorPicker.addEventListener('change', function() {
            const previewElement = document.getElementById('color-preview');
            if (previewElement) {
                previewElement.style.backgroundColor = this.value;
            }
        });
    }
    
    // 處理持續時間輸入
    const durationInput = document.getElementById('duration');
    const durationPreview = document.getElementById('duration-preview');
    if (durationInput && durationPreview) {
        durationInput.addEventListener('input', function() {
            updateDurationPreview(this.value);
        });
        
        // 初始更新
        if (durationInput.value) {
            updateDurationPreview(durationInput.value);
        }
    }
    
    // 處理抽獎表單提交
    const giveawayForm = document.getElementById('giveaway-form');
    if (giveawayForm) {
        giveawayForm.addEventListener('submit', function(e) {
            const prizeInput = document.getElementById('prize');
            const winnerCountInput = document.getElementById('winner-count');
            const durationInput = document.getElementById('duration');
            
            let isValid = true;
            
            // 驗證獎品
            if (!prizeInput.value.trim()) {
                showError(prizeInput, '請輸入獎品名稱');
                isValid = false;
            } else {
                clearError(prizeInput);
            }
            
            // 驗證獲獎人數
            const winnerCount = parseInt(winnerCountInput.value);
            if (isNaN(winnerCount) || winnerCount < 1) {
                showError(winnerCountInput, '獲獎人數必須是大於0的數字');
                isValid = false;
            } else {
                clearError(winnerCountInput);
            }
            
            // 驗證持續時間
            if (!isValidDuration(durationInput.value)) {
                showError(durationInput, '無效的持續時間格式。請使用數字後跟S/M/H/D，例如: 1h, 30m, 2d');
                isValid = false;
            } else {
                clearError(durationInput);
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }
    
    // 處理統計圖表
    const participationChartCanvas = document.getElementById('participation-chart');
    if (participationChartCanvas) {
        renderParticipationChart(participationChartCanvas);
    }
    
    const joinRateChartCanvas = document.getElementById('join-rate-chart');
    if (joinRateChartCanvas) {
        renderJoinRateChart(joinRateChartCanvas);
    }
    
    // 處理設置表單
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            // 可以添加設置表單的驗證邏輯
        });
    }
    
    // 處理Socket.IO連接
    if (typeof io !== 'undefined') {
        const socket = io();
        
        socket.on('connect', function() {
            console.log('已連接到伺服器');
        });
        
        socket.on('giveaway-created', function(data) {
            showNotification('新抽獎活動', `抽獎活動 "${data.prize}" 已創建！`);
            if (window.location.pathname.includes('/guild/' + data.guildId)) {
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
        
        socket.on('giveaway-ended', function(data) {
            showNotification('抽獎已結束', `抽獎活動 "${data.prize}" 已結束！`);
            if (window.location.pathname.includes('/guild/' + data.guildId)) {
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
    }
});

// 加載模板數據
function loadTemplate(templateName) {
    fetch(`/api/template/${templateName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const template = data.template;
                
                // 填充表單字段
                document.getElementById('prize').value = template.prize || '';
                document.getElementById('winner-count').value = template.winnerCount || 1;
                document.getElementById('duration').value = template.duration || '1d';
                
                if (template.embedColor) {
                    const colorPicker = document.getElementById('embed-color');
                    colorPicker.value = template.embedColor;
                    const previewElement = document.getElementById('color-preview');
                    if (previewElement) {
                        previewElement.style.backgroundColor = template.embedColor;
                    }
                }
                
                if (template.reaction) {
                    document.getElementById('reaction').value = template.reaction;
                }
                
                // 更新持續時間預覽
                updateDurationPreview(template.duration);
                
                // 處理角色選擇
                if (template.requiredRoles && template.requiredRoles.length > 0) {
                    const requiredRolesSelect = document.getElementById('required-roles');
                    if (requiredRolesSelect) {
                        for (const roleId of template.requiredRoles) {
                            for (const option of requiredRolesSelect.options) {
                                if (option.value === roleId) {
                                    option.selected = true;
                                }
                            }
                        }
                    }
                }
                
                if (template.excludedRoles && template.excludedRoles.length > 0) {
                    const excludedRolesSelect = document.getElementById('excluded-roles');
                    if (excludedRolesSelect) {
                        for (const roleId of template.excludedRoles) {
                            for (const option of excludedRolesSelect.options) {
                                if (option.value === roleId) {
                                    option.selected = true;
                                }
                            }
                        }
                    }
                }
                
                // 處理其他設置
                if (template.requiredServerDays) {
                    document.getElementById('required-server-days').value = template.requiredServerDays;
                }
                
                if (template.minAccountAge) {
                    document.getElementById('min-account-age').value = template.minAccountAge;
                }
                
                if (template.allowMultipleWinners !== undefined) {
                    document.getElementById('allow-multiple-winners').checked = template.allowMultipleWinners;
                }
            } else {
                alert('加載模板時出錯: ' + data.error);
            }
        })
        .catch(error => {
            console.error('加載模板時出錯:', error);
            alert('加載模板時出錯。請稍後再試。');
        });
}

// 更新持續時間預覽
function updateDurationPreview(durationStr) {
    const durationPreview = document.getElementById('duration-preview');
    if (!durationPreview) return;
    
    if (!isValidDuration(durationStr)) {
        durationPreview.textContent = '無效的持續時間格式';
        return;
    }
    
    const now = new Date();
    const endTime = new Date(now.getTime() + parseDuration(durationStr));
    
    durationPreview.textContent = `抽獎將於 ${endTime.toLocaleString()} 結束`;
}

// 解析持續時間字符串
function parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)([smhd])$/i);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 's': return value * 1000; // 秒
        case 'm': return value * 60 * 1000; // 分鐘
        case 'h': return value * 60 * 60 * 1000; // 小時
        case 'd': return value * 24 * 60 * 60 * 1000; // 天
        default: return 0;
    }
}

// 驗證持續時間格式
function isValidDuration(durationStr) {
    return /^\d+[smhd]$/i.test(durationStr);
}

// 顯示表單錯誤
function showError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    
    let errorElement = inputElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    errorElement.textContent = message;
}

// 清除表單錯誤
function clearError(inputElement) {
    inputElement.classList.remove('is-invalid');
    
    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('invalid-feedback')) {
        errorElement.textContent = '';
    }
}

// 顯示通知
function showNotification(title, message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    }
    
    // 同時顯示瀏覽器內通知
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = 'toast show';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <small>剛剛</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    // 5秒後自動關閉
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// 渲染參與統計圖表
function renderParticipationChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // 從數據屬性獲取數據
    const labels = JSON.parse(canvas.dataset.labels || '[]');
    const participantsData = JSON.parse(canvas.dataset.participants || '[]');
    const winnersData = JSON.parse(canvas.dataset.winners || '[]');
    
    new Chart(ctx, {
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
    });
}

// 渲染參與率圖表
function renderJoinRateChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // 從數據屬性獲取數據
    const labels = JSON.parse(canvas.dataset.labels || '[]');
    const joinRateData = JSON.parse(canvas.dataset.joinRate || '[]');
    
    new Chart(ctx, {
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
    });
}
