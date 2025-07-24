FROM node:16-alpine

# 創建應用目錄
WORKDIR /usr/src/app

# 複製package.json和package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用代碼
COPY . .

# 創建數據目錄
RUN mkdir -p data

# 設置環境變量
ENV NODE_ENV=production

# 暴露端口（如果需要）
# EXPOSE 8080

# 啟動應用
CMD ["node", "index.js"]
