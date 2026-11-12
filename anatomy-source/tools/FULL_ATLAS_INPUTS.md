# Full-atlas conversion inputs

The committed GLBs are editable source models: named nodes, materials and
hierarchy are preserved, without encryption. They can be imported into Blender.
The build script is supplied for auditing/reproducing the conversion, not for
redistributing the unreviewed original mixed input export as an extra bundle.

Run `node tools/build-full-atlas.mjs /path/to/cache`. Its cache layout:

- original/models/{system}.glb and original/data/systems.json: original
  nqwrc/3d-anatomy export, commit 8ca3b7421bcfbe88b85859eb1983d5cf79f21749.
- authorod-packages-data-releases-1.2.0-manifest.json: metadata from the data
  publisher; no application code from that project is used.
- registered-ear.glb, registered-kidneys.glb, registered-ossicles.glb: separately
  licensed CC BY replacement data from authorOd/3d-anatomy-atlas release 1.2.0,
  respectively standard/nervous/sense_organs.glb,
  standard/visceral/urinary_system.glb and
  standard/skeletal/auditory_ossicles--bones_of_lower_limb.glb.
- openear-zeta.glb: https://opentwin.opening.science/models/openear-zeta.glb,
  a CC BY OpenEar ZETA adaptation. Original: doi:10.5281/zenodo.1473724.
- bp43/, bp43-renal/, bp43-ureters/: official version 4.3 OBJ components from
  https://lifesciencedb.jp/bp3d/download.cgi. FJ/BP names, source hashes and the
  exact components used are recorded in the committed model-provenance.json.

Original source and registered-input SHA256 values are in model-provenance.json.
The version-stamped official FMA2Obj.txt manifest establishes version 4.3.
Input snapshots are private build cache; do not add old mixed GLBs to releases.
The current output replaces the identified legacy candidate groups and contains
only the reviewed adaptation. Complete model credits/changes are in
public/models/License.txt. The script's authored schematic courses are explicitly
labelled as illustrations, not substituted measured segmentations.

For cranial registration, bp43-head-anchors/ contains the official 4.3 OBJ
files listed by hash in public/data/cranial-registration.json. Run
`node tools/register-cranial-frame.mjs /path/to/cache` before the converter to
refit the shared cranial transform. Facial VII uses all six named source
components on each side; XI preserves the supplied trunk proportions.
