'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { equatorial, starColor, type SkyFeature } from '@/lib/astro/data';
function Earth() {
  const globe = useRef<THREE.Group>(null);
  const map = useLoader(THREE.TextureLoader, '/assets/earth-map.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const reduce = useRef(false);
  useEffect(() => {
    reduce.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
  }, []);
  useFrame((_, dt) => {
    if (globe.current && !reduce.current)
      globe.current.rotation.y += Math.min(dt, 0.05) * 0.018;
  });
  return (
    <group position={[1.85, -0.18, 0]} rotation={[0.05, 0, -0.16]}>
      <group ref={globe} rotation={[0, -1.9, 0]}>
        <mesh>
          <sphereGeometry args={[2.42, 96, 64]} />
          <meshStandardMaterial map={map} roughness={0.92} metalness={0.03} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[2.465, 96, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          vertexShader={`varying vec3 n;varying vec3 eye;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`}
          fragmentShader={`varying vec3 n;varying vec3 eye;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(eye))),3.);gl_FragColor=vec4(.14,.43,.95,f*.85);}`}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.52, 64, 40]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          vertexShader={`varying vec3 n;varying vec3 eye;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`}
          fragmentShader={`varying vec3 n;varying vec3 eye;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(eye))),5.);gl_FragColor=vec4(.1,.3,.8,f*.12);}`}
        />
      </mesh>
    </group>
  );
}
function RealStars({ stars }: { stars: SkyFeature[] }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry(),
      positions: number[] = [],
      colors: number[] = [],
      sizes: number[] = [];
    for (const s of stars) {
      positions.push(...equatorial(...s.geometry.coordinates, 90));
      const c = new THREE.Color(starColor(Number(s.properties.bv)));
      colors.push(c.r, c.g, c.b);
      sizes.push(Math.max(0.75, 3.5 * Math.pow(10, -0.12 * s.properties.mag)));
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    return g;
  }, [stars]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`attribute float size;attribute vec3 color;varying vec3 col;void main(){col=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*1.5;}`}
        fragmentShader={`varying vec3 col;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(col,exp(-r*r*4.)*.65);}`}
      />
    </points>
  );
}
export default function HeroEarth() {
  const [ready, setReady] = useState(false),
    [stars, setStars] = useState<SkyFeature[]>([]);
  useEffect(() => {
    setReady(true);
    fetch('/data/stars.json')
      .then((r) => r.json())
      .then((d: any) => setStars(d.features))
      .catch(() => {});
  }, []);
  return (
    <div
      className="hero-earth"
      aria-label="Slowly rotating 3D Earth using NASA Blue Marble imagery"
    >
      {ready && (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 8.2], fov: 42, near: 0.1, far: 200 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.12} />
          <directionalLight
            position={[-4, 3, 6]}
            intensity={2.6}
            color="#e6f2ff"
          />
          <Suspense fallback={null}>
            <Earth />
          </Suspense>
          <RealStars stars={stars} />
        </Canvas>
      )}
    </div>
  );
}
