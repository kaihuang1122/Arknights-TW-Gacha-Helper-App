# Arknights-TW-Gacha-Helper-App

行動端的明日方舟抽卡紀錄分析助手，基於 React Native (Expo) 開發的 WebView 自動化提取工具。

## 🎯 核心功能
* 自動載入鷹角官方登入頁面
* 利用注入腳本背景攔截並提取 `ak-user-tw` 與 localStorage 的 `X-Role-Token`
* 無縫生成資料表單並 POST 至分析網站，達成在手機上一鍵獲取抽卡紀錄的順暢體驗。

## 🚀 開發與執行

### 本機開發測試 (Expo Go)
```bash
npm install
npm start
```
掃描終端機出現的 QR Code，即可透過手機上的 Expo Go App 進行即時預覽與測試。

### 自動化編譯 (GitHub Actions)
本專案已配置完整的 GitHub CI/CD 工作流程，不需在本機建置 Android 開發環境！

只要發布包含版本號標籤 (Tag) 的提交，GitHub 伺服器就會自動幫您打包成 `.apk` 檔，並發布在 Releases 頁面：
```bash
# 給當前進度打上 v1.0.0 標籤
git tag v1.0.0

# 將標籤推送到 GitHub (將觸發自動編譯與發布)
git push origin v1.0.0
```
約 3 分鐘後，即可在 GitHub 的 Releases 區塊下載 `Arknights-Gacha-Helper-v1.0.0.apk`。
