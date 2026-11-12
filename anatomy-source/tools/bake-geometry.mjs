// Baking a reflection removes the negative object matrix that renderers use
// to reverse front-face winding. Preserve that reversal in the geometry itself.
export function bakeGeometryTransform(geometry, matrix) {
  if (matrix.determinant() < 0) {
    if (!geometry.index) {
      geometry.setIndex(Array.from({length: geometry.attributes.position.count}, (_, i) => i));
    }
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const second = indices[i + 1];
      indices[i + 1] = indices[i + 2];
      indices[i + 2] = second;
    }
    geometry.index.needsUpdate = true;
  }
  geometry.applyMatrix4(matrix);
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  return geometry;
}
