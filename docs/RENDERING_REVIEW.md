# Rendering review — 3.3.0

The original transform-baking code omitted triangle-winding reversal for
negative-determinant world matrices. This removed the renderer's original
front-face reversal: mirrored surfaces could disappear from outside.
Investing abdominal fascia (left) was one visible example. All seven exports
were regenerated with correct winding and inverse-transpose normal handling.
Changing every material to double-sided would conceal the conversion error;
the original material sides are preserved instead.

The comparison used all seven GLBs downloaded from
https://nqwrc.github.io/3d-anatomy/ on 12 November 2026. Their SHA256 values
match the original source cache. All 2,827 structures were rendered separately
from six cardinal directions. Every structure produced visible fragments.
For the 2,751 retained original structures, material properties match the
reference and world bounds differ by at most 0.00000546 metres after compression.
Both abdominal-fascia masks match the reference in all six views.

The mask images are 128 × 128 pixels. Thin structures can differ by a few
edge pixels because of compressed coordinates; the largest total difference
was eight pixels across six views. This is a rendering regression check, not
a clinical validation or a proof that every detail is identical at every zoom.

Six ethmoid-cell surfaces without an explicit source material also retain
glTF's original default material. Reset and system loading restore body-scale
camera clipping after close inspection to prevent depth-precision artifacts.

The 76 independently replaced or authored structures retain the legal source
treatment from LICENSE_AUDIT.md. They are checked for rendering; their surfaces
are not claimed identical to the retired reference geometry. Fourteen nerve
courses remain explicitly illustrative. No unreviewed legacy geometry was
reintroduced to make this correction.

See render-verification.json for all part records, model hashes and reference
hashes. The muscular-comparison.png image renders reference and corrected
models using the same camera, lights and material settings. Model credits:
Z-Anatomy / Gauthier Kervyn and contributors; BodyParts3D / DBCLS; CC BY-SA 4.0
for this adaptation, with underlying credits preserved in NOTICE.

The 3.3.0 run repeats all 2,827 checks after the cranial placement update.
See [NERVE_ALIGNMENT.md](NERVE_ALIGNMENT.md) for the four revised nerve structures.
