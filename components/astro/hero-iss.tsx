'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  useFrame,
  useLoader,
  useThree,
  type ThreeEvent,
} from '@react-three/fiber';
import {
  Box3,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Euler,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export default function HeroISS({
  dragRotation,
  onInspect,
}: {
  dragRotation: RefObject<Euler>;
  onInspect: () => void;
}) {
  const compact = useThree((state) => state.size.width < 640);
  const canvas = useThree((state) => state.gl.domElement);
  const follow = useRef<Group>(null);
  const target = useRef(new Quaternion());
  const orbit = useRef<Group>(null);
  const phase = useRef(-2.2);
  const reduce = useRef(false);
  const [hovered, setHovered] = useState(false);
  const hoverElapsed = useRef(0);
  const cursorInside = useRef(false);
  useEffect(() => {
    if (!hovered) return;
    const previous = canvas.style.cursor;
    canvas.style.setProperty('cursor', 'pointer');
    return () => {
      canvas.style.setProperty('cursor', previous);
    };
  }, [canvas, hovered]);
  useEffect(() => {
    const enter = () => {
      cursorInside.current = true;
    };
    const leave = () => {
      cursorInside.current = false;
      setHovered(false);
    };
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointercancel', leave);
    return () => {
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
    };
  }, [canvas]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduce.current = preference.matches;
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useFrame((state, dt) => {
    if (follow.current) {
      target.current.setFromEuler(dragRotation.current);
      // Ease the orbital frame after the dragged Earth, including release momentum.
      // Exponential damping gives the same response at different frame rates.
      follow.current.quaternion.slerp(
        target.current,
        reduce.current ? 1 : 1 - Math.exp(-1.5 * dt),
      );
    }
    if (orbit.current && !reduce.current) {
      // Use elapsed seconds, not frame count, for a 90-second revolution.
      phase.current =
        (phase.current + dt * ((2 * Math.PI) / 90)) % (2 * Math.PI);
      orbit.current.rotation.y = phase.current;
    }
    // Recheck a stationary cursor as the ISS moves beneath it or behind Earth.
    // Throttle the mesh raycast instead of running it on every rendered frame.
    hoverElapsed.current += dt;
    if (cursorInside.current && hoverElapsed.current >= 0.1) {
      hoverElapsed.current = 0;
      state.scene.updateMatrixWorld();
      state.events.update?.();
    }
  });
  const gltf = useLoader(GLTFLoader, '/models/iss.glb', (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const { scene, center, scale, materials } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    // Keep hover changes local; the GLTF loader caches and shares source materials.
    const copies = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const copy = (material: MeshStandardMaterial) => {
        if (!copies.has(material)) copies.set(material, material.clone());
        return copies.get(material)!;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(copy)
        : copy(object.material);
    });
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    return {
      scene,
      center: bounds.getCenter(new Vector3()).negate(),
      scale: 0.75 / Math.max(size.x, size.y, size.z),
      materials: [...copies.values()].map((material) => ({
        material,
        emissive: material.emissive.clone(),
        intensity: material.emissiveIntensity,
      })),
    };
  }, [gltf]);
  useEffect(() => {
    for (const { material, emissive, intensity } of materials) {
      material.setValues({
        emissive: hovered ? '#90d5ff' : emissive,
        emissiveIntensity: hovered ? 0.65 : intensity,
      });
    }
  }, [hovered, materials]);
  useEffect(
    () => () => {
      for (const { material } of materials) material.dispose();
    },
    [materials],
  );

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
                <primitive
                  object={scene}
                  dispose={null}
                  onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                    event.stopPropagation();
                    setHovered(true);
                  }}
                  onPointerOut={() => setHovered(false)}
                  onPointerDown={(event: ThreeEvent<PointerEvent>) =>
                    event.stopPropagation()
                  }
                  onClick={(event: ThreeEvent<MouseEvent>) => {
                    event.stopPropagation();
                    if (event.delta <= 5) onInspect();
                  }}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
