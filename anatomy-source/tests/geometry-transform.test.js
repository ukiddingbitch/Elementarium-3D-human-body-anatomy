import {describe, it, expect} from 'vitest';
import {BufferGeometry, Float32BufferAttribute, Matrix4, Vector3} from 'three';
import {bakeGeometryTransform} from '../tools/bake-geometry.mjs';

function triangle(indexed = true, withNormals = true) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  if (indexed) geometry.setIndex([0,1,2]);
  if (withNormals) geometry.setAttribute('normal', new Float32BufferAttribute([0,0,1, 0,0,1, 0,0,1],3));
  return geometry;
}
function normalAgreement(geometry) {
  const vertices = [...geometry.index.array].map(i => new Vector3().fromBufferAttribute(geometry.attributes.position,i));
  const face = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
  return face.dot(new Vector3().fromBufferAttribute(geometry.attributes.normal,0).normalize());
}
describe('baked model transforms', () => {
  it('preserves front faces and normals after a mirrored nonuniform transform', () => {
    const g = triangle();
    bakeGeometryTransform(g,new Matrix4().makeRotationX(.4).multiply(new Matrix4().makeScale(-2,3,4)));
    expect([...g.index.array]).toEqual([0,2,1]);
    expect(normalAgreement(g)).toBeCloseTo(1,6);
  });
  it('keeps winding when two axis reflections preserve orientation', () => {
    const g=triangle();
    bakeGeometryTransform(g,new Matrix4().makeScale(-1,-1,1));
    expect([...g.index.array]).toEqual([0,1,2]);
    expect(normalAgreement(g)).toBeCloseTo(1,6);
  });
  it('also handles unindexed surfaces without supplied normals', () => {
    const g=triangle(false,false);
    bakeGeometryTransform(g,new Matrix4().makeScale(-1,1,1));
    expect([...g.index.array]).toEqual([0,2,1]);
    expect(normalAgreement(g)).toBeCloseTo(1,6);
  });
});
