const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer(async (req, res) => {
    const name = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!['index.html', 'styles.css', 'app.js'].includes(name)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(await fs.readFile(path.join(root, name)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = 'http://127.0.0.1:' + server.address().port;
    await page.goto(url);
    await page.locator('#title').fill('<img src=x onerror=alert(1)>');
    await page.locator('#body').fill('A test thought');
    await page.locator('#save').click();
    assert.equal(await page.locator('.note').count(), 1);
    assert.equal(await page.locator('.note img').count(), 0);
    await page.reload();
    assert.equal(await page.locator('.note').count(), 1);
    await page.getByRole('button', { name: /^Edit note:/ }).click();
    await page.locator('#title').fill('Revised idea');
    await page.locator('#save').click();
    assert.equal(await page.locator('.note h3').textContent(), 'Revised idea');
    await page.locator('#search').fill('missing');
    assert.equal(await page.locator('.note').count(), 0);
    await page.locator('#search').fill('');
    await page.locator('#title').fill('Alpha');
    await page.locator('#body').fill('Another thought');
    await page.locator('#save').click();
    await page.locator('#sort').selectOption('title');
    assert.equal(await page.locator('.note h3').first().textContent(), 'Alpha');
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete note: Alpha', exact: true }).click();
    assert.equal(await page.locator('.note').count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.evaluate(() => localStorage.setItem('short-notes.v1', 'bad-json'));
    await page.reload();
    assert.match(await page.locator('#status').textContent(), /could not be loaded/);
    assert.equal(await page.evaluate(() => localStorage.getItem('short-notes.v1')), 'bad-json');
    assert.deepEqual(errors, []);
    console.log('PASS: create, reload, edit, search, sort, delete, safe text, mobile layout, corrupt storage');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
