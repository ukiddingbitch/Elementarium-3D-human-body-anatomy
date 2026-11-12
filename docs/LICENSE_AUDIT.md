# Licensing and restoration review — 3.3.0

Review date: 12 November 2026.

The 3.3.0 rendering correction preserves the same licensed source selection.
See [the rendering review](RENDERING_REVIEW.md) for the exact reference-model
hashes and all-structure visibility checks.

The reduced 3.1.0 geometry was replaced by a restoration of all **2,827 original
selectable objects**. Counts: skeletal 277, joints 349, muscular 669,
cardiovascular 676, lymphatic 158, nervous 580, visceral 118.

The geometry adaptation is CC BY-SA 4.0. The independently distributed viewer
code retains CC BY-NC-SA 4.0, so the complete application is a noncommercial
distribution. See the component [LICENSE](../LICENSE) and [NOTICE](../NOTICE).
This is an evidence-based practical review, not a guarantee for every legal use.

| Issue | Treatment |
| --- | --- |
| Entire atlas was replaced with a smaller dataset | Original selectable IDs and hierarchy restored and checked against the original index. |
| Legacy CAHID cranial-nerve group | Identified group and accessory-nerve candidates replaced with actual official DBCLS 4.3 components and explicitly authored illustrative courses. No unrelated project's private permission is claimed. |
| Legacy ear / uncertain adjacent parts | OpenEar Delta and ZETA replace cochlea, vestibule, ossicles, tympanic membrane and chorda tympani. Publisher data licenses are CC BY 4.0. |
| Legacy kidney scope | HRA replaces kidney and renal pelvis; official DBCLS replaces ureters and intrarenal candidates. |
| Cortical credit | Brain for Blender is credited to Anderson M. Winkler / Brainder under CC BY-SA 3.0; compatible adaptation under 4.0. The incorrect historical UW credit is not repeated as a current credit. |
| Mixed blanket license | Independent application, geometry, terminology, text and library terms are mapped separately. All replacement geometry terms permit this SA 4.0 adaptation. |
| Text provenance | Every Wikipedia entry has an exact revision/citation; other summaries are original and clearly identified as system contexts. |
| Runtime | Existing full library notices and matching offline FFmpeg source preserved in every native edition. Python's full license remains unchanged. |

## Exact scope and limits

Fourteen small nerve courses are newly authored illustrations, not measured
segmentations. Their cards carry a translated notice. Two unidentified legacy
objects are preserved without invented anatomical identities. A restored index
does not turn this into an exhaustive or clinically validated human atlas.
All replacement placements are edited to fit this atlas; different source
subjects are combined. These are documented adaptations, not patient data.

`anatomy-source/public/models/model-provenance.json` records every part, source,
source file hash and adaptation note. `geometry-notes.json` lists illustrative
courses. Editable GLBs retain names, materials and hierarchy. The conversion
script and input register are included; original mixed legacy input files are
not redistributed as an extra source bundle. The final reviewed GLBs are the
editable model source shipped with this project.

## Primary license evidence

- [Z-Anatomy source and grant](https://github.com/Z-Anatomy/Models-of-human-anatomy)
- [Official DBCLS database grant](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
- [Brain for Blender publisher](https://brainder.org/research/brain-for-blender/)
- [BY-SA 3.0 legal code, section 4(b)](https://creativecommons.org/licenses/by-sa/3.0/legalcode)
- [HRA 3D reference library](https://humanatlas.io/3d-reference-library)
- [OpenEar Delta publisher record](https://zenodo.org/records/4362584)
- [OpenEar Delta DOI rights metadata](https://api.datacite.org/dois/10.5281/zenodo.4362584)
- [OpenEar original dataset](https://zenodo.org/records/1473724)
- [Registered replacement data terms](https://github.com/authorOd/3d-anatomy-atlas/blob/main/packages/data/releases/1.2.0/LICENSES.md)
- [CC guidance on collections and adaptations](https://creativecommons.org/faq/#can-i-combine-material-under-different-creative-commons-licenses-in-my-work)

Historical reports in license-audit and docs/upstream describe earlier inputs,
not the current inventory. No author was contacted on the user's behalf and no
permission has been invented. Preserve all credits and applicable terms when
redistributing; do not relicense the viewer code as permissive commercial code.
