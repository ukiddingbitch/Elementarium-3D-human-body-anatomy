import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../content');
const {setSiteLanguage,translateText,latinName}=await import(new URL('../content/assets/i18n.js',import.meta.url));
const {default:dictionary}=await import(new URL('../content/data/locales.js',import.meta.url));
const {electronData}=await import(new URL('../content/assets/atom.js',import.meta.url));

test('all 118 elements have complete EN and LA articles and names',()=>{
  assert.equal(dictionary.elements.length,118);
  assert.equal(new Set(dictionary.elements.map(e=>e.latin)).size,118);
  for(const element of dictionary.elements){
    for(const field of ['sk','english','latin','enDescription','enUses','laDescription','laUses'])assert.ok(element[field]?.trim(),field);
  }
});
test('the switch uses traditional names and never translates names twice',()=>{
  setSiteLanguage('en');assert.equal(translateText('Železo'),'Iron');assert.equal(translateText('PRVOK 26 ZO 118'),'ELEMENT 26 OF 118');
  setSiteLanguage('la');assert.equal(translateText('Železo'),'Ferrum');assert.equal(translateText('Sodík'),'Natrium');assert.equal(translateText('Ortuť'),'Hydrargyrum');
  assert.equal(translateText('Oxygen · perióda 2 · skupina 16'),'Oxygenium · periodus 2 · grex 16');
  assert.equal(translateText('Kyslík · perióda 2 · skupina 16'),'Oxygenium · periodus 2 · grex 16');
  setSiteLanguage('sk');assert.equal(translateText('Železo'),'Železo');assert.equal(latinName(26),'Ferrum');
});
test('labels, descriptions and dynamic electron labels are translated',()=>{
  setSiteLanguage('en');assert.equal(translateText('Elektróny · 3D'),'Electrons · 3D');
  assert.equal(translateText('Fe · 26 protónov · 26 elektrónov · Bohrov model'),'Fe · 26 protons · 26 electrons · Bohr model');
  setSiteLanguage('la');assert.equal(translateText('Ľudské telo'),'Corpus humanum');assert.equal(translateText('Pevná látka'),'Solidum');
  assert.equal(translateText('Fe · 26 protónov · 26 elektrónov · Bohrov model'),'Fe · 26 protona · 26 electrona · exemplar Bohr');
  setSiteLanguage('sk');
});
test('removed page copy and obsolete tabs stay removed; the body tab remains',()=>{
  const html=fs.readFileSync(path.join(project,'index.html'),'utf8');
  for(const phrase of ['CHÉMIA V SÚVISLOSTIACH','Každý prvok má svoj príbeh','Ako objavovať','Jeden prvok, viac pohľadov','118 / 118','Chýbajúce údaje sa neodhadujú','Malé atómy. Veľké súvislosti.'])assert.ok(!html.includes(phrase),phrase);
  const script=fs.readFileSync(path.join(project,'assets/explorer.js'),'utf8');
  assert.ok(!script.includes("workbook:'Zošit'"));assert.ok(script.includes("body:'Ľudské telo'"));
  assert.ok(html.indexOf('id="phase-legend"')<html.indexOf('id="table"'));
});
test('electron populations still total the atomic number for every element',()=>{
  for(let n=1;n<=118;n++)assert.equal(electronData(n).shells.reduce((a,b)=>a+b,0),n);
});


test('Italian is complete and shares the same element identities',()=>{
  for(const e of dictionary.elements)for(const field of ['italian','itDescription','itUses'])assert.ok(e[field]?.trim(),field);
  for(const text of Object.values(dictionary.ui))assert.ok(text.it?.trim());
  setSiteLanguage('it');assert.equal(translateText('Železo'),'Ferro');assert.equal(translateText('Ľudské telo'),'Corpo umano');
  assert.ok(translateText('Neutrálny atóm v základnom stave · 26 elektrónov').includes('26'));
  setSiteLanguage('sk');
});
