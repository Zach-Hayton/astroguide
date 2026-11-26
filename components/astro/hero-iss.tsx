'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Box3, Group, MathUtils, Quaternion, Vector3, type Euler } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export default function HeroISS({
  dragRotation,
}: {
  dragRotation: RefObject<Euler>;
}) {
  const compact = useThree((state) => state.size.width < 640);
  const follow = useRef<Group>(null);
  const target = useRef(new Quaternion());
  const orbit = useRef<Group>(null);
  const phase = useRef(-2.2);
  const reduce = useRef(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduce.current = preference.matches;
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useFrame((_, dt) => {
    if (follow.current) {
      target.current.setFromEuler(dragRotation.current);
      // Ease the orbital frame after the dragged Earth, including release momentum.
      // Exponential damping gives the same response at different frame rates.
      follow.current.quaternion.slerp(
        target.current,
        reduce.current ? 1 : 1 - Math.exp(-1.5 * dt),
      );
    }
    if (!orbit.current || reduce.current) return;
    // Use elapsed seconds, not frame count, for a 90-second revolution.
    phase.current = (phase.current + dt * ((2 * Math.PI) / 90)) % (2 * Math.PI);
    orbit.current.rotation.y = phase.current;
  });
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

  // Local +Y is Earth's north axis; an XZ circle is its equatorial plane.
  // Tilt the plane's normal by 51.6 degrees, then revolve prograde about +Y.
  // Earth supplies the shared center and axial tilt, outside its spinning mesh.
  // Radius and spacecraft size are exaggerated so the enlarged model clears Earth.
  return (
    <group ref={follow}>
      <group rotation={[0, 0, -MathUtils.degToRad(51.6)]}>
        <group ref={orbit} rotation={[0, -2.2, 0]}>
          <group position={[3.05, 0, 0]} rotation={[0.4, -0.3, -0.25]}>
            <group scale={scale * (compact ? 0.6 : 1)}>
              <group position={center}>
                <primitive object={scene} dispose={null} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
