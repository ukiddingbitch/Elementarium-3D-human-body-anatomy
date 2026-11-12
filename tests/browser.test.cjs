const {test} = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const {createBrowserServer} = require('../scripts/serve-browser.cjs');

test('browser mode serves the complete offline app without exposing project files', async t=>{
  const server = createBrowserServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve); server.closeAllConnections();}));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base+'/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="table"/);
  assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
  const elements = await (await fetch(base+'/data/elements.json')).json();
  assert.equal(elements.length, 118);
  const atlas = await fetch(base+'/anatomy/');
  assert.equal(atlas.status, 200);
  assert.match(await atlas.text(), /threeCanvas/);
  for (const system of ['skeletal','muscular','joints','cardiovascular','lymphatic','nervous','visceral']) {
    const model = await fetch(base+`/anatomy/models/${system}.glb`, {method:'HEAD'});
    assert.equal(model.status, 200, system);
    assert.equal(model.headers.get('content-type'), 'model/gltf-binary');
    assert.ok(Number(model.headers.get('content-length'))>10000);
  }
  for (const resource of ['/package.json','/main.cjs','/.git/config','/anatomy/models/','/%2e%2e%2fpackage.json','/%5c..%5cpackage.json']) {
    assert.equal((await fetch(base+resource)).status, 404, resource);
  }
});
