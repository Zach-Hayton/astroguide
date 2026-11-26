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

The scene centers and scales the model from its bounding box. Placement is
stationary and illustrative, and spacecraft size is exaggerated. The model is
independent of Earth's drag rotation. Orbit playback is a separate next step.
