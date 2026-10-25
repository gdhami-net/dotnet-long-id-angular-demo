import { test, expect, Page } from '@playwright/test';

async function row(page: Page, name: string) {
  const tr = page.locator(`tr[data-case="${name}"]`);
  await expect(tr).toBeVisible();
  const cell = async (attr: string) => (await tr.locator(`[${attr}]`).textContent())?.trim();
  return {
    sent: await cell('data-sent'),
    shown: await cell('data-shown'),
    type: await cell('data-type'),
    lookup: await cell('data-lookup'),
    put: await cell('data-put'),
  };
}

test('as is: HttpClient hands the page a different number, and the way back misses', async ({ page }) => {
  await page.goto('/');
  const r = await row(page, 'as-is');
  console.log('as-is      ', JSON.stringify(r));
  expect(r.sent).toBe('1234567890123456789');
  expect(r.shown).toBe('1234567890123456800');
  expect(r.type).toBe('number');
  expect(r.lookup).toBe('404');
  expect(r.put).toBe('404');
});

test('string on the wire: the ID survives the round trip', async ({ page }) => {
  await page.goto('/');
  const r = await row(page, 'string-id');
  console.log('string-id  ', JSON.stringify(r));
  expect(r.shown).toBe('1234567890123456789');
  expect(r.type).toBe('string');
  expect(r.lookup).toBe('200');
  expect(r.put).toBe('200');
});

test('source-text reviver: exact digits from an unchanged API', async ({ page }) => {
  await page.goto('/');
  const r = await row(page, 'source-text');
  console.log('source-text', JSON.stringify(r));
  expect(r.shown).toBe('1234567890123456789');
  expect(r.type).toBe('string');
  expect(r.lookup).toBe('200');
  expect(r.put).toBe('200');
});
