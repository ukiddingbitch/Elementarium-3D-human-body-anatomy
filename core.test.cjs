const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const core=require('./desktop-core.cjs');
test('bundled assets resolve within the app and directory links work',()=>{
  assert.equal(core.resolveAsset(__dirname,core.TABLE),path.join(__dirname,'content/index.html'));
  assert.equal(core.resolveAsset(__dirname,'elementarium://app/content/'),path.join(__dirname,'content/index.html'));
  for(const url of ['file:///C:/Windows/win.ini','https://app/shell.html','elementarium://evil/shell.html','elementarium://app/content/%2e%2e%2f%2e%2e%2fsecrets','elementarium://app/content/%5c..%5csecrets','elementarium://app/content/%00','elementarium://app/main.cjs'])assert.equal(core.resolveAsset(__dirname,url),null,url);
});
test('atlas stays internal and external links are restricted to source sites',()=>{
  assert.ok(core.isAtlas(core.ATLAS));
  assert.ok(!core.isAtlas('https://app/content/anatomy/index.html'));
  assert.equal(core.externalURL('file:///C:/Windows/System32/cmd.exe'),null);
  assert.equal(core.externalURL('https://pubchem.ncbi.nlm.nih.gov.evil.com/'),null);
  assert.equal(core.externalURL('https://pubchem.ncbi.nlm.nih.gov/element/26'),'https://pubchem.ncbi.nlm.nih.gov/element/26');
});
