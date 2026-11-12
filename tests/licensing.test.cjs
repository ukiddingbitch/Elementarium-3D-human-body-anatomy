const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p));
test('all original structures have geometry and component provenance',()=>{
  const systems=json('content/anatomy/data/systems.json');
  const baseline=json('content/anatomy/data/original-structure-index.json');
  const provenance=json('content/anatomy/models/model-provenance.json');
  assert.equal(provenance.license,'CC-BY-SA-4.0');
  assert.equal(Object.keys(provenance.parts).length,2827);
  const actual=new Set();
  for(const [system,ids] of Object.entries(systems)){
    assert.deepEqual(new Set(ids),new Set(baseline[system]));
    const glb=read('content/anatomy/models/'+system+'.glb');
    assert.equal(glb.toString('ascii',0,4),'glTF');
    const doc=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
    assert.equal(doc.asset.extras.license,'CC-BY-SA-4.0');
    const owners=(doc.nodes||[]).filter(n=>n.extras?.za_name);
    assert.deepEqual(new Set(owners.map(n=>n.extras.za_name)),new Set(ids));
    for(const node of owners){
      const id=node.extras.za_name,record=provenance.parts[id];actual.add(id);
      assert.ok(record.surfaceCount>0,id);assert.ok(record.source,id);
      assert.ok([...record.bounds.min,...record.bounds.max].every(Number.isFinite),id);
      assert.ok(node.children?.some(index=>doc.nodes[index].mesh!==undefined),id);
    }
  }
  assert.equal(actual.size,2827);
  for(const id of ['Kidney.l','Kidney.r','Renal pelvis.l','Renal pelvis.r','Cochlea.l','Cochlea.r','Vestibule.l','Vestibule.r','Ureter.l','Ureter.r'])assert.notEqual(provenance.parts[id].source,'z-anatomy',id);
  assert.equal(provenance.schematicParts.length,14);
  const notes=json('content/anatomy/data/geometry-notes.json');
  for(const id of provenance.schematicParts)assert.ok(notes[id]?.schematic,id);
  assert.equal(provenance.parts['Facial nerve (VII).l'].surfaceCount,6);
  assert.equal(provenance.parts['Facial nerve (VII).r'].surfaceCount,6);
  const registration=provenance.sources.bodyparts43.cranialRegistration;
  assert.equal(registration.anchors.length,6);
  assert.ok(registration.uniformScale>.95&&registration.uniformScale<1.05);
  assert.ok(registration.anchors.every(anchor=>anchor.medianMetres<.002));
  const rendering=json('docs/render-verification.json');
  assert.equal(rendering.records.length,2827);
  assert.ok(rendering.records.every(record=>record.visiblePixels>0&&record.materialMatches));
  for(const [file,expected] of Object.entries(rendering.modelHashes)){
    assert.equal(crypto.createHash('sha256').update(read('content/anatomy/models/'+file)).digest('hex'),expected,file+' requires a new rendering review');
  }
});
test('all definitions have explicit reusable sources or original-text grants',()=>{
  const definitions=json('content/anatomy/data/definitions.json');
  for(const [name,entry] of Object.entries(definitions)){
    assert.ok(entry.text,name);assert.ok(entry.authors,name);
    if(entry.kind==='wikipedia'){
      assert.equal(entry.license,'CC-BY-SA-4.0');assert.ok(entry.changes);
      assert.match(entry.revisionUrl,/^https:\/\/en.wikipedia.org\/w\/index.php\?oldid=\d+$/);
      assert.ok(entry.title&&entry.revisionTimestamp);
    }else{assert.equal(entry.kind,'original');assert.equal(entry.license,'CC-BY-4.0');}
  }
  assert.deepEqual(json('content/data/spectra.json'),{});
  for(const file of ['CC-BY-4.0.txt','CC-BY-SA-4.0.txt','CC-BY-NC-SA-4.0.txt','draco-LICENSE'])assert.ok(read('content/licenses/'+file).length>10000);
});
