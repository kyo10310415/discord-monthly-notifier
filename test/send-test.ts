import { DiscordNotifier } from '../src/discord.js';
import { StudentData } from '../src/sheets.js';

const webhookUrl = process.env.DISCORD_TEST_WEBHOOK_URL;
if (!webhookUrl) throw new Error('DISCORD_TEST_WEBHOOK_URL must be configured for an explicit notification test');

// テスト用の生徒データ
const testStudent: StudentData = {
  name: 'テストユーザー',
  plan: '通常プラン',
  status: 'アクティブ',
  discordId: '',  // メンションなし（または実際のDiscord IDを入力）
  webhookUrl
};

async function runTest() {
  console.log('=================================');
  console.log('Discord通知テストを開始します');
  console.log('=================================\n');
  
  console.log('テスト対象:');
  console.log(`  名前: ${testStudent.name}`);
  console.log(`  プラン: ${testStudent.plan}`);
  console.log(`  ステータス: ${testStudent.status}`);
  console.log('');
  
  const notifier = new DiscordNotifier();
  
  console.log('通知を送信中...\n');
  const success = await notifier.sendNotification(testStudent);
  
  if (success) {
    console.log('\n✅ テスト送信が成功しました！');
    console.log('Discordを確認してください。');
  } else {
    console.log('\n❌ テスト送信が失敗しました。');
    console.log('Webhook URLが正しいか確認してください。');
  }
}

runTest().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
