'use client';

import { useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export default function HeroISS() {
  const compact = useThree((state) => state.size.width < 640);
  const gltf = useLoader(GLTFLoader, '/models/iss.glb', (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const { scene, center, scale } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    return {
      scene,
      center: bounds.getCenter(new Vector3()).negate(),
      scale: 0.75 / Math.max(size.x, size.y, size.z),
    };
  }, [gltf]);

  // Presentation placement and enlarged size; orbital positioning comes later.
  // Keep the station independent of the draggable Earth's surface rotation.
  return (
    <group
      position={compact ? [0.7, 1.7, 1.8] : [0.25, 1.25, 2.5]}
      rotation={[0.4, -0.3, -0.25]}
    >
      <group scale={scale * (compact ? 0.6 : 1)}>
        <group position={center}>
          <primitive object={scene} dispose={null} />
        </group>
      </group>
    </group>
  );
}
