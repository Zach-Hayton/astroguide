import { NodeIO } from '@gltf-transform/core';
import {
  ALL_EXTENSIONS,
  EXTMeshoptCompression,
  EXTTextureWebP,
} from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });
const [source, out] = process.argv.slice(2);
if (!source || !out)
  throw new Error('Usage: node restore-iss-detail.mjs INPUT.glb OUTPUT.glb');
const doc = await io.read(source);
const dimensions = [];
for (const texture of doc.getRoot().listTextures()) {
  const image = texture.getImage();
  if (!image) continue;
  const metadata = await sharp(image).metadata();
  const encoded = await sharp(image)
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
  texture.setImage(encoded).setMimeType('image/webp');
  dimensions.push([
    texture.getName(),
    metadata.width,
    metadata.height,
    image.length,
    encoded.length,
  ]);
}
doc.createExtension(EXTTextureWebP).setRequired(true);
// The encoding method below applies byte compression only. Do not run the
// meshopt() transform: it also quantizes vertex attributes, losing precision.
doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, doc);
const restored = await io.read(out),
  original = await io.read(source);
const a = original.getRoot().listAccessors(),
  b = restored.getRoot().listAccessors();
const indices = new Set(
  original
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives().map((p) => p.getIndices())),
);
if (a.length !== b.length) throw Error('Accessor count changed');
for (let i = 0; i < a.length; i++) {
  if (
    a[i].getType() !== b[i].getType() ||
    a[i].getComponentType() !== b[i].getComponentType()
  )
    throw Error('Attribute precision changed');
  const x = a[i].getArray(),
    y = b[i].getArray();
  if (x.length !== y.length) throw Error('Accessor length changed');
  if (indices.has(a[i])) {
    for (let j = 0; j < x.length; j += 3) {
      if (
        ![0, 1, 2].some((k) =>
          [0, 1, 2].every((c) => x[j + c] === y[j + ((c + k) % 3)]),
        )
      )
        throw Error('Triangle changed: ' + i);
    }
  } else if (x.some((v, j) => v !== y[j]))
    throw Error('Vertex attribute changed: ' + i);
}
const textures = restored.getRoot().listTextures();
for (let i = 0; i < textures.length; i++) {
  const oldPixels = await sharp(original.getRoot().listTextures()[i].getImage())
    .ensureAlpha()
    .raw()
    .toBuffer();
  const newPixels = await sharp(textures[i].getImage())
    .ensureAlpha()
    .raw()
    .toBuffer();
  if (oldPixels.length !== newPixels.length)
    throw Error('Texture dimensions changed');
  for (let p = 0; p < oldPixels.length; p += 4) {
    if (
      oldPixels[p + 3] !== newPixels[p + 3] ||
      (oldPixels[p + 3] > 0 &&
        [0, 1, 2].some((c) => oldPixels[p + c] !== newPixels[p + c]))
    )
      throw Error('Visible texture pixel changed: ' + i);
  }
}
console.log(
  JSON.stringify(
    {
      bytes: fs.statSync(out).size,
      accessors: a.length,
      textures: dimensions,
      validation:
        'All vertex attributes, triangle shapes/winding, texture dimensions and visible texture pixels match the original',
    },
    null,
    2,
  ),
);
