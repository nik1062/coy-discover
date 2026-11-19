import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createStore, seedData } from '../lib/store.mjs';

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'coy-')), 'db.json');
const { likesMe, profiles } = seedData();
const liker = likesMe[0];
const nonLiker = profiles.find((p) => !likesMe.includes(p.id)).id;

test('seeds at least 30 profiles, some already like the user', () => {
  assert.ok(profiles.length >= 30);
  assert.ok(likesMe.length > 0);
});
test('feed never leaks who liked the user', () => {
  const s = createStore(tmp());
  assert.ok(!JSON.stringify(s.feed()).includes('likesMe'));
  assert.ok(s.feed().every((p) => !('likedMe' in p) && !('likesMe' in p)));
});
test('swiped profiles never reappear', () => {
  const s = createStore(tmp());
  s.swipe(nonLiker, 'pass'); s.swipe(liker, 'like');
  const ids = s.feed().map((p) => p.id);
  assert.ok(!ids.includes(nonLiker) && !ids.includes(liker));
});
test('like on someone who liked you creates a match', () => {
  const s = createStore(tmp());
  const r = s.swipe(liker, 'like');
  assert.equal(r.matched, true);
  assert.deepEqual(s.matches().map((p) => p.id), [liker]);
});
test('like on someone who did not like you does not match', () => {
  const s = createStore(tmp());
  assert.equal(s.swipe(nonLiker, 'like').matched, false);
  assert.equal(s.matches().length, 0);
});
test('passing on someone who liked you never matches', () => {
  const s = createStore(tmp());
  assert.equal(s.swipe(liker, 'pass').matched, false);
  assert.equal(s.matches().length, 0);
});
test('swipes are idempotent: repeat swipe cannot flip the result', () => {
  const s = createStore(tmp());
  s.swipe(liker, 'pass');
  const r = s.swipe(liker, 'like');
  assert.equal(r.duplicate, true);
  assert.equal(r.matched, false);
  assert.equal(s.matches().length, 0);
});
test('state persists across store instances (reload)', () => {
  const f = tmp();
  createStore(f).swipe(liker, 'like');
  const again = createStore(f);
  assert.equal(again.matches().length, 1);
  assert.ok(!again.feed().some((p) => p.id === liker));
});
test('rejects invalid input', () => {
  const s = createStore(tmp());
  assert.throws(() => s.swipe(liker, 'super'), { status: 400 });
  assert.throws(() => s.swipe('abc', 'like'), { status: 400 });
  assert.throws(() => s.swipe(9999, 'like'), { status: 404 });
});
