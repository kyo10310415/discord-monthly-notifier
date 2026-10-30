import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./send-test.ts',import.meta.url),'utf8');
function fixture(env){
 const logs=[];const sent=[];
 const context=vm.createContext({process:{env},console:{log:(...v)=>logs.push(v.join(' '))},DiscordNotifier:class {async sendNotification(student){sent.push(student);return true;}}});
 const code=source.replace(/^import .*;$/gm,'').replace('const testStudent: StudentData','const testStudent').split('runTest().catch')[0];
 return {logs,sent,run:()=>vm.runInContext(`(async()=>{${code};await runTest();})()`,context)};
}
test('missing explicit test webhook refuses before notifier send',async()=>{
 const f=fixture({});await assert.rejects(f.run(),/DISCORD_TEST_WEBHOOK_URL must be configured/);assert.equal(f.sent.length,0);
});
test('explicit synthetic configuration reaches fake notifier without logging webhook',async()=>{
 const value='synthetic-private-destination';const f=fixture({DISCORD_TEST_WEBHOOK_URL:value});await f.run();assert.equal(f.sent.length,1);assert.equal(f.sent[0].webhookUrl,value);assert.equal(f.logs.some(l=>l.includes(value)),false);
});
test('manual notification script contains no committed Discord webhook credential',()=>{
 assert.doesNotMatch(source,/https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/);
});
