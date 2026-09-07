import assert from 'node:assert/strict';
const base=process.env.ASTRO_TEST_URL||'http://localhost:3000';
const password=process.env.ASTRO_DEMO_PASSWORD;
if(!password)throw Error('Set ASTRO_DEMO_PASSWORD for the two local demo accounts.');
async function request(path,method='GET',body,cookie='',origin=base){return fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});}
assert.equal((await request('/api/catalog')).status,401);
assert.equal((await request('/api/account','POST',{username:'user1',password:'wrong'})).status,401);
assert.equal((await request('/api/account','POST',{username:'user1',password},'','https://other.example')).status,403);
async function login(username){const r=await request('/api/account','POST',{username,password});assert.equal(r.status,200,await r.clone().text());const raw=r.headers.get('set-cookie');assert.ok(raw.includes('HttpOnly'));assert.ok(raw.includes('SameSite=Lax'));return raw.split(';')[0];}
const first=await login('user1'),second=await login('user2');
assert.equal((await (await request('/api/account','GET',null,first)).json()).username,'user1');
const id='account-check-'+Date.now();
assert.equal((await request('/api/catalog','POST',{action:'discover',id,name:'Account isolation check',type:'Star'},first)).status,200);
assert.equal((await request('/api/catalog','POST',{action:'update',id,patch:{note:'Only user1 can read this note',saved:true,observationStatus:'planned',observationDate:'2026-09-09'}},first)).status,200);
const records=async cookie=>(await (await request('/api/catalog','GET',null,cookie)).json()).records;
assert.equal((await records(first)).find(r=>r.id===id).note,'Only user1 can read this note');
assert.ok(!(await records(second)).some(r=>r.id===id));
assert.equal((await request('/api/catalog','POST',{action:'update',id,username:'user1',patch:{note:'Not allowed'}},second)).status,404);
assert.equal((await request('/api/catalog','POST',{action:'update',id,patch:{note:'x'.repeat(4001)}},first)).status,400);
assert.equal((await request('/api/catalog','POST',{action:'update',id,patch:{note:'Not allowed'}},first,'https://other.example')).status,403);
const reloaded=await login('user1');assert.ok((await records(reloaded)).some(r=>r.id===id));
assert.equal((await request('/api/account','DELETE',null,first)).status,200);
assert.equal((await request('/api/catalog','GET',null,first)).status,401);
assert.equal((await request('/api/catalog','GET',null,'astroguide_session='+'a'.repeat(64))).status,401);
console.log('PASS: both demo sign-ins, password rejection, HTTP-only cookies, cross-origin rejection, durable catalog retrieval, user isolation, input validation, forged-session rejection, and logout revocation.');
