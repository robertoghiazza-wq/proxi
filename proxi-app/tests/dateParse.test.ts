import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateTime, parseTime, validDate } from '../src/lib/dateParse.ts';

const d = s => parseDateTime(s)?.date ?? null;

test('formati europei con vari separatori', () => {
  for (const s of ['15.03.2026', '15/03/2026', '15-03-2026', '15 03 2026', '15 3 2026', '5.3.2026', ' 15 . 03 . 2026 '])
    assert.equal(d(s), s.includes('5.3') ? '2026-03-05' : '2026-03-15', s);
});

test('anno a due cifre: 20xx fino a 49, altrimenti 19xx', () => {
  assert.equal(d('15.03.26'), '2026-03-15');
  assert.equal(d('15.03.65'), '1965-03-15');
  assert.equal(d('01.01.49'), '2049-01-01');
  assert.equal(d('01.01.50'), '1950-01-01');
});

test('ISO e compatti', () => {
  assert.equal(d('2026-03-15'), '2026-03-15');
  assert.equal(d('2026-3-5'), '2026-03-05');
  assert.equal(d('15032026'), '2026-03-15');
  assert.equal(d('20260315'), '2026-03-15');
});

test('mese a parole in italiano', () => {
  assert.equal(d('15 marzo 2026'), '2026-03-15');
  assert.equal(d('3 Settembre 2026'), '2026-09-03');
  assert.equal(d('1 dic. 2026'), '2026-12-01');
  assert.equal(d('15 foo 2026'), null);
});

test('con l\'ora', () => {
  assert.deepEqual(parseDateTime('15.03.2026 20:30'), { date: '2026-03-15', time: '20:30' });
  assert.deepEqual(parseDateTime('2026-03-15T20:30'), { date: '2026-03-15', time: '20:30' });
  assert.deepEqual(parseDateTime('15/03/2026, ore 20.30'), { date: '2026-03-15', time: '20:30' });
  assert.deepEqual(parseDateTime('15.03.2026'), { date: '2026-03-15', time: null });
  assert.equal(parseDateTime('15.03.2026 25:99'), null);
});

test('date impossibili o testo qualunque non si accettano', () => {
  for (const s of ['31.02.2026', '32.01.2026', '15.13.2026', '00.01.2026', 'ciao', '', '15.03', '2026', '15.03.2026 boh'])
    assert.equal(d(s), null, s);
  assert.equal(validDate(2024, 2, 29), true);
  assert.equal(validDate(2026, 2, 29), false);
});

test('orari', () => {
  assert.equal(parseTime('20:30'), '20:30');
  assert.equal(parseTime('9.05'), '09:05');
  assert.equal(parseTime('ore 18h30'), '18:30');
  assert.equal(parseTime('2030'), '20:30');
  assert.equal(parseTime('24:00'), null);
  assert.equal(parseTime('abc'), null);
});
