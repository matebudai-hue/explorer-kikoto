import test from'node:test';
import assert from'node:assert/strict';
import{accountStorageKey,createCloudSync}from'../cloud-sync.mjs';
import{validatePublicConfig}from'../config.mjs';

test('accounts and cohorts never share a local save key',()=>{
 assert.notEqual(accountStorageKey('anna','9'),accountStorageKey('gabor','9'));
 assert.notEqual(accountStorageKey('anna','9'),accountStorageKey('anna','10'));
 assert.throws(()=>accountStorageKey('',null));
});
test('writes are serialized; pending edits use the returned revision and keep only the newest snapshot',async()=>{
 const calls=[];let release;
 const sync=createCloudSync({initialRevision:4,write:async(p,r)=>{calls.push([p,r]);if(calls.length===1)await new Promise(resolve=>release=resolve);return r+1;}});
 sync.enqueue({answer:1});const flushing=sync.flush();
 sync.enqueue({answer:2});sync.enqueue({answer:3});release();await flushing;
 assert.deepEqual(calls,[[{answer:1},4],[{answer:3},5]]);assert.equal(sync.revision,6);assert.equal(sync.dirty,false);
});
test('a failed request retains newer unsent work for retry',async()=>{
 let reject,first=true;const written=[];
 const sync=createCloudSync({write:async(p,r)=>{if(first){first=false;await new Promise((resolve,fail)=>reject=fail);}written.push(p);return r+1;}});
 sync.enqueue({room:'old'});const request=sync.flush();sync.enqueue({room:'new'});reject(Error('offline'));
 await assert.rejects(request);assert.equal(sync.dirty,true);await sync.flush();assert.deepEqual(written,[{room:'new'}]);
});
test('stale revisions stop writes instead of overwriting another device',async()=>{
 let calls=0;const statuses=[];
 const sync=createCloudSync({write:async()=>{calls++;throw Object.assign(Error('conflict'),{code:'40001'});},onStatus:s=>statuses.push(s.status)});
 sync.enqueue({answer:1});await assert.rejects(sync.flush());assert.equal(sync.blocked,true);assert.equal(sync.dirty,true);assert.throws(()=>sync.enqueue({answer:2}));await sync.flush();assert.equal(calls,1);assert.ok(statuses.includes('conflict'));
});
test('an unchanged snapshot is not sent repeatedly after success',async()=>{
 let calls=0;const sync=createCloudSync({write:async(p,r)=>{calls++;return r+1;}});
 sync.enqueue({a:1});await sync.flush();sync.enqueue({a:1});await sync.flush();assert.equal(calls,1);
});
test('secret and service role keys are refused before a browser client is created',()=>{
 assert.equal(validatePublicConfig({}),null);
 assert.throws(()=>validatePublicConfig({supabaseUrl:'https://example.supabase.co',publishableKey:'sb_secret_123'}));
 const jwt='eyJx.'+btoa(JSON.stringify({role:'service_role'}))+'.x';
 assert.throws(()=>validatePublicConfig({supabaseUrl:'https://example.supabase.co',publishableKey:jwt}));
 assert.equal(validatePublicConfig({supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test'}).supabaseUrl,'https://example.supabase.co');
});
