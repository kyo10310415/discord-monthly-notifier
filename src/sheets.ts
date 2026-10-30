import { google } from 'googleapis';

export interface StudentData {
  name: string;            // B列: お名前
  plan: string;            // C列: プラン
  status: string;          // D列: 会員ステータス
  discordId: string;       // G列: Discord ID
  webhookUrl: string;      // H列: お知らせ_WH
}

export class GoogleSheetsService {
  private sheets;
  
  constructor(credentials: any) {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth });
  }
  
  async getStudentData(spreadsheetId: string, sheetName: string): Promise<StudentData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:H`, // ヘッダー行を除外してA2から開始
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('データが見つかりません');
        return [];
      }
      
      const students: StudentData[] = [];
      
      for (const row of rows) {
        const name = row[1] || '';          // B列
        const plan = row[2] || '';          // C列
        const status = row[3] || '';        // D列
        const discordId = row[6] || '';     // G列
        const webhookUrl = row[7] || '';    // H列
        
        // 条件チェック: アクティブ && 永久会員以外
        if (status === 'アクティブ' && plan !== '永久会員') {
          students.push({
            name,
            plan,
            status,
            discordId,
            webhookUrl,
          });
        }
      }
      
      console.log(`対象生徒数: ${students.length}人`);
      return students;
      
    } catch (error) {
      console.error('Google Sheets APIエラー');
      throw error;
    }
  }
}
