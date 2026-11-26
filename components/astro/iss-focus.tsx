'use client';

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

function DetailedISS({ onReady }: { onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, '/models/iss-detail.glb', (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const rotation = useRef<Group>(null);
  const reduce = useRef(false);
  const { scene, center, scale } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    return {
      scene,
      center: bounds.getCenter(new Vector3()).negate(),
      scale: 3.8 / Math.max(size.x, size.y, size.z),
    };
  }, [gltf]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduce.current = media.matches;
    };
    update();
    media.addEventListener('change', update);
    onReady();
    return () => media.removeEventListener('change', update);
  }, [onReady]);
  useFrame((_, dt) => {
    if (rotation.current && !reduce.current)
      rotation.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={rotation} rotation={[0.35, -0.4, -0.2]}>
      <group scale={scale}>
        <group position={center}>
          <primitive object={scene} dispose={null} />
        </group>
      </group>
    </group>
  );
}

class ModelBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="iss-focus-status" role="alert">
        <p>The detailed model could not load.</p>
        <button
          className="iss-model-retry"
          onClick={() => {
            useLoader.clear(GLTFLoader, '/models/iss-detail.glb');
            this.setState({ failed: false });
          }}
        >
          Retry model
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function ISSFocus({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      const target =
        previous instanceof HTMLElement && previous !== document.body
          ? previous
          : document.querySelector<HTMLButtonElement>('.iss-inspect-trigger');
      target?.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="iss-focus"
      aria-labelledby="iss-focus-title"
      aria-describedby="iss-focus-summary"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <button
        className="iss-focus-close"
        aria-label="Close ISS focus"
        onClick={() => dialog.current?.close()}
      >
        ✕
      </button>
      <div className="iss-focus-layout">
        <div className="iss-focus-visual">
          <p className="eyebrow">01 / STRUCTURE STUDY</p>
          <figure
            className="iss-focus-canvas"
            aria-label="Detailed 3D International Space Station rotating slowly in place"
          >
            <ModelBoundary>
              {!loaded && (
                <output className="iss-focus-status" aria-live="polite">
                  Loading detailed model…
                </output>
              )}
              <Canvas
                dpr={[1, 1.75]}
                camera={{ position: [0, 0, 7], fov: 40 }}
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={0.9} />
                <directionalLight position={[-3, 4, 6]} intensity={2.8} />
                <directionalLight
                  position={[4, -1, -3]}
                  intensity={1.5}
                  color="#a9dfff"
                />
                <Suspense fallback={null}>
                  <DetailedISS onReady={() => setLoaded(true)} />
                </Suspense>
              </Canvas>
            </ModelBoundary>
          </figure>
          <p className="iss-focus-credit">
            NASA 3D model · Detailed inspection view
          </p>
        </div>
        <section className="iss-focus-info">
          <p className="eyebrow">HUMANITY IN ORBIT</p>
          <h2 id="iss-focus-title">
            International
            <br />
            Space Station
          </h2>
          <p id="iss-focus-summary">
            A laboratory in free fall, circling Earth while crews explore how to
            live and work beyond it.
          </p>
          <dl className="iss-focus-stats">
            <div>
              <dt>Approximate real-life velocity</dt>
              <dd>
                7.66 <small>km/s</small>
              </dd>
              <dd className="iss-speed-note">
                ≈ 27,600 km/h · relative to Earth’s center
              </dd>
            </div>
            <div>
              <dt>Typical altitude</dt>
              <dd>
                ~400 <small>km</small>
              </dd>
            </div>
            <div>
              <dt>Orbital period</dt>
              <dd>
                ~90–93 <small>minutes</small>
              </dd>
            </div>
            <div>
              <dt>Orbital inclination</dt>
              <dd>
                51.6<small>°</small>
              </dd>
            </div>
          </dl>
          <h3>A few things to know</h3>
          <ul>
            <li>Crews experience roughly 16 sunrises and sunsets every day.</li>
            <li>
              The first station module launched in 1998. People have lived
              aboard continuously since November 2000.
            </li>
            <li>
              Astronauts float because they and the station are falling around
              Earth together—not because gravity disappears.
            </li>
          </ul>
          <p className="iss-focus-note">
            Typical figures, not live telemetry. Altitude and speed vary. The
            landing-page orbit is accelerated to 90 seconds, with size and
            altitude exaggerated.
          </p>
          <a
            href="https://www.nasa.gov/international-space-station/space-station-facts-and-figures/"
            target="_blank"
            rel="noreferrer"
          >
            NASA · Station facts and figures ↗
          </a>
        </section>
      </div>
    </dialog>,
    document.body,
  );
}
