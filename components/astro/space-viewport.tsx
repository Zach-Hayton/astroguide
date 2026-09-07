'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { Body, RotationAxis } from 'astronomy-engine';
import {
  AU_KM,
  LY_KM,
  PLANETS,
  DEEP,
  equatorial,
  position,
  axis,
  starColor,
  starObject,
  formatDistance,
  type Dataset,
  type SpaceObject,
  type Mode,
  type Vec3,
} from '@/lib/astro/data';
export type ViewCommand = {
  serial: number;
  type: 'object' | 'overview' | 'zoom' | 'light' | 'depth';
  object?: SpaceObject;
  factor?: number;
  from?: Vec3;
  to?: Vec3;
};
export type LightState = { from: Vec3; to: Vec3; progress: number } | null;
type Props = {
  data: Dataset;
  selected: SpaceObject;
  date: Date;
  mode: Mode;
  cinematic: boolean;
  lines: boolean;
  labels: boolean;
  command: ViewCommand;
  light: LightState;
  onSelect: (o: SpaceObject) => void;
  onDistance: (s: string) => void;
};
// Representative cinematic radii, deliberately separate from catalog measurements.
const stellarDisplayRadius = (o: SpaceObject) =>
  695700 *
  (o.star && o.star.absMag < -3 ? 80 : o.star && o.star.absMag < 0 ? 8 : 1);
const v = (a: Vec3) => new T.Vector3(...a);
const planetVertex = `varying vec3 n; varying vec3 eye; varying vec2 tex; void main(){n=normalize(mat3(modelMatrix)*normal);eye=normalize(cameraPosition-(modelMatrix*vec4(position,1.)).xyz);tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const planetFragment = `uniform vec3 tint;uniform vec3 sunDir;uniform sampler2D surface;uniform float mapped;uniform float selfLit;uniform float cinema;uniform float earth;varying vec3 n;varying vec3 eye;varying vec2 tex;void main(){vec3 c=tint;if(mapped>.5)c=texture2D(surface,tex).rgb;vec3 normal=normalize(n);float day=max(dot(normal,sunDir),0.);float light=mix(.012+day*.95,.13+pow(day,.65)*1.08,cinema);vec3 result=c*mix(light,1.,selfLit);float rim=pow(1.-max(dot(normal,normalize(eye)),0.),3.);result+=vec3(.10,.30,.55)*rim*cinema*(1.-selfLit)*.35;float ocean=smoothstep(.015,.15,c.b-max(c.r,c.g));float spec=pow(max(dot(reflect(-sunDir,normal),normalize(eye)),0.),38.);result+=vec3(.6,.8,1.)*spec*ocean*earth*cinema*.5;gl_FragColor=vec4(result,1.);}`;
const starVertex = `attribute float pointSize;attribute vec3 tint;varying vec3 col;void main(){col=tint;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=pointSize;}`;
const starFragment = `uniform float exposure;varying vec3 col;void main(){float r=length(gl_PointCoord-vec2(.5))*2.;if(r>1.)discard;float a=exp(-r*r*7.)*.55+exp(-r*r*55.);gl_FragColor=vec4(col*exposure,a);}`;
export default function SpaceViewport(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState('');
  useEffect(() => {
    if (!host.current) return;
    const root = host.current;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        logarithmicDepthBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setError(
        'Your browser could not start the 3D view. Enable hardware acceleration, then reload. You can still search objects and read their details.',
      );
      return;
    }
    renderer.setClearColor('#03070d');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    root.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D astronomy view. Drag to rotate, scroll to zoom, shift-drag to pan.',
    );
    renderer.domElement.tabIndex = 0;
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(48, 1, 0.00000001, 1e24);
    const overlay = document.createElement('div');
    overlay.className = 'space-labels';
    root.appendChild(overlay);
    let width = 1,
      height = 1;
    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    const startObj = PLANETS.find((o) => o.id === 'earth')!;
    let target = v(position(startObj, latest.current.date)),
      goalTarget = target.clone(),
      logR = Math.log(24500),
      goalLogR = logR;
    const initialSun = target.clone().normalize();
    let theta = Math.atan2(-initialSun.x, -initialSun.z) + 0.65,
      phi = 1.2,
      goalTheta = theta,
      goalPhi = phi;
    let skyRA = (83.8 * Math.PI) / 180,
      skyDec = 0,
      skyFov = 65,
      goalSkyFov = 65;
    let follow: SpaceObject | null = startObj;
    const sphere = new T.SphereGeometry(1, 96, 64);
    const loader = new T.TextureLoader();
    const textures: T.Texture[] = [];
    let disposed = false;
    const planetMeshes = PLANETS.map((o) => {
      const mat = new T.ShaderMaterial({
        vertexShader: planetVertex,
        fragmentShader: planetFragment,
        uniforms: {
          tint: { value: new T.Color(o.color) },
          sunDir: { value: new T.Vector3(1, 0, 0) },
          surface: { value: null },
          mapped: { value: 0 },
          selfLit: { value: o.id === 'sun' ? 1 : 0 },
          cinema: { value: 1 },
          earth: { value: o.id === 'earth' ? 1 : 0 },
        },
      });
      const mesh = new T.Mesh(sphere, mat);
      scene.add(mesh);
      const texture = loader.load(
        '/assets/' + o.id + '-map.jpg',
        (t) => {
          if (disposed) {
            t.dispose();
            return;
          }
          t.colorSpace = T.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          mat.uniforms.surface.value = t;
          mat.uniforms.mapped.value = 1;
        },
        undefined,
        () => {},
      );
      textures.push(texture);
      return { o, mesh, mat, pos: v(position(o, latest.current.date)) };
    });
    const atmosphere = new T.Mesh(
      new T.SphereGeometry(1.025, 64, 40),
      new T.ShaderMaterial({
        transparent: true,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        vertexShader: `varying vec3 n;varying vec3 eye;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `varying vec3 n;varying vec3 eye;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(eye))),3.);gl_FragColor=vec4(.15,.47,.95,f*.35);}`,
      }),
    );
    scene.add(atmosphere);
    const ring = new T.Mesh(
      new T.RingGeometry(1.24, 2.32, 128),
      new T.ShaderMaterial({
        side: T.DoubleSide,
        transparent: true,
        depthWrite: false,
        vertexShader: `varying float rad;void main(){rad=length(position.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying float rad;void main(){float t=(rad-1.24)/1.08;float bands=.7+.12*sin(t*155.)+.08*sin(t*510.);float gap=1.-.85*exp(-pow((t-.66)*65.,2.));vec3 col=mix(vec3(.34,.29,.22),vec3(.86,.79,.64),smoothstep(0.,.45,t));float a=bands*gap*smoothstep(0.,.05,t)*(1.-smoothstep(.94,1.,t));gl_FragColor=vec4(col,a);}`,
      }),
    );
    scene.add(ring);
    const orbitGroup = new T.Group();
    scene.add(orbitGroup);
    let orbitRecords: { line: T.Line; coords: Vec3[]; parent?: string }[] = [];
    const buildOrbits = (date: Date) => {
      orbitRecords.forEach((r) => {
        r.line.geometry.dispose();
        (r.line.material as T.Material).dispose();
      });
      orbitGroup.clear();
      orbitRecords = [];
      for (const o of PLANETS) {
        if (!o.periodDays) continue;
        const coords = Array.from({ length: 181 }, (_, i) => {
          const when = new Date(
            date.getTime() + (o.periodDays! * 86400000 * i) / 180,
          );
          const p = position(o, when);
          if (o.id === 'moon') {
            const e = position(startObj, when);
            return p.map((x, k) => x - e[k]) as Vec3;
          }
          return p;
        });
        const geometry = new T.BufferGeometry();
        geometry.setAttribute(
          'position',
          new T.Float32BufferAttribute(new Float32Array(coords.length * 3), 3),
        );
        const line = new T.Line(
          geometry,
          new T.LineBasicMaterial({
            color: o.id === 'earth' ? '#4d9491' : '#385169',
            transparent: true,
            opacity: o.id === 'earth' ? 0.35 : 0.18,
            depthWrite: false,
          }),
        );
        orbitGroup.add(line);
        orbitRecords.push({
          line,
          coords,
          parent: o.id === 'moon' ? 'earth' : undefined,
        });
      }
    };
    buildOrbits(latest.current.date);
    const starCoords = props.data.stars.map((s) =>
      equatorial(s.ra, s.dec, s.distanceLy * LY_KM),
    );
    const skyCoords = props.data.sky.map((s) =>
      equatorial(s.geometry.coordinates[0], s.geometry.coordinates[1], 10),
    );
    function makePoints(count: number) {
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        'position',
        new T.BufferAttribute(new Float32Array(count * 3), 3),
      );
      geometry.setAttribute(
        'pointSize',
        new T.BufferAttribute(new Float32Array(count), 1),
      );
      geometry.setAttribute(
        'tint',
        new T.BufferAttribute(new Float32Array(count * 3), 3),
      );
      const material = new T.ShaderMaterial({
        uniforms: { exposure: { value: 1 } },
        vertexShader: starVertex,
        fragmentShader: starFragment,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
      });
      const points = new T.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      return points;
    }
    const stars = makePoints(props.data.stars.length),
      skyStars = makePoints(props.data.sky.length);
    props.data.stars.forEach((s, i) => {
      const c = new T.Color(starColor(s.bv));
      (stars.geometry.attributes.tint as T.BufferAttribute).setXYZ(
        i,
        c.r,
        c.g,
        c.b,
      );
    });
    props.data.sky.forEach((s, i) => {
      const c = new T.Color(starColor(Number(s.properties.bv)));
      (skyStars.geometry.attributes.tint as T.BufferAttribute).setXYZ(
        i,
        c.r,
        c.g,
        c.b,
      );
      (skyStars.geometry.attributes.position as T.BufferAttribute).setXYZ(
        i,
        ...skyCoords[i],
      );
      (skyStars.geometry.attributes.pointSize as T.BufferAttribute).setX(
        i,
        Math.min(20, 3 + 16 * Math.pow(10, -0.17 * (s.properties.mag + 1.4))) *
          renderer.getPixelRatio(),
      );
    });
    // An artistic, camera-centered backdrop. Catalog stars remain separate/selectable.
    let seed = 1249;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const backdrop = makePoints(28000);
    const dust = makePoints(9000);
    const bandRotation = new T.Quaternion().setFromEuler(
      new T.Euler(0.65, 0.3, -0.6),
    );
    for (const [cloud, count, haze] of [
      [backdrop, 28000, false],
      [dust, 9000, true],
    ] as const) {
      for (let i = 0; i < count; i++) {
        const band = haze || i > 13000;
        const longitude = random() * Math.PI * 2;
        const latitude = band
          ? (random() + random() + random() - 1.5) * (haze ? 0.18 : 0.28)
          : Math.asin(random() * 2 - 1);
        const pt = new T.Vector3(
          Math.cos(latitude) * Math.cos(longitude),
          Math.sin(latitude),
          Math.cos(latitude) * Math.sin(longitude),
        )
          .applyQuaternion(bandRotation)
          .multiplyScalar(1000);
        (cloud.geometry.attributes.position as T.BufferAttribute).setXYZ(
          i,
          pt.x,
          pt.y,
          pt.z,
        );
        const warmth = random();
        const color = new T.Color()
          .setRGB(
            0.48 + warmth * 0.4,
            0.58 + warmth * 0.25,
            0.88 - warmth * 0.16,
          )
          .multiplyScalar(haze ? 0.045 : 0.42 + random() * 0.5);
        (cloud.geometry.attributes.tint as T.BufferAttribute).setXYZ(
          i,
          color.r,
          color.g,
          color.b,
        );
        (cloud.geometry.attributes.pointSize as T.BufferAttribute).setX(
          i,
          (haze ? 18 + random() * 42 : 0.8 + Math.pow(random(), 5) * 3.8) *
            renderer.getPixelRatio(),
        );
      }
      (cloud.material as T.ShaderMaterial).depthTest = false;
      cloud.renderOrder = -10;
    }
    const skyGlow = new T.Mesh(
      new T.SphereGeometry(900, 48, 24),
      new T.ShaderMaterial({
        side: T.BackSide,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        vertexShader: `varying vec3 dir;void main(){dir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 dir;void main(){float haze=pow(max(0.,1.-abs(dir.y+.22)),16.);gl_FragColor=vec4(.07,.18,.31,haze*.23);}`,
      }),
    );
    skyGlow.renderOrder = -11;
    scene.add(skyGlow);
    const guides = new T.Group();
    scene.add(guides);
    for (const c of props.data.lines) {
      const pts: number[] = [];
      for (const chain of c.geometry.coordinates) {
        for (let i = 1; i < chain.length; i++) {
          // Interpolate along the celestial sphere rather than cutting long chords.
          const a = v(equatorial(...chain[i - 1], 9.9)),
            b = v(equatorial(...chain[i], 9.9));
          for (let k = 0; k < 8; k++) {
            pts.push(
              ...a
                .clone()
                .lerp(b, k / 8)
                .normalize()
                .multiplyScalar(9.9)
                .toArray(),
              ...a
                .clone()
                .lerp(b, (k + 1) / 8)
                .normalize()
                .multiplyScalar(9.9)
                .toArray(),
            );
          }
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      const line = new T.LineSegments(
        g,
        new T.LineBasicMaterial({
          color: '#6facc1',
          opacity: 0.33,
          transparent: true,
          depthWrite: false,
        }),
      );
      line.name = c.id;
      guides.add(line);
    }
    const stellarMaterial = new T.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new T.Color('#ffd49b') },
      },
      vertexShader: `varying vec3 p;varying vec3 norm;varying vec3 eye;void main(){p=position;norm=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float time;uniform vec3 color;varying vec3 p;varying vec3 norm;varying vec3 eye;
      float hash(vec3 q){return fract(sin(dot(q,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 q){vec3 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 q=p*16.+vec3(time*.12,time*.07,0.);float cells=noise(q+noise(q*2.)*2.);float detail=noise(q*4.+time*.08);float limb=.45+.55*pow(max(dot(normalize(norm),normalize(eye)),0.),.35);float plasma=.55+cells*.65+detail*.25;vec3 c=mix(color*.55,vec3(1.,.97,.88),smoothstep(.42,.92,cells)*.55);gl_FragColor=vec4(c*plasma*limb,1.);}`,
    });
    const stellarSurface = new T.Mesh(
      new T.SphereGeometry(1, 96, 64),
      stellarMaterial,
    );
    scene.add(stellarSurface);
    const stellarCorona = new T.Mesh(
      new T.SphereGeometry(1.28, 64, 40),
      new T.ShaderMaterial({
        transparent: true,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: {
          color: { value: new T.Color('#ffbb66') },
          time: { value: 0 },
        },
        vertexShader: `varying vec3 n;varying vec3 eye;varying vec3 p;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `uniform vec3 color;uniform float time;varying vec3 n;varying vec3 eye;varying vec3 p;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(eye))),3.5);float filaments=.7+.15*sin(atan(p.z,p.x)*37.+sin(p.y*23.+time*.3));gl_FragColor=vec4(color,f*filaments*.5);}`,
      }),
    );
    scene.add(stellarCorona);
    const deepMeshes = DEEP.map((o) => {
      let mesh: T.Object3D;
      if (o.type === 'Black hole') {
        const group = new T.Group();
        group.add(
          new T.Mesh(sphere, new T.MeshBasicMaterial({ color: '#000000' })),
        );
        const disk = new T.Mesh(
          new T.RingGeometry(2.7, 12, 160, 1),
          new T.ShaderMaterial({
            side: T.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
            uniforms: { time: { value: 0 } },
            vertexShader: `varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
            fragmentShader: `uniform float time;varying vec3 p;void main(){float r=length(p.xy);float a=atan(p.y,p.x);float bands=.7+.15*sin(r*17.+sin(a*8.+time)*.35)+.12*sin(r*53.);float alpha=smoothstep(2.7,3.1,r)*(1.-smoothstep(3.,12.,r));vec3 c=mix(vec3(1.,.92,.65),vec3(.9,.23,.035),clamp((r-3.)/7.,0.,1.));gl_FragColor=vec4(c,bands*alpha);}`,
          }),
        );
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        mesh = group;
      } else if (o.image) {
        const tex = loader.load(o.image);
        textures.push(tex);
        tex.colorSpace = T.SRGBColorSpace;
        mesh = new T.Mesh(
          new T.PlaneGeometry(2, 2),
          new T.ShaderMaterial({
            uniforms: { image: { value: tex } },
            side: T.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
            vertexShader: `varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
            fragmentShader: `uniform sampler2D image;varying vec2 tex;void main(){vec3 c=texture2D(image,tex).rgb;vec2 edge=smoothstep(vec2(0.),vec2(.19),tex)*smoothstep(vec2(0.),vec2(.19),1.-tex);float glow=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c,edge.x*edge.y*smoothstep(.015,.16,glow)*.9);}`,
          }),
        );
      } else {
        const n = 24000,
          pts = new Float32Array(n * 3),
          colors = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const r = Math.pow((i * 0.61803398875) % 1, i % 4 === 0 ? 2.8 : 0.6);
          const spiral =
            (i % 2) * Math.PI + Math.log(r + 0.02) * 3 + Math.sin(i * 17) * 0.3;
          pts.set(
            [
              Math.cos(spiral) * r,
              Math.sin(i * 19) * (i % 4 === 0 ? 0.1 : 0.025) * Math.exp(-r * 4),
              Math.sin(spiral) * r * 0.65,
            ],
            i * 3,
          );
          const c = new T.Color().setRGB(
            1.0 - r * 0.5,
            0.78 - r * 0.16,
            0.48 + r * 0.5,
          );
          colors.set([c.r, c.g, c.b], i * 3);
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(pts, 3));
        g.setAttribute('tint', new T.BufferAttribute(colors, 3));
        g.setAttribute(
          'pointSize',
          new T.BufferAttribute(
            Float32Array.from(
              { length: n },
              (_, i) => (i % 13 === 0 ? 4.5 : 2.2) * renderer.getPixelRatio(),
            ),
            1,
          ),
        );
        mesh = new T.Points(
          g,
          new T.ShaderMaterial({
            uniforms: { exposure: { value: 0.72 } },
            vertexShader: starVertex,
            fragmentShader: starFragment,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
          }),
        );
        mesh.rotation.z = 0.4;
      }
      scene.add(mesh);
      return { o, mesh, pos: v(position(o, latest.current.date)) };
    });
    const pulseGeo = new T.BufferGeometry().setFromPoints([
      new T.Vector3(),
      new T.Vector3(),
    ]);
    const pulseLine = new T.Line(
      pulseGeo,
      new T.LineBasicMaterial({
        color: '#b6eadc',
        transparent: true,
        opacity: 0.55,
      }),
    );
    scene.add(pulseLine);
    const pulse = makePoints(1);
    (pulse.geometry.attributes.tint as T.BufferAttribute).setXYZ(
      0,
      0.8,
      1,
      0.9,
    );
    (pulse.geometry.attributes.pointSize as T.BufferAttribute).setX(
      0,
      28 * renderer.getPixelRatio(),
    );
    const labelMap = new Map<string, HTMLButtonElement>();
    const candidates: SpaceObject[] = [
      ...PLANETS,
      ...DEEP,
      ...props.data.stars
        .filter((s) => s.named && s.mag < 1.5)
        .slice(0, 25)
        .map(starObject),
    ];
    const addLabel = (o: SpaceObject) => {
      if (labelMap.has(o.id)) return;
      const el = document.createElement('button');
      el.className = 'space-label';
      el.textContent = o.name;
      el.onclick = () => latest.current.onSelect(o);
      overlay.appendChild(el);
      labelMap.set(o.id, el);
    };
    candidates.forEach(addLabel);
    props.data.constellations.forEach((c) => {
      const o = {
        id: 'con-' + c.id,
        name: c.properties.name,
        type: 'Constellation',
        ra: c.geometry.coordinates[0],
        dec: c.geometry.coordinates[1],
      } as SpaceObject;
      addLabel(o);
      labelMap.get(o.id)!.onclick = () => {
        const full = latest.current.data.constellations.find(
          (x) => x.id === c.id,
        );
        if (full) {
          import('@/lib/astro/data').then((m) =>
            latest.current.onSelect(m.constellationObject(full)),
          );
        }
      };
    });
    scene.traverse((obj) => {
      if ('material' in obj) {
        const m = obj.material;
        if (m instanceof T.ShaderMaterial) {
          m.vertexShader =
            '#include <common>\n#include <logdepthbuf_pars_vertex>\n' +
            m.vertexShader.replace(
              /}\s*$/,
              '\n#include <logdepthbuf_vertex>\n}',
            );
          m.fragmentShader =
            '#include <logdepthbuf_pars_fragment>\n' +
            m.fragmentShader.replace(
              /}\s*$/,
              '\n#include <logdepthbuf_fragment>\n}',
            );
        }
      }
    });
    const sunGlow = new T.Mesh(
      new T.SphereGeometry(1.13, 48, 32),
      (atmosphere.material as T.ShaderMaterial).clone(),
    );
    (sunGlow.material as T.ShaderMaterial).fragmentShader = (
      sunGlow.material as T.ShaderMaterial
    ).fragmentShader.replace(
      'vec4(.15,.47,.95,f*.35)',
      'vec4(1.,.58,.15,f*.65)',
    );
    scene.add(sunGlow);
    const held = new Set<string>();
    let lastCmd = -1,
      lastCinematic = latest.current.cinematic,
      lastMode: Mode = 'space',
      lastDate = latest.current.date.getTime(),
      lastOrbitDate = lastDate,
      frame = 0,
      raf = 0,
      lastTime = performance.now();
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    function fly(o: SpaceObject) {
      if (latest.current.mode === 'sky') {
        skyRA = ((o.ra ?? 83.8) * Math.PI) / 180;
        skyDec = ((o.dec ?? 0) * Math.PI) / 180;
        goalSkyFov = o.type === 'Constellation' ? 55 : 30;
        return;
      }
      follow = o.body ? o : null;
      goalTarget.copy(v(position(o, latest.current.date)));
      goalLogR = Math.log(
        o.radiusKm
          ? o.radiusKm *
              (o.type === 'Black hole'
                ? 38
                : latest.current.cinematic
                  ? o.id === 'saturn'
                    ? 6.5
                    : 3.7
                  : 5)
          : o.star && latest.current.cinematic
            ? stellarDisplayRadius(o) * 4.5
            : Math.max(0.08, (o.distanceLy ?? 1) * 0.015) * LY_KM,
      );
      if (o.body && o.id !== 'sun') {
        const sun = goalTarget.clone().normalize();
        goalTheta = Math.atan2(-sun.x, -sun.z) + 0.65;
        goalPhi = 1.25;
      } else {
        goalTheta = 0.6;
        goalPhi = 1.15;
      }
    }
    function animate(time: number) {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const p = latest.current;
      const dt = Math.min(0.08, (time - lastTime) / 1000);
      lastTime = time;
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 7);
      if (p.cinematic !== lastCinematic) {
        lastCinematic = p.cinematic;
        if (p.selected.star && !p.light) fly(p.selected);
      }
      if (p.date.getTime() !== lastDate) {
        lastDate = p.date.getTime();
        planetMeshes.forEach((r) => r.pos.copy(v(position(r.o, p.date))));
        if (Math.abs(lastDate - lastOrbitDate) > 86400000 * 30) {
          buildOrbits(p.date);
          lastOrbitDate = lastDate;
        }
      }
      if (p.mode !== lastMode) {
        lastMode = p.mode;
        if (p.mode === 'sky') {
          skyRA = ((p.selected.ra ?? 83.8) * Math.PI) / 180;
          skyDec = ((p.selected.dec ?? 0) * Math.PI) / 180;
          goalSkyFov = 65;
        } else fly(p.selected.type === 'Constellation' ? startObj : p.selected);
      }
      if (p.command.serial !== lastCmd) {
        lastCmd = p.command.serial;
        const cmd = p.command;
        if (cmd.type === 'object' && cmd.object) fly(cmd.object);
        if (cmd.type === 'zoom') {
          if (p.mode === 'sky')
            goalSkyFov = T.MathUtils.clamp(
              goalSkyFov * (cmd.factor ?? 1),
              2,
              100,
            );
          else
            goalLogR = T.MathUtils.clamp(
              goalLogR + Math.log(cmd.factor ?? 1),
              Math.log(200),
              Math.log(1e8 * LY_KM),
            );
        }
        if (cmd.type === 'overview') {
          follow = null;
          goalTarget.set(0, 0, 0);
          goalLogR = Math.log(65 * AU_KM);
          goalTheta = 0.35;
          goalPhi = 0.5;
        }
        if (cmd.type === 'light' && cmd.from && cmd.to) {
          follow = null;
          const a = v(cmd.from),
            b = v(cmd.to);
          goalTarget.copy(a).lerp(b, 0.5);
          goalLogR = Math.log(a.distanceTo(b) * 1.5);
          const dir = b.clone().sub(a).normalize(),
            side = new T.Vector3(-dir.z, 0.35, dir.x).normalize();
          goalTheta = Math.atan2(side.x, side.z);
          goalPhi = Math.acos(side.y);
        }
        if (cmd.type === 'depth' && cmd.object) {
          follow = null;
          const con = cmd.object.id.slice(4).replace(/\d/g, '');
          const group = p.data.stars.filter(
            (s) => s.constellation === con && s.mag < 6.5,
          );
          if (group.length) {
            goalTarget.set(0, 0, 0);
            group.forEach((s) =>
              goalTarget.add(v(equatorial(s.ra, s.dec, s.distanceLy * LY_KM))),
            );
            goalTarget.multiplyScalar(1 / group.length);
            goalLogR = Math.log(
              Math.max(
                20 * LY_KM,
                ...group.map((s) =>
                  v(equatorial(s.ra, s.dec, s.distanceLy * LY_KM)).distanceTo(
                    goalTarget,
                  ),
                ),
              ) * 1.8,
            );
            goalTheta = 0.2;
            goalPhi = 1.2;
          }
        }
      }
      if (p.mode === 'space' && held.size) {
        follow = null;
        const forward = camera.getWorldDirection(new T.Vector3()),
          right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const pace = Math.exp(logR) * dt * 0.65;
        const a = Number(held.has('w')) - Number(held.has('s')),
          b = Number(held.has('d')) - Number(held.has('a')),
          c = Number(held.has('e')) - Number(held.has('q'));
        goalTarget
          .addScaledVector(forward, a * pace)
          .addScaledVector(right, b * pace);
        goalTarget.y += c * pace;
      }
      if (follow && p.mode === 'space')
        goalTarget.copy(v(position(follow, p.date)));
      target.lerp(goalTarget, blend);
      logR += (goalLogR - logR) * blend;
      theta += (goalTheta - theta) * blend;
      phi += (goalPhi - phi) * blend;
      skyFov += (goalSkyFov - skyFov) * blend;
      goalLogR = T.MathUtils.clamp(
        goalLogR,
        Math.log(
          p.cinematic && p.selected.star && !p.light
            ? stellarDisplayRadius(p.selected) * 1.4
            : follow?.radiusKm
              ? follow.radiusKm * 1.1
              : 200,
        ),
        Math.log(1e8 * LY_KM),
      );
      const radius = Math.exp(logR);
      if (p.mode === 'sky') {
        camera.position.set(0, 0, 0);
        camera.fov = skyFov;
        camera.lookAt(
          ...equatorial((skyRA * 180) / Math.PI, (skyDec * 180) / Math.PI, 1),
        );
      } else {
        camera.position.set(
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.cos(theta),
        );
        camera.fov = 48;
        camera.lookAt(0, 0, 0);
      }
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const solar = p.mode === 'space';
      backdrop.visible = dust.visible = p.cinematic;
      skyGlow.visible = p.cinematic && !solar;
      backdrop.position.copy(camera.position);
      dust.position.copy(camera.position);
      skyGlow.position.copy(camera.position);
      // Keep the backdrop stable while gently varying stellar exposure.
      const twinkle = reduced ? 1 : 0.97 + Math.sin(time * 0.0007) * 0.03;
      (backdrop.material as T.ShaderMaterial).uniforms.exposure.value = twinkle;
      const cinematicScale = p.cinematic && !p.light;

      const showSurface = solar && p.cinematic && !!p.selected.star && !p.light;
      stellarSurface.visible = stellarCorona.visible = showSurface;
      if (showSurface) {
        const size = stellarDisplayRadius(p.selected) / radius;
        stellarSurface.position
          .copy(v(position(p.selected, p.date)))
          .sub(target)
          .divideScalar(radius);
        stellarSurface.scale.setScalar(size);
        stellarSurface.rotation.y = reduced ? 0 : time * 0.000035;
        stellarCorona.position.copy(stellarSurface.position);
        stellarCorona.scale.copy(stellarSurface.scale);
        const col = new T.Color(starColor(p.selected.star!.bv));
        stellarMaterial.uniforms.color.value.copy(col);
        stellarMaterial.uniforms.time.value = reduced ? 0 : time * 0.001;
        (stellarCorona.material as T.ShaderMaterial).uniforms.color.value.copy(
          col,
        );
        (stellarCorona.material as T.ShaderMaterial).uniforms.time.value =
          reduced ? 0 : time * 0.001;
      }
      planetMeshes.forEach(({ o, mesh, mat, pos }) => {
        mesh.visible = solar;
        mesh.position.copy(pos).sub(target).divideScalar(radius);
        const actual = o.radiusKm! / radius;
        // Physical centers are preserved; distant bodies receive a readable minimum size.
        const visual = cinematicScale
          ? Math.max(
              actual,
              Math.min(
                0.025,
                mesh.position.distanceTo(camera.position) * 0.009,
              ),
            )
          : actual;
        mesh.scale.setScalar(visual);
        mat.uniforms.cinema.value = p.cinematic ? 1 : 0;
        if (o.body) {
          const pole = v(axis(o, p.date)).normalize();
          mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pole);
          const angle = (RotationAxis(o.body, p.date).spin * Math.PI) / 180;
          mesh.rotateY(angle + (p.cinematic && !reduced ? time * 0.000025 : 0));
        }
        mat.uniforms.sunDir.value.copy(pos).negate().normalize();
      });
      const earth = planetMeshes.find((x) => x.o.id === 'earth')!,
        saturn = planetMeshes.find((x) => x.o.id === 'saturn')!;
      sunGlow.visible = solar;
      sunGlow.position.copy(planetMeshes[0].mesh.position);
      sunGlow.scale.copy(planetMeshes[0].mesh.scale);
      atmosphere.visible = solar;
      atmosphere.position.copy(earth.mesh.position);
      atmosphere.scale.copy(earth.mesh.scale);
      ring.visible = solar;
      ring.position.copy(saturn.mesh.position);
      ring.scale.copy(saturn.mesh.scale);
      ring.quaternion.setFromUnitVectors(
        new T.Vector3(0, 0, 1),
        v(axis(saturn.o, p.date)).normalize(),
      );
      orbitGroup.visible = solar && p.lines;
      for (const r of orbitRecords) {
        const attr = r.line.geometry.attributes.position as T.BufferAttribute;
        for (let i = 0; i < r.coords.length; i++) {
          const coord = r.coords[i];
          attr.setXYZ(
            i,
            (coord[0] + (r.parent ? earth.pos.x : 0) - target.x) / radius,
            (coord[1] + (r.parent ? earth.pos.y : 0) - target.y) / radius,
            (coord[2] + (r.parent ? earth.pos.z : 0) - target.z) / radius,
          );
        }
        attr.needsUpdate = true;
        r.line.frustumCulled = false;
      }
      stars.visible = solar;
      skyStars.visible = !solar;
      guides.visible = !solar && p.lines;
      guides.children.forEach((c) => {
        (c as T.Line).material instanceof T.LineBasicMaterial &&
          (((c as T.Line).material as T.LineBasicMaterial).opacity =
            'con-' + c.name === p.selected.id ? 0.8 : 0.27);
      });
      if (solar) {
        const attr = stars.geometry.attributes.position as T.BufferAttribute,
          size = stars.geometry.attributes.pointSize as T.BufferAttribute;
        for (let i = 0; i < starCoords.length; i++) {
          const xyz = starCoords[i];
          const x = (xyz[0] - target.x) / radius,
            y = (xyz[1] - target.y) / radius,
            z = (xyz[2] - target.z) / radius;
          attr.setXYZ(i, x, y, z);
          const distPc =
            (Math.hypot(
              x - camera.position.x,
              y - camera.position.y,
              z - camera.position.z,
            ) *
              radius) /
            (LY_KM * 3.261563777);
          const mag =
            p.data.stars[i].absMag +
            5 * Math.log10(Math.max(0.000001, distPc)) -
            5;
          size.setX(
            i,
            (showSurface && p.selected.star === p.data.stars[i]
              ? 0
              : mag > (p.cinematic ? 12 : 9)
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      34,
                      (p.cinematic ? 3.5 : 2) +
                        18 * Math.pow(10, -0.17 * (mag + 1.4)),
                    ),
                  )) * renderer.getPixelRatio(),
          );
        }
        attr.needsUpdate = true;
        size.needsUpdate = true;
      }
      deepMeshes.forEach(({ o, mesh, pos }) => {
        mesh.visible = solar;
        mesh.position.copy(pos).sub(target).divideScalar(radius);
        mesh.scale.setScalar(o.radiusKm! / radius);
        if (o.type === 'Nebula') mesh.quaternion.copy(camera.quaternion);
        if (o.type === 'Black hole') {
          const disk = mesh.children[1] as T.Mesh;
          (disk.material as T.ShaderMaterial).uniforms.time.value =
            time * 0.00004;
        }
      });
      pulse.visible = !!p.light && solar;
      pulseLine.visible = !!p.light && solar;
      if (p.light) {
        const a = v(p.light.from).sub(target).divideScalar(radius),
          b = v(p.light.to).sub(target).divideScalar(radius);
        const pa = pulseLine.geometry.attributes.position as T.BufferAttribute;
        pa.setXYZ(0, ...(a.toArray() as Vec3));
        pa.setXYZ(1, ...(b.toArray() as Vec3));
        pa.needsUpdate = true;
        const point = a.lerp(b, p.light.progress);
        (pulse.geometry.attributes.position as T.BufferAttribute).setXYZ(
          0,
          point.x,
          point.y,
          point.z,
        );
        pulse.geometry.attributes.position.needsUpdate = true;
        pulseLine.frustumCulled = false;
      }
      if (frame++ % 3 === 0) {
        labelMap.forEach((el) => (el.style.display = 'none'));
        if (p.labels) {
          addLabel(p.selected);
          const show =
            p.mode === 'sky'
              ? [
                  ...p.data.constellations.map(
                    (c) =>
                      ({
                        id: 'con-' + c.id,
                        name: c.properties.name,
                        type: 'Constellation',
                        ra: c.geometry.coordinates[0],
                        dec: c.geometry.coordinates[1],
                      }) as SpaceObject,
                  ),
                  ...candidates.filter((o) => o.star || o.distanceLy),
                ]
              : [
                  p.selected,
                  ...candidates.filter((o) => o.id !== p.selected.id),
                ];
          const occupied: { x: number; y: number }[] = [];
          for (const o of show) {
            const el = labelMap.get(o.id);
            if (!el) continue;
            const point =
              p.mode === 'sky'
                ? v(equatorial(o.ra ?? 0, o.dec ?? 0, 9.8))
                : v(position(o, p.date)).sub(target).divideScalar(radius);
            if (p.mode === 'space' && o.type === 'Constellation') continue;
            const forward = point
              .clone()
              .sub(camera.position)
              .dot(camera.getWorldDirection(new T.Vector3()));
            if (forward <= 0) continue;
            point.project(camera);
            const x = (point.x * 0.5 + 0.5) * width,
              y = (-point.y * 0.5 + 0.5) * height;
            if (x < 12 || x > width - 80 || y < 18 || y > height - 25) continue;
            if (
              occupied.some(
                (a) => Math.abs(a.x - x) < 90 && Math.abs(a.y - y) < 28,
              )
            )
              continue;
            occupied.push({ x, y });
            el.style.display = 'block';
            el.style.transform = `translate(${x + 9}px,${y - 7}px)`;
            el.classList.toggle('selected', o.id === p.selected.id);
            el.classList.toggle(
              'constellation-label',
              o.type === 'Constellation',
            );
          }
        }
        p.onDistance(
          p.mode === 'sky'
            ? skyFov.toFixed(0) + '° field of view'
            : formatDistance(radius) + ' from focus',
        );
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);
    let drag = false,
      dx = 0,
      dy = 0,
      moved = 0,
      pan = false;
    function down(e: PointerEvent) {
      renderer.domElement.focus({ preventScroll: true });
      drag = true;
      dx = e.clientX;
      dy = e.clientY;
      moved = 0;
      pan = e.shiftKey || e.button === 2;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function move(e: PointerEvent) {
      if (!drag) return;
      const x = e.clientX - dx,
        y = e.clientY - dy;
      dx = e.clientX;
      dy = e.clientY;
      moved += Math.abs(x) + Math.abs(y);
      if (latest.current.mode === 'sky') {
        skyRA -= (x * 0.0025 * skyFov) / 60;
        skyDec = T.MathUtils.clamp(
          skyDec + (y * 0.0025 * skyFov) / 60,
          -1.55,
          1.55,
        );
      } else if (pan) {
        follow = null;
        const right = new T.Vector3().setFromMatrixColumn(
            camera.matrixWorld,
            0,
          ),
          up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        goalTarget
          .addScaledVector(right, (-x * Math.exp(logR)) / height)
          .addScaledVector(up, (y * Math.exp(logR)) / height);
      } else {
        goalTheta -= x * 0.005;
        goalPhi = T.MathUtils.clamp(goalPhi - y * 0.005, 0.03, Math.PI - 0.03);
      }
    }
    function up(e: PointerEvent) {
      drag = false;
      if (moved > 5) return;
      const rect = renderer.domElement.getBoundingClientRect(),
        mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      let best = 10,
        chosen: SpaceObject | undefined;
      for (let i = 0; i < latest.current.data.stars.length; i++) {
        const s = latest.current.data.stars[i];
        if (latest.current.mode === 'sky' && s.mag > 6.5) continue;
        const point =
          latest.current.mode === 'sky'
            ? v(equatorial(s.ra, s.dec, 10))
            : v(starCoords[i]).sub(target).divideScalar(Math.exp(logR));
        if (
          point
            .clone()
            .sub(camera.position)
            .dot(camera.getWorldDirection(new T.Vector3())) <= 0
        )
          continue;
        point.project(camera);
        const d = Math.hypot(
          (point.x * 0.5 + 0.5) * width - mx,
          (-point.y * 0.5 + 0.5) * height - my,
        );
        if (d < best) {
          best = d;
          chosen = starObject(s);
        }
      }
      if (chosen) latest.current.onSelect(chosen);
    }
    function wheel(e: WheelEvent) {
      e.preventDefault();
      const delta = T.MathUtils.clamp(e.deltaY, -140, 140);
      if (latest.current.mode === 'sky')
        goalSkyFov = T.MathUtils.clamp(
          goalSkyFov * Math.exp(delta * 0.0017),
          2,
          100,
        );
      else
        goalLogR = T.MathUtils.clamp(
          goalLogR + delta * 0.007,
          Math.log(
            latest.current.selected.radiusKm
              ? latest.current.selected.radiusKm * 1.08
              : 200,
          ),
          Math.log(1e8 * LY_KM),
        );
    }
    function key(e: KeyboardEvent) {
      if (['w', 'a', 's', 'd', 'q', 'e'].includes(e.key.toLowerCase())) {
        held.add(e.key.toLowerCase());
        e.preventDefault();
      }
      if (
        [
          '=',
          '+',
          '-',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key === '+' || e.key === '=') {
        goalLogR -= 0.6;
        goalSkyFov = Math.max(2, goalSkyFov * 0.8);
      }
      if (e.key === '-') {
        goalLogR += 0.6;
        goalSkyFov = Math.min(100, goalSkyFov * 1.2);
      }
      if (e.key === 'ArrowLeft') {
        goalTheta += 0.1;
        skyRA += 0.1;
      }
      if (e.key === 'ArrowRight') {
        goalTheta -= 0.1;
        skyRA -= 0.1;
      }
      if (e.key === 'ArrowUp') {
        goalPhi = Math.max(0.03, goalPhi - 0.1);
        skyDec = Math.min(1.55, skyDec + 0.1);
      }
      if (e.key === 'ArrowDown') {
        goalPhi = Math.min(Math.PI - 0.03, goalPhi + 0.1);
        skyDec = Math.max(-1.55, skyDec - 0.1);
      }
    }
    const el = renderer.domElement;
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => (drag = false));
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('keydown', key);
    const release = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
    const clearKeys = () => held.clear();
    window.addEventListener('keyup', release);
    el.addEventListener('blur', clearKeys);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    const lost = (e: Event) => {
      e.preventDefault();
      setError(
        'The graphics connection was interrupted. Reload to restore the explorer.',
      );
    };
    el.addEventListener('webglcontextlost', lost);
    return () => {
      disposed = true;
      window.removeEventListener('keyup', release);
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((obj) => {
        if ('geometry' in obj) (obj.geometry as T.BufferGeometry).dispose();
        if ('material' in obj) {
          const m = obj.material as T.Material | T.Material[];
          (Array.isArray(m) ? m : [m]).forEach((m) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      el.remove();
      overlay.remove();
    };
  }, [props.data]);
  return (
    <div ref={host} className="space-viewport">
      {error && (
        <div className="graphics-error">
          <h3>3D view unavailable</h3>
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Reload explorer
          </button>
        </div>
      )}
    </div>
  );
}
