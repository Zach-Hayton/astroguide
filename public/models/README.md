# ISS landing-page model

Source: [NASA ISS viewer](https://solarsystem.nasa.gov/gltf_embed/2378/),
provided by the project owner as `ISS_stationary.glb` inside `ISS_stationary.7z`.
Credit: NASA. This is a modified web derivative, not a live position feed or a
representation of the station's current configuration.

The original remains in the uploaded archive; only the optimized derivative is
included in the application. Do not replace the original with this reduced copy.

| Metric | Original | Web derivative |
| --- | ---: | ---: |
| File bytes | 44,495,916 | 2,953,620 |
| Texture bytes before geometry compression | 32,329,712 | 791,160 |
| Mesh primitives | 343 | 27 |
| Triangles | 247,547 | 149,114 |

Reproduce with glTF Transform CLI 4.2.1, installed in a separate tooling directory
so application dependencies and the lockfile stay unchanged:

```sh
gltf-transform optimize ISS_stationary.glb iss-intermediate.glb \
  --compress quantize --texture-compress webp --texture-size 512 \
  --simplify-ratio 0.3 --simplify-error 0.001 --instance false
gltf-transform meshopt iss-intermediate.glb iss.glb
```

The simplifier respects error limits, so its target ratio is not a guarantee.
Small details and texture resolution are reduced for the landing-page scale.
The output uses `EXT_texture_webp`, `KHR_mesh_quantization`, and
`EXT_meshopt_compression`. `HeroISS` configures Three.js's bundled Meshopt decoder;
no external decoder download is needed. Preserve UV coordinates outside [0, 1]
because the original uses repeated textures.

Original SHA-256:
`26dba905b4b7555edbcb0c5f5a61b5c18659f5166076ab27dbb0e64025759fca`

## Focus model

`iss-detail.glb` is loaded only when inspection opens. It restores the original
247,547 triangles, floating-point vertex attributes, and all original texture
dimensions and visible pixels. Textures use lossless WebP and geometry uses
Meshopt byte compression without quantization, simplification, or mesh merging.
The result is 22,771,508 bytes, compared with the previous 4,914,612-byte focus
asset. The landing-page model remains the smaller 2.95 MB version.
The original's 26 textures are at most 1024 pixels per side, so the former 2048
cap did not reduce their dimensions. Restored texture quality comes from removing
lossy WebP compression; no invented or upscaled texture detail is added.

To reproduce, install tooling in an ignored directory, leaving application
dependencies and the lockfile unchanged. Run the script from that directory
so its imports resolve against those tooling dependencies:

```sh
npm install --prefix outputs/model-tools @gltf-transform/cli@4.2.1
cp scripts/restore-iss-detail.mjs outputs/model-tools/restore-iss-detail.mjs
node outputs/model-tools/restore-iss-detail.mjs /path/to/ISS_stationary.glb public/models/iss-detail.glb
```

The script verifies original vertex values, triangle shapes and winding, texture
dimensions, and decoded visible pixels. Meshopt may cyclically rotate a triangle's
indices, preserving its shape and winding. Fully transparent RGB values may be
discarded by WebP, without affecting visible pixels.

The focus scene rotates at 0.12 radians/second (about 52 seconds per turn), pausing
during interaction and respecting reduced-motion preferences. Drag rotates the
view; wheel or two-finger gestures zoom. Panning is disabled to keep the station
centered. Zoom buttons and Reset view are keyboard accessible. Inspection uses
up to 2.5× device pixel ratio and maximum supported texture anisotropy.
Figures in its information panel are
typical real-world values, not live telemetry or the landing-page animation speed.

The scene centers and scales the model from its bounding box. An illustrative
circular orbit completes a revolution every 90 seconds, about 60 times faster
than reality, with a 51.6-degree inclination to Earth's equator. Earth and the
orbit share the same center and base axial tilt. Earth's drag rotation and release
momentum steer the orbital frame with a smooth delayed response; idle spin does
not steer it, and the ISS keeps its own 90-second revolution. This following motion
is an interaction effect rather than orbital precession. The orbit radius is 3.05 scene units versus Earth's 2.42,
exaggerating altitude so the enlarged model clears the globe. No live orbital
elements are used. Reduced-motion preference pauses the ISS at its current phase.
