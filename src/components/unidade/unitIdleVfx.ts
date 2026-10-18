import * as THREE from "three";

import type { IdleVfxAnchor, IdleVfxKind } from "@/lib/unitIdleVfx";

export type IdleVfx = {
  update: (time: number) => void;
  dispose: () => void;
};

type Mote = {
  sprite: THREE.Sprite;
  phase: number;
  speed: number;
  angle: number;
  radius: number;
  rise: number;
};

function radialMap(inner: string, mid: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.45, mid);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  texture.needsUpdate = true;
  return texture;
}

const fireMap = radialMap("rgba(255, 246, 220, 0.95)", "rgba(255, 150, 40, 0.55)");
const softMap = radialMap("rgba(255, 255, 255, 0.92)", "rgba(255, 255, 255, 0.28)");
const smokeMap = radialMap("rgba(190, 196, 206, 0.7)", "rgba(120, 126, 136, 0.22)");

function disposeRoot(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    const drawable = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (drawable.geometry) geometries.add(drawable.geometry);
    const material = drawable.material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const item of list) item.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
}

function makeSprite(
  map: THREE.Texture,
  tint: string,
  opacity: number,
  additive: boolean,
  depthTest = true,
): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map,
    color: tint,
    transparent: true,
    depthWrite: false,
    depthTest,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 2;
  return sprite;
}

function spawn(parent: THREE.Object3D, kind: IdleVfxKind, tint: string, size: number): Mote[] {
  const additive = kind !== "flies";
  const map = kind === "smoke" || kind === "mist" || kind === "gas" ? smokeMap : kind === "fire" ? fireMap : softMap;
  if (kind === "aura") {
    const sprite = makeSprite(softMap, tint, 0.55, true);
    sprite.scale.set(size * 2.4, size * 2.8, 1);
    parent.add(sprite);
    return [{ sprite, phase: 0, speed: 0.6, angle: 0, radius: 0, rise: 0 }];
  }
  if (kind === "eyes" || kind === "glow") {
    const sprite = makeSprite(softMap, tint, kind === "eyes" ? 0.95 : 0.8, true, kind !== "eyes");
    sprite.scale.setScalar(kind === "eyes" ? size : size * 1.35);
    parent.add(sprite);
    return [{ sprite, phase: 0, speed: 2.2, angle: 0, radius: 0, rise: 0 }];
  }
  const count = kind === "ring" ? 12 : kind === "flies" ? 6 : kind === "lightning" ? 4 : 6;
  return Array.from({ length: count }, (_, index) => {
    const sprite = makeSprite(map, tint, kind === "flies" ? 0.85 : 0.7, additive);
    const scale = kind === "ring" ? size * 0.95 : kind === "flies" ? size * 0.12 : kind === "lightning" ? size * 0.35 : size * 0.55;
    sprite.scale.set(scale, kind === "lightning" ? scale * 2.4 : scale, 1);
    parent.add(sprite);
    return {
      sprite,
      phase: index / count,
      speed: kind === "smoke" || kind === "mist" || kind === "gas" ? 0.28 : 0.7,
      angle: (index / count) * Math.PI * 2,
      radius: size * (kind === "ring" ? 0.85 : 0.35),
      rise: size * (kind === "fire" ? 1.5 : 1.1),
    };
  });
}

export function createIdleVfx(parent: THREE.Object3D, anchors: IdleVfxAnchor[]): IdleVfx | null {
  if (!anchors.length) return null;
  const root = new THREE.Group();
  parent.add(root);
  const placed = anchors.map((anchor) => {
    const group = new THREE.Group();
    group.position.set(anchor.at[0], anchor.at[1], anchor.at[2]);
    root.add(group);
    return { kind: anchor.kind, size: anchor.size, motes: spawn(group, anchor.kind, anchor.tint, anchor.size) };
  });

  return {
    update(time) {
      for (const place of placed) {
        for (const mote of place.motes) {
          const material = mote.sprite.material;
          if (place.kind === "aura" || place.kind === "eyes" || place.kind === "glow") {
            const pulse = 0.75 + Math.sin(time * mote.speed + mote.phase * 6) * 0.25;
            material.opacity = (place.kind === "eyes" ? 0.85 : 0.55) * pulse;
            continue;
          }
          if (place.kind === "lightning") {
            const flash = Math.sin(time * 18 + mote.phase * 20) > 0.65;
            material.opacity = flash ? 0.9 : 0.05;
            const spin = mote.angle + Math.floor(time * 8) * 0.4;
            mote.sprite.position.set(Math.cos(spin) * mote.radius, (mote.phase - 0.5) * mote.rise, Math.sin(spin) * mote.radius);
            continue;
          }
          if (place.kind === "ring" || place.kind === "flies") {
            const spin = mote.angle + time * (place.kind === "flies" ? 1.4 : 0.8);
            const lift = place.kind === "flies" ? Math.sin(time * 3 + mote.phase * 8) * place.size * 0.35 : Math.sin(time * 2 + mote.phase) * place.size * 0.08;
            mote.sprite.position.set(Math.cos(spin) * mote.radius, lift, Math.sin(spin) * mote.radius);
            material.opacity = place.kind === "flies" ? 0.8 : 0.45 + Math.sin(time * 2 + mote.phase) * 0.2;
            continue;
          }
          const life = (mote.phase + time * mote.speed) % 1;
          const fade = Math.sin(life * Math.PI);
          mote.sprite.position.set(
            Math.cos(mote.angle) * mote.radius * (0.25 + life),
            life * mote.rise,
            Math.sin(mote.angle) * mote.radius * (0.25 + life),
          );
          material.opacity = 0.15 + fade * (place.kind === "smoke" ? 0.35 : 0.6);
          const base = place.size * 0.45;
          mote.sprite.scale.setScalar(base * (0.7 + fade * 0.6));
        }
      }
    },
    dispose() {
      parent.remove(root);
      disposeRoot(root);
    },
  };
}
