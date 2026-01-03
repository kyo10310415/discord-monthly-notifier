import cron from 'node-cron';
import dotenv from 'dotenv';
import { GoogleSheetsService } from './sheets.js';
import { DiscordNotifier } from './discord.js';

// 環境変数を読み込み
dotenv.config();

// 環境変数の検証
function validateEnv() {
  const required = [
    'GOOGLE_SHEETS_CREDENTIALS',
    'SPREADSHEET_ID',
    'SHEET_NAME'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ 必須の環境変数が設定されていません:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
}

// 通知処理のメイン関数
async function runNotification() {
  try {
    console.log('\n========================================');
    console.log('通知処理を開始します');
    console.log(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
    console.log('========================================\n');
    
    // Google Sheets APIの初期化
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!);
    const sheetsService = new GoogleSheetsService(credentials);
    
    // スプレッドシートからデータ取得
    const spreadsheetId = process.env.SPREADSHEET_ID!;
    const sheetName = process.env.SHEET_NAME!;
    
    console.log(`スプレッドシートID: ${spreadsheetId}`);
    console.log(`シート名: ${sheetName}\n`);
    
    const students = await sheetsService.getStudentData(spreadsheetId, sheetName);
    
    if (students.length === 0) {
      console.log('通知対象の生徒が見つかりませんでした');
      return;
    }
    
    // Discord通知送信
    const notifier = new DiscordNotifier();
    await notifier.sendBulkNotifications(students);
    
    console.log('\n通知処理が完了しました\n');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

// メイン処理
async function main() {
  validateEnv();
  
  const isTestMode = process.argv.includes('--test');
  
  if (isTestMode) {
    console.log('🧪 テストモード: 即座に通知を実行します\n');
    await runNotification();
    process.exit(0);
  }
  
  console.log('🚀 Discord通知サービスを起動しました');
  console.log('スケジュール: 毎月5日 19:00 (JST)');
  console.log('タイムゾーン: Asia/Tokyo\n');
  
  // Cronジョブの設定: 毎月5日の19時（JST）に実行
  // '0 19 5 * *' = 分 時 日 月 曜日
  cron.schedule('0 19 5 * *', async () => {
    await runNotification();
  }, {
    scheduled: true,
    timezone: 'Asia/Tokyo'
  });
  
  console.log('✓ Cronジョブが設定されました');
  console.log('サービスは常時稼働しています...\n');
  
  // プロセスを維持
  process.on('SIGTERM', () => {
    console.log('サービスを終了します');
    process.exit(0);
  });
}

// アプリケーション起動
main().catch(error => {
  console.error('致命的なエラー:', error);
  process.exit(1);
});
