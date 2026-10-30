import { StudentData } from './sheets.js';

export class DiscordNotifier {
  
  /**
   * 通知メッセージを生成
   */
  private createMessage(discordId: string): any {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1;
    
    const mention = discordId ? `<@${discordId}>` : '';
    
    const content = `${mention}

# ▼休会申請について▼

平素よりWannaVでの学習に励んでいただきまして誠にありがとうございます。
休会の申請期限が近づいてまいりましたので、改めて休会についてお知らせいたします。
※尚、このメッセージは自動送信のため全生徒様にお送りさせていただいております。

## 【申請のタイミング】

休会をご希望される場合は、**【休会したい月の、前の月の15日】**までにお手続きの完了をお願いいたします。

## 【具体例】

${nextMonth}月から休会したい場合
申請期日：${currentMonth}月15日
この日までに申請が完了すると、${nextMonth}月1日から休会となります。
もし、${currentMonth}月16日以降に申請された場合
翌々月となる${monthAfterNext}月1日からの休会となりますので、ご注意ください。

## 【お手続きに関する大切なお願い】

お手続きをスムーズに進めるため、申請に必要なエビデンスは**【申請期日の3日前まで】**にご提出いただけますよう、ご協力をお願いいたします。

### **休会申請については担任の先生にご連絡ください！**`;

    return {
      content: content,
    };
  }
  
  /**
   * Discord Webhookに通知を送信
   */
  async sendNotification(student: StudentData): Promise<boolean> {
    let webhook: URL;
    try {
      webhook = new URL(student.webhookUrl);
      if (webhook.protocol !== 'https:' ||
          !['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com'].includes(webhook.hostname) ||
          webhook.port || webhook.username || webhook.password || webhook.search || webhook.hash ||
          !/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(webhook.pathname)) {
        throw new Error('Invalid webhook');
      }
    } catch {
      console.warn('通知先Webhookが未設定または不正です');
      return false;
    }
    if (!student.webhookUrl) {
      console.warn('通知先Webhookが設定されていません');
      return false;
    }
    
    try {
      const message = this.createMessage(student.discordId);
      
      const response = await fetch(webhook.href, {
        redirect: 'error',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      if (response.ok) {
        console.log('通知送信成功');
        return true;
      } else {
        console.error('通知送信失敗', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('通知送信エラー');
      return false;
    }
  }
  
  /**
   * 複数の生徒に通知を送信（レート制限対応）
   */
  async sendBulkNotifications(students: StudentData[]): Promise<void> {
    console.log(`\n=== 通知送信開始: ${students.length}人 ===\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
      const success = await this.sendNotification(student);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // レート制限対策: 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n=== 通知送信完了 ===`);
    console.log(`成功: ${successCount}人`);
    console.log(`失敗: ${failCount}人`);
  }
}
