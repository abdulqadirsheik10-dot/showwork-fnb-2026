import {env} from 'cloudflare:workers';
const HOUR=3600000,DAY=24*HOUR;
export function db(){return (env as unknown as {DB:D1Database}).DB}
export function json(data:unknown,status=200,extra:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}})}
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
export function token(){return crypto.randomUUID()+crypto.randomUUID()}
export function originOK(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===new URL(req.url).origin}
export async function owner(req:Request){const value=req.headers.get('cookie')?.match(/(?:^|;\s*)sw_session=([a-f0-9-]{72})/)?.[1];if(!value)return null;const id=await hash(value);const row=await db().prepare('SELECT id FROM sessions WHERE id=? AND expires>?').bind(id,Date.now()).first();return row?id:null}
export async function quota(key:string,max:number,period=DAY){const bucket=Math.floor(Date.now()/period);const k=key+':'+bucket;const result=await db().prepare('INSERT INTO limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(k,(bucket+2)*period,max).first();return !!result}
export async function newSession(req:Request){
 const ip=req.headers.get('cf-connecting-ip')||'local';
 if(!await quota('new:'+await hash(ip),20,HOUR)||!await quota('new-global',5000))return json({error:'The demo is busy. Please try again later.'},429);
 const raw=token(),id=await hash(raw),now=Date.now();
 await db().batch([db().prepare('DELETE FROM attempts WHERE owner IN (SELECT id FROM sessions WHERE expires<?)').bind(now),db().prepare('DELETE FROM shares WHERE owner IN (SELECT id FROM sessions WHERE expires<?)').bind(now),db().prepare('DELETE FROM sessions WHERE expires<?').bind(now),db().prepare('DELETE FROM limits WHERE expires<?').bind(now),db().prepare('INSERT INTO sessions(id,created,expires) VALUES (?,?,?)').bind(id,now,now+7*DAY)]);
 return json({ok:true},200,{'Set-Cookie':`sw_session=${raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${new URL(req.url).protocol==='https:'?'; Secure':''}`});
}
export async function body(req:Request){if(Number(req.headers.get('content-length')||0)>16000)throw new Error('Request too large');const s=await req.text();if(s.length>16000)throw new Error('Request too large');const value=JSON.parse(s);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid body');return value}
