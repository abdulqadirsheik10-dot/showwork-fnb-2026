import {owner,originOK,newSession,json,db} from '@/lib/server';
export async function POST(req:Request){if(!originOK(req))return json({error:'Use this form from ShowWork.'},403);if(await owner(req))return json({ok:true});return newSession(req)}
export async function GET(req:Request){const id=await owner(req);return json({active:!!id})}
export async function DELETE(req:Request){if(!originOK(req))return json({error:'Request rejected.'},403);const id=await owner(req);if(id)await db().batch([db().prepare('DELETE FROM attempts WHERE owner=?').bind(id),db().prepare('DELETE FROM shares WHERE owner=?').bind(id),db().prepare('DELETE FROM sessions WHERE id=?').bind(id)]);return json({ok:true},200,{'Set-Cookie':'sw_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
