import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { useTranslation } from "@/hooks/useTranslation";

const YAW_STEP = 0.38;

type UnidadeModelViewerProps = {
  urls: string[];
  hero?: boolean;
};

type Stage = {
  pivot: THREE.Group;
  target: THREE.Vector3;
  distance: { current: number };
  camera: THREE.PerspectiveCamera;
};

function disposeScene(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    const drawable = obj as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (!drawable.material) return;
    const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
    for (const material of materials) {
      const mapped = material as THREE.MeshBasicMaterial;
      mapped.map?.dispose();
      material.dispose();
    }
  });
  for (const geometry of geometries) geometry.dispose();
}

type HeroAura = {
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
};

function glowTexture(inner: string, mid: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.42, mid);
  gradient.addColorStop(1, "rgba(255, 170, 40, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  texture.needsUpdate = true;
  return texture;
}

function arcTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;
  ctx.translate(128, 128);
  ctx.strokeStyle = "rgba(255, 196, 80, 0.35)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = "rgba(255, 210, 90, 0.95)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(255, 228, 150, 0.95)";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0.2, Math.PI * 1.45);
  ctx.stroke();
  texture.needsUpdate = true;
  return texture;
}

function createHeroAura(scene: THREE.Object3D, box: THREE.Box3): HeroAura {
  const group = new THREE.Group();
  scene.add(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const height = Math.max(size.y, 0.6);
  const ringRadius = THREE.MathUtils.clamp(height * 0.34, 0.28, height * 0.55);
  const feetY = box.min.y + 0.02;

  const smokeMap = glowTexture("rgba(255, 214, 120, 0.55)", "rgba(255, 170, 40, 0.2)");
  const smoke = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: smokeMap, transparent: true, depthWrite: false, opacity: 0.9 }),
  );
  smoke.scale.set(height * 0.95, height * 1.25, 1);
  smoke.position.set(center.x, center.y, center.z);
  smoke.renderOrder = -1;
  group.add(smoke);

  const poolMap = glowTexture("rgba(255, 196, 70, 0.5)", "rgba(255, 160, 30, 0.12)");
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(ringRadius * 1.05, 48),
    new THREE.MeshBasicMaterial({ map: poolMap, transparent: true, depthWrite: false, opacity: 0.8, side: THREE.DoubleSide }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(center.x, feetY + 0.012, center.z);
  group.add(pool);

  const columnMap = glowTexture("rgba(255, 220, 140, 0.45)", "rgba(255, 176, 40, 0.08)");
  const column = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: columnMap, transparent: true, depthWrite: false, opacity: 0.55 }),
  );
  column.scale.set(ringRadius * 1.7, height * 0.42, 1);
  column.position.set(center.x, feetY + height * 0.16, center.z);
  column.renderOrder = 2;
  group.add(column);

  const arcMap = arcTexture();
  const arcPivot = new THREE.Group();
  arcPivot.position.set(center.x, feetY, center.z);
  const arc = new THREE.Mesh(
    new THREE.PlaneGeometry(ringRadius * 2.15, ringRadius * 2.15),
    new THREE.MeshBasicMaterial({ map: arcMap, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  arc.rotation.x = -Math.PI / 2;
  arcPivot.add(arc);
  group.add(arcPivot);

  const moteGeometry = new THREE.SphereGeometry(1, 10, 8);
  const motes = Array.from({ length: 14 }, (_, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index % 3 === 0 ? 0xfff1c4 : 0xffc14a,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(moteGeometry, material);
    const big = index < 4;
    const baseScale = height * (big ? 0.018 : 0.01);
    mesh.scale.setScalar(baseScale);
    mesh.userData.baseScale = baseScale;
    group.add(mesh);
    return {
      mesh,
      material,
      angle: (index / 14) * Math.PI * 2,
      radius: ringRadius * (0.35 + (index % 5) * 0.14),
      speed: 0.16 + (index % 4) * 0.06,
      phase: (index * 0.37) % 1,
      lift: height * (0.55 + (index % 3) * 0.16),
    };
  });

  const away = new THREE.Vector3();

  return {
    update(time, camera) {
      const pulse = 0.86 + Math.sin(time * 2.4) * 0.14;
      arc.scale.set(pulse, pulse, 1);
      arcPivot.rotation.y = time * 0.35;
      const arcMaterial = arc.material as THREE.MeshBasicMaterial;
      arcMaterial.opacity = 0.72 + Math.sin(time * 2.4) * 0.22;
      const poolMaterial = pool.material as THREE.MeshBasicMaterial;
      poolMaterial.opacity = 0.55 + Math.sin(time * 2.4 + 0.6) * 0.2;
      const columnMaterial = column.material as THREE.SpriteMaterial;
      columnMaterial.opacity = 0.28 + Math.sin(time * 2.4) * 0.12;

      away.copy(center).sub(camera.position);
      away.y = 0;
      if (away.lengthSq() < 1e-6) away.set(0, 0, 1);
      away.normalize().multiplyScalar(Math.max(size.x, size.z) * 0.42 + height * 0.08);
      smoke.position.set(center.x + away.x, center.y, center.z + away.z);

      for (const mote of motes) {
        const life = (mote.phase + time * mote.speed) % 1;
        const fade = Math.sin(life * Math.PI);
        const spin = mote.angle + time * 0.45;
        const spread = mote.radius * (0.45 + life * 0.7);
        mote.mesh.position.set(
          center.x + Math.cos(spin) * spread,
          feetY + life * mote.lift,
          center.z + Math.sin(spin) * spread,
        );
        mote.material.opacity = 0.2 + fade * 0.8;
        const base = mote.mesh.userData.baseScale as number;
        mote.mesh.scale.setScalar(base * (0.75 + fade * 0.45));
      }
    },
    dispose() {
      scene.remove(group);
      disposeScene(group);
    },
  };
}

function clearPivot(pivot: THREE.Group) {
  for (const child of [...pivot.children]) {
    pivot.remove(child);
    disposeScene(child);
  }
}

export function UnidadeModelViewer({ urls, hero = false }: UnidadeModelViewerProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const yawRef = useRef(0.45);
  const dragRef = useRef({ x: 0, active: false });
  const stageRef = useRef<Stage | null>(null);
  const auraRef = useRef<HeroAura | null>(null);
  const heroRef = useRef(hero);
  heroRef.current = hero;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const sourcesKey = urls.join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x2a2118, 1));
    const key = new THREE.DirectionalLight(0xfff7ee, 1.55);
    key.position.set(3.2, 6.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb7c4e4, 0.5);
    fill.position.set(-4, 2.2, -3);
    scene.add(fill);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const target = new THREE.Vector3();
    const distance = { current: 4 };
    stageRef.current = { pivot, target, distance, camera };

    const fit = () => {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const placeCamera = () => {
      const yaw = yawRef.current;
      camera.position.set(
        target.x + Math.sin(yaw) * distance.current,
        target.y + distance.current * 0.06,
        target.z + Math.cos(yaw) * distance.current,
      );
      camera.lookAt(target);
    };

    const resize = new ResizeObserver(() => fit());
    resize.observe(canvas);
    fit();

    const tick = () => {
      if (disposed) return;
      placeCamera();
      auraRef.current?.update(performance.now() / 1000, camera);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      stageRef.current = null;
      auraRef.current?.dispose();
      auraRef.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      disposeScene(scene);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const sources = sourcesKey ? sourcesKey.split("|") : [];
    if (!stage) return;
    if (!sources.length) {
      clearPivot(stage.pivot);
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    const loader = new GLTFLoader();
    Promise.all(sources.map((item) => loader.loadAsync(item).catch(() => null))).then((loaded) => {
      if (cancelled || stageRef.current !== stage) {
        for (const gltf of loaded) {
          if (gltf) disposeScene(gltf.scene);
        }
        return;
      }
      clearPivot(stage.pivot);
      const models = loaded.filter((gltf): gltf is NonNullable<typeof gltf> => gltf !== null);
        if (!models.length) {
          auraRef.current?.dispose();
          auraRef.current = null;
          setStatus("error");
          return;
        }
      for (const gltf of models) stage.pivot.add(gltf.scene);
      const box = new THREE.Box3().setFromObject(stage.pivot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      stage.target.copy(center);
      const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
      stage.distance.current = (radius / Math.tan((stage.camera.fov * Math.PI) / 360)) * 1.18;
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(size.x, size.z) * 0.38, 40),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(center.x, box.min.y + 0.015, center.z);
      stage.pivot.add(shadow);
      auraRef.current?.dispose();
      auraRef.current = heroRef.current ? createHeroAura(stage.pivot.parent ?? stage.pivot, box) : null;
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [sourcesKey]);

  const turn = (delta: number) => {
    yawRef.current += delta;
  };

  return (
    <div
      className="outline-none"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          turn(YAW_STEP);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          turn(-YAW_STEP);
        }
      }}
    >
      <div className="relative h-[26rem] overflow-hidden rounded-xl bg-[#12141b]">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          aria-label={t("common.dragToRotate")}
          onPointerDown={(event) => {
            dragRef.current = { x: event.clientX, active: true };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragRef.current.active) return;
            const dx = event.clientX - dragRef.current.x;
            dragRef.current.x = event.clientX;
            yawRef.current -= dx * 0.01;
          }}
          onPointerUp={() => {
            dragRef.current.active = false;
          }}
          onPointerCancel={() => {
            dragRef.current.active = false;
          }}
        />
        {status === "loading" ? (
          <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-zinc-500">
            {t("common.loading")}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-400">
            {t("common.modelUnavailable")}
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">{t("common.dragToRotate")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label={t("common.rotateLeft")}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-aom-border bg-black/25 text-lg text-amber-100/90 transition hover:border-amber-400/40 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            onClick={() => turn(YAW_STEP)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={t("common.rotateRight")}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-aom-border bg-black/25 text-lg text-amber-100/90 transition hover:border-amber-400/40 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            onClick={() => turn(-YAW_STEP)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
