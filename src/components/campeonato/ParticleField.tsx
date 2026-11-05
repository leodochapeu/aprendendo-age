import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; v: number; a: number };

export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;

    const motes: Mote[] = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.6,
      v: 0.00015 + Math.random() * 0.00035,
      a: 0.15 + Math.random() * 0.45,
    }));

    function draw() {
      if (!canvas || !context) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      for (const mote of motes) {
        if (!reduced) mote.y -= mote.v;
        if (mote.y < -0.02) mote.y = 1.02;
        context.beginPath();
        context.fillStyle = `rgba(255, 210, 106, ${mote.a})`;
        context.arc(mote.x * width, mote.y * height, mote.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function loop() {
      if (!running) return;
      draw();
      if (!reduced) frame = window.requestAnimationFrame(loop);
    }
    loop();
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden />;
}
