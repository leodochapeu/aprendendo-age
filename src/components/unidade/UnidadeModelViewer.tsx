import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { useTranslation } from "@/hooks/useTranslation";

const YAW_STEP = 0.38;

type UnidadeModelViewerProps = {
  url: string;
};

function disposeScene(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
        material.map?.dispose();
      }
      material.dispose();
    }
  });
}

export function UnidadeModelViewer({ url }: UnidadeModelViewerProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const yawRef = useRef(0.45);
  const dragRef = useRef({ x: 0, active: false });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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
    let distance = 4;

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
        target.x + Math.sin(yaw) * distance,
        target.y + distance * 0.06,
        target.z + Math.cos(yaw) * distance,
      );
      camera.lookAt(target);
    };

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (disposed) {
          disposeScene(gltf.scene);
          return;
        }
        pivot.add(gltf.scene);
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        target.copy(center);
        const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
        distance = (radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.18;
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
        pivot.add(shadow);
        setStatus("ready");
      },
      undefined,
      () => {
        if (!disposed) setStatus("error");
      },
    );

    const resize = new ResizeObserver(() => fit());
    resize.observe(canvas);
    fit();

    const tick = () => {
      if (disposed) return;
      placeCamera();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      disposeScene(scene);
      renderer.dispose();
    };
  }, [url]);

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
