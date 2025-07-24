# Discord抽獎機器人

一個功能強大的Discord抽獎機器人，可以幫助您在伺服器中舉辦各種抽獎活動。無論是贈送遊戲、禮品卡還是特殊角色，GiveawayBot都能讓抽獎過程變得簡單而有趣。

## 功能特點

- **簡單易用**：使用斜線命令，只需幾秒鐘即可設置抽獎活動
- **高度可定制**：自定義抽獎持續時間、獲獎人數、嵌入顏色、參與要求等
- **多語言支持**：支持繁體中文、簡體中文和英文
- **抽獎模板**：保存常用的抽獎設置為模板，以便將來重複使用
- **參與條件**：設置角色要求、伺服器加入時間要求和Discord帳戶年齡要求
- **詳細統計**：查看參與率、完成率和其他有價值的統計數據
- **Web控制面板**：通過網頁界面輕鬆管理抽獎活動

## 命令列表

| 命令 | 描述 |
|------|------|
| `/ghelp` | 顯示可用的命令 |
| `/gabout` | 顯示有關機器人的信息 |
| `/gping` | 檢查機器人是否在線 |
| `/ginvite` | 顯示將機器人添加到伺服器的邀請連結 |
| `/gcreate` | 創建抽獎（交互式設置） |
| `/gstart <duration> <winners> <prize>` | 快速開始抽獎 |
| `/gend <giveaway_id>` | 結束指定的抽獎並立即抽出中獎者 |
| `/gdelete <giveaway_id>` | 刪除指定的抽獎而不抽出中獎者 |
| `/glist` | 列出伺服器上所有當前運行的抽獎 |
| `/greroll <giveaway_id>` | 從指定的抽獎中重新抽出一個新的中獎者 |
| `/gsettings show` | 顯示GiveawayBot的當前設置 |
| `/gsettings set color <hex>` | 設置抽獎的嵌入顏色 |
| `/gsettings set emoji <emoji>` | 設置抽獎按鈕所使用的表情符號 |

## 安裝指南

### 前提條件

- [Node.js](https://nodejs.org/) v16.9.0或更高版本
- [npm](https://www.npmjs.com/) v7或更高版本
- [Discord應用程序](https://discord.com/developers/applications)，已啟用機器人功能

### 安裝步驟

1. 克隆此倉庫：
   ```bash
   git clone https://github.com/yourusername/giveaway-bot.git
   cd giveaway-bot
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 複製`.env.example`文件並重命名為`.env`：
   ```bash
   cp .env.example .env
   ```

4. 編輯`.env`文件，填入您的Discord機器人令牌和其他必要信息。

5. 註冊斜線命令：
   ```bash
   npm run register
   ```

6. 啟動機器人：
   ```bash
   npm start
   ```

### 使用Docker

1. 構建Docker映像：
   ```bash
   docker build -t giveaway-bot .
   ```

2. 運行Docker容器：
   ```bash
   docker run -d --name giveaway-bot --env-file .env giveaway-bot
   ```

或者使用Docker Compose：
   ```bash
   docker-compose up -d
   ```

## Web控制面板

GiveawayBot包含一個Web控制面板，可以通過網頁界面輕鬆管理抽獎活動。

### 啟動Web控制面板

```bash
npm run web
```

默認情況下，Web控制面板將在`http://localhost:3000`上運行。您可以在`.env`文件中通過`WEB_PORT`變量更改端口。

### 控制面板功能

- 查看和管理所有抽獎活動
- 創建新的抽獎活動
- 管理抽獎模板
- 查看詳細的統計數據
- 更改伺服器設置

## 使用指南

### 創建抽獎

使用`/gcreate`命令啟動交互式設置過程：

1. 輸入抽獎活動的限制時間，例如`1h`（1小時）、`30m`（30分鐘）或`2d`（2天）
2. 輸入獲獎人數，例如`3`
3. 輸入獎品名稱，例如`Steam遊戲禮品卡`

或者使用`/gstart`命令快速創建抽獎：

```
/gstart 1h 3 Steam遊戲禮品卡
```

### 結束抽獎

使用`/gend`命令結束抽獎並立即抽出獲獎者：

```
/gend 123456789012345678
```

其中`123456789012345678`是抽獎消息的ID。您可以右鍵點擊抽獎消息，選擇"複製消息ID"來獲取ID。

### 重新抽取獲獎者

如果需要重新抽取獲獎者，可以使用`/greroll`命令：

```
/greroll 123456789012345678
```

## 貢獻

歡迎貢獻！如果您有任何改進建議或發現了錯誤，請提交問題或拉取請求。

## 許可證

本項目採用MIT許可證 - 有關詳細信息，請參閱[LICENSE](LICENSE)文件。
