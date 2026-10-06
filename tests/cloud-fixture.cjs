const fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
exports.createDB=async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create function extensions.crypt(text,text) returns text language sql immutable as $$select $1$$;`);
 // PGlite has no pgcrypto. The test-only stub checks authorization flow, not bcrypt.
 let schema=fs.readFileSync(path.join(__dirname,'../supabase/schema.sql'),'utf8').replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(schema);
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',outsider='33333333-3333-4333-8333-333333333333';
 await db.query('insert into auth.users values ($1),($2),($3)',[a,b,outsider]);const family=(await db.query("insert into mission_private.families(name,pin_hash) values ('Família de teste','2026') returning id")).rows[0].id;
 await db.query('insert into mission_private.members values ($1,$3),($2,$3)',[a,b,family]);
 async function rpc(user,name,args={}){await db.query("select set_config('test.uid',$1,false)",[user]);await db.exec('set role authenticated');try{if(name==='mission_read')return (await db.query('select public.mission_read() as result')).rows[0].result;if(name==='mission_check_pin')return (await db.query('select public.mission_check_pin($1) as result',[args.p_pin])).rows[0].result;return (await db.query('select public.mission_commit($1,$2::jsonb,$3::uuid,$4) as result',[args.p_revision,JSON.stringify(args.p_data),args.p_operation,args.p_pin??null])).rows[0].result}finally{await db.exec('reset role')}}
 return {db,a,b,outsider,family,rpc};
};
