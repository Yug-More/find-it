import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';

const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const alice = '00000000-0000-4000-8000-000000000002';
const bob = '00000000-0000-4000-8000-000000000003';
const migration = await readFile(new URL('../migrations/20261102_claim_notification_lifecycle.sql', import.meta.url), 'utf8');
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to authenticated, service_role;
    create schema auth; create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;`);
  let schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  // Exercise the real schema/lifecycle SQL. Only the unrelated vector extension,
  // index, and matching RPC are omitted from this PostgreSQL WASM runtime.
  schema = schema.replace('create extension if not exists vector;', '')
    .replace('embedding vector(1536)', 'embedding double precision[]')
    .replace(/create index if not exists items_embedding_idx[\s\S]*?;/, '')
    .replace(/create or replace function match_items\([\s\S]*?\$\$;/, '');
  await db.exec(schema);
  await db.exec(migration); // Existing databases and repeated migration runs.
  for (const id of [owner, alice, bob]) {
    await db.query('insert into auth.users values ($1, $2, $3)', [id, `${id}@example.com`, '{}']);
  }
});
after(() => db.close());

async function report() {
  return (await db.query(`insert into items(user_id,type,title,description) values ($1,'found','Notebook','Blue') returning id`, [owner])).rows[0].id;
}
async function submit(item, actor = alice) {
  return (await db.query('select * from submit_item_claim($1,$2,$3)', [item, actor, 'My blue notebook'])).rows[0];
}
async function decide(claim, status, actor = owner) {
  return (await db.query('select * from decide_item_claim($1,$2,$3)', [claim, actor, status])).rows[0];
}
const rejects = (fn, code) => assert.rejects(fn, error => error.code === code);

test('submission rejects self, missing, resolved and duplicate active claims', async () => {
  const id = await report();
  await rejects(() => submit(id, owner), 'PT400');
  await rejects(() => submit('00000000-0000-4000-8000-999999999999'), 'PT404');
  await submit(id);
  await rejects(() => submit(id), 'PT409');
  await db.query("update items set status='resolved' where id=$1", [id]);
  await rejects(() => submit(id, bob), 'PT409');
});

test('approval resolves report, rejects competitors, timestamps and notifies every claimant atomically', async () => {
  const id = await report();
  const first = await submit(id);
  const second = await submit(id, bob);
  assert.equal((await decide(first.id, 'approved')).status, 'approved');
  assert.equal((await db.query('select status from items where id=$1', [id])).rows[0].status, 'resolved');
  const other = (await db.query('select * from claims where id=$1', [second.id])).rows[0];
  assert.equal(other.status, 'rejected');
  assert.ok(other.updated_at >= other.created_at);
  const notes = (await db.query('select user_id,kind from notifications where item_id=$1', [id])).rows;
  assert.equal(notes.filter(n => n.user_id === owner && n.kind === 'claim').length, 2);
  assert.equal(notes.filter(n => n.user_id === alice && n.kind === 'claim_update').length, 1);
  assert.equal(notes.filter(n => n.user_id === bob && n.kind === 'claim_update').length, 1);
  await rejects(() => decide(first.id, 'approved'), 'PT409');
  await rejects(() => decide(second.id, 'approved'), 'PT409');
});

test('only owners decide pending claims; rejected claims stay final; rejection permits a new claim', async () => {
  const id = await report();
  const first = await submit(id);
  await rejects(() => decide(first.id, 'rejected', bob), 'PT403');
  await rejects(() => decide(first.id, 'pending'), 'PT409');
  await decide(first.id, 'rejected');
  await rejects(() => decide(first.id, 'approved'), 'PT409');
  await rejects(() => decide(first.id, 'rejected'), 'PT409');
  assert.notEqual((await submit(id)).id, first.id);
});

test('notification failure rolls back submission and every approval side effect', async () => {
  const id = await report();
  const first = await submit(id);
  const second = await submit(id, bob);
  await db.exec(`create function fail_notification() returns trigger language plpgsql as $$ begin
    if new.kind='claim' or new.user_id='${bob}'::uuid then raise exception 'notification unavailable'; end if;
    return new; end $$;
    create trigger fail_notes before insert on notifications for each row execute function fail_notification();`);
  try {
    await assert.rejects(() => decide(first.id, 'approved'));
    assert.equal((await db.query('select status from items where id=$1', [id])).rows[0].status, 'open');
    assert.deepEqual((await db.query('select status from claims where item_id=$1', [id])).rows.map(r => r.status), ['pending','pending']);
    assert.equal((await db.query('select count(*)::int as n from notifications where item_id=$1', [id])).rows[0].n, 2);
    const fresh = await report();
    await assert.rejects(() => submit(fresh));
    assert.equal((await db.query('select count(*)::int as n from claims where item_id=$1', [fresh])).rows[0].n, 0);
  } finally { await db.exec('drop trigger fail_notes on notifications; drop function fail_notification();'); }
  assert.ok(second.id);
});

test('untrusted roles cannot invoke privileged functions, bypass claims, or forge notification content', async () => {
  const id = await report();
  await submit(id);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [alice]);
  await db.exec('set role authenticated');
  try {
    await rejects(() => submit(id, bob), '42501');
    await rejects(() => db.query("insert into claims(item_id,claimant_id,message) values ($1,$2,'forged')", [id,alice]), '42501');
    await rejects(() => db.query("update claims set status='approved' where item_id=$1", [id]), '42501');
    await rejects(() => db.exec("update notifications set body='forged'"), '42501');
    assert.equal((await db.query('select * from notifications where item_id=$1', [id])).rows.length, 0);
    await db.query('update notifications set is_read=true where item_id=$1', [id]);
  } finally { await db.exec('reset role'); }
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
  await db.exec('set role authenticated');
  try {
    const notes = (await db.query('select * from notifications where item_id=$1', [id])).rows;
    assert.equal(notes.length, 1);
    assert.equal(notes[0].is_read, false);
    await db.query('update notifications set is_read=true where id=$1', [notes[0].id]);
  } finally { await db.exec('reset role'); }
});


test('anonymous callers cannot run lifecycle RPCs, while the trusted service role can', async () => {
  const id = await report();
  await db.exec('set role anon');
  try { await rejects(() => submit(id), '42501'); }
  finally { await db.exec('reset role'); }
  await db.exec('set role service_role');
  try { assert.equal((await submit(id)).claimant_id, alice); }
  finally { await db.exec('reset role'); }
});
