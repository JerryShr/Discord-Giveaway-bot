# Discord抽獎機器人

一個功能完整的Discord抽獎機器人，可以輕鬆創建和管理抽獎活動。

## 功能

- 顯示所有的指令
- 顯示將機器人添加到伺服器的邀請連結
- 創建抽獎（交互式設置）
- 快速開始抽獎
- 結束指定的抽獎並立即抽出中獎者
- 刪除指定的抽獎而不抽出中獎者
- 列出伺服器上所有當前運行的抽獎
- 從指定的抽獎中重新抽出一個新的中獎者
- 顯示機器人的當前設置
- 設置抽獎的嵌入顏色
- 設置抽獎按鈕所使用的表情符號
- 啟動時一同註冊應用程式指令

## 安裝

1. 克隆此倉庫
2. 安裝依賴項：
   ```
   npm install
   ```
3. 在 `config.json` 文件中填入您的機器人令牌和客戶端ID

## 配置

在 `config.json` 文件中編輯以下設置：

```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "guildId": "YOUR_GUILD_ID_HERE",
  "embedColor": "#FF5733",
  "emoji": "🎉",
  "defaultDuration": "1d",
  "defaultWinners": 1,
  "database": {
    "path": "./database.sqlite"
  },
  "registerGlobally": false
}
```

- `token`: 您的Discord機器人令牌
- `clientId`: 您的Discord應用程式ID
- `guildId`: 您想要註冊命令的伺服器ID（僅在 `registerGlobally` 為 false 時使用）
- `embedColor`: 抽獎嵌入的顏色
- `emoji`: 抽獎按鈕使用的表情符號
- `defaultDuration`: 預設抽獎持續時間
- `defaultWinners`: 預設獲獎者數量
- `database.path`: 數據庫文件的路徑
- `registerGlobally`: 是否全局註冊命令
  - `true`: 命令將在所有伺服器中可用，但更新可能需要1小時
  - `false`: 命令僅在指定的 `guildId` 伺服器中可用，更新立即生效

## 使用方法

1. 啟動機器人：
   ```
   npm start
   ```

2. 使用以下斜線命令：

   - `/help` - 顯示所有可用的指令
   - `/invite` - 顯示將機器人添加到伺服器的邀請連結
   - `/create` - 創建一個新的抽獎（交互式設置）
   - `/quick [獎品] (持續時間) (獲獎者數量) (描述)` - 快速開始抽獎
   - `/end [消息ID]` - 結束指定的抽獎並立即抽出中獎者
   - `/delete [消息ID]` - 刪除指定的抽獎而不抽出中獎者
   - `/list` - 列出伺服器上所有當前運行的抽獎
   - `/reroll [消息ID] (數量)` - 從指定的抽獎中重新抽出新的中獎者
   - `/settings` - 顯示機器人的當前設置
   - `/setcolor [顏色代碼]` - 設置抽獎的嵌入顏色
   - `/setemoji [表情符號]` - 設置抽獎按鈕所使用的表情符號

## 獲取消息ID

要獲取抽獎消息的ID（用於 `/end`、`/delete` 和 `/reroll` 命令），請按照以下步驟操作：

1. 在Discord設置中啟用開發者模式（用戶設置 > 進階 > 開發者模式）
2. 右鍵點擊抽獎消息
3. 選擇"複製ID"

## 注意事項

- 機器人需要 `SEND_MESSAGES`、`EMBED_LINKS` 和 `USE_EXTERNAL_EMOJIS` 權限才能正常運作
- 抽獎數據存儲在本地SQLite數據庫中
- 機器人會自動檢查並結束已到期的抽獎

## 許可證

MIT
