# Discord 月次通知システム

## 概要

毎月5日の19時（JST）に、Google Sheetsの生徒情報を元にDiscordへ自動通知を送信するシステムです。

## 機能

- ✅ 毎月5日 19:00（JST）に自動実行
- ✅ Google Sheets APIから生徒情報を取得
- ✅ 条件に合致する生徒のみにDiscord通知
- ✅ 個別のWebhook URLとDiscord IDに対応

## 通知条件

以下の条件を**すべて満たす**生徒に通知を送信します：

- D列（会員ステータス）が「アクティブ」
- C列（プラン）が「永久会員」**以外**

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js 18+
- **スケジューラ**: node-cron
- **API**: Google Sheets API v4, Discord Webhook
- **デプロイ**: Render (Background Worker)

## ディレクトリ構造

```
discord-monthly-notifier/
├── src/
│   ├── index.ts       # メインエントリーポイント、Cron設定
│   ├── sheets.ts      # Google Sheets API連携
│   └── discord.ts     # Discord Webhook送信
├── dist/              # TypeScriptコンパイル後のJSファイル
├── .env               # 環境変数（ローカル開発用）
├── .env.example       # 環境変数のサンプル
├── package.json       # 依存関係とスクリプト
├── tsconfig.json      # TypeScript設定
├── render.yaml        # Render設定ファイル
└── README.md          # このファイル
```

## セットアップ手順

### 1. Google Sheets API認証設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Google Sheets APIを有効化
3. サービスアカウントを作成し、JSONキーをダウンロード
4. スプレッドシートに、サービスアカウントのメールアドレスを**編集者**として共有

### 2. 環境変数の設定

以下の環境変数が必要です：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GOOGLE_SHEETS_CREDENTIALS` | サービスアカウントのJSON（文字列化） | `'{"type":"service_account",...}'` |
| `SPREADSHEET_ID` | Google SheetsのID | `1iqrAhNjW8jTvobkur5N_9r9uUWFHCKqrhxM72X5z-iM` |
| `SHEET_NAME` | シート名 | `❶RAW_生徒様情報` |

### 3. ローカルでのテスト

```bash
# 依存関係をインストール
npm install

# ビルド
npm run build

# テストモードで即座に実行（Cronを待たずに動作確認）
npm run test

# 本番モード起動（Cronジョブが動作）
npm start
```

## Renderへのデプロイ手順

### 事前準備

1. ✅ GitHubアカウント
2. ✅ Renderアカウント（無料プランでOK）
3. ✅ Google Sheets APIサービスアカウントJSON

### デプロイ手順

#### Step 1: GitHubにプッシュ

```bash
# リポジトリをGitHubにプッシュ
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/discord-monthly-notifier.git
git push -u origin main
```

#### Step 2: Renderでサービス作成

1. [Render Dashboard](https://dashboard.render.com/)にログイン
2. 「New +」→「Background Worker」を選択
3. GitHubリポジトリを接続
4. 以下の設定を入力：

**基本設定:**
- **Name**: `discord-monthly-notifier`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` または任意
- **Branch**: `main`

**ビルド＆起動設定:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**プラン:**
- **Instance Type**: `Free` または `Starter`（$7/月）

#### Step 3: 環境変数を設定

Renderダッシュボードで以下の環境変数を追加：

1. `GOOGLE_SHEETS_CREDENTIALS`
   - サービスアカウントのJSONファイル全体を**1行の文字列**として貼り付け
   - 例: `{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}`

2. `SPREADSHEET_ID`
   - 値: `1iqrAhNjW8jTvobkur5N_9r9uUWFHCKqrhxM72X5z-iM`

3. `SHEET_NAME`
   - 値: `❶RAW_生徒様情報`

4. `NODE_ENV`（オプション）
   - 値: `production`

#### Step 4: デプロイ実行

「Create Background Worker」ボタンをクリックすると、自動的にデプロイが開始されます。

### デプロイ後の確認

1. Renderのログで起動メッセージを確認：
   ```
   🚀 Discord通知サービスを起動しました
   スケジュール: 毎月5日 19:00 (JST)
   ✓ Cronジョブが設定されました
   サービスは常時稼働しています...
   ```

2. 手動テスト（オプション）：
   - Renderのダッシュボードで「Manual Deploy」→「Deploy latest commit」

## トラブルシューティング

### Q: 通知が送信されない

1. **Renderのログを確認**
   - ダッシュボードの「Logs」タブで実行ログを確認
   - エラーメッセージがある場合は内容を確認

2. **環境変数を確認**
   - `GOOGLE_SHEETS_CREDENTIALS`が正しく設定されているか
   - JSONの改行文字（`\n`）が正しくエスケープされているか

3. **スプレッドシートの権限確認**
   - サービスアカウントがスプレッドシートに編集者としてアクセスできるか

4. **Discord Webhook URLの確認**
   - H列のWebhook URLが有効か
   - テストでcURLなどから手動送信できるか

### Q: Renderのログが見つからない

- Background Workerの場合、標準出力がRenderのログに表示されます
- リアルタイムで確認するには「Logs」タブを開いてください

### Q: タイムゾーンが正しく動作しない

- Cronジョブは`Asia/Tokyo`タイムゾーンで設定されています
- Renderのサーバー時刻がUTCでも、Cronが正しく19:00 JSTに実行されます

## テスト実行

即座に通知を送信してテストする場合：

```bash
npm run test
```

このコマンドはCronを待たずに通知処理を実行します。

## 料金について

### Render無料プラン
- Background Workerは**750時間/月まで無料**
- 1つのWorkerが常時稼働してもほぼ無料枠内で運用可能
- 超過した場合は自動停止（有料プランへのアップグレードが必要）

### 有料プランの検討
- より確実な稼働を望む場合は**Starter ($7/月)**を推奨

## 更新方法

コードを更新してGitHubにプッシュするだけで、Renderが自動的に再デプロイします：

```bash
git add .
git commit -m "Update notification logic"
git push origin main
```

## サポート

問題が発生した場合は、Renderのログとエラーメッセージを確認してください。

---

**作成日**: 2026-01-03  
**バージョン**: 1.0.0
