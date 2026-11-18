"use client";

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import { colors } from "@/lib/tokens";

export const REIATSU_BURST_EVENT = "reiatsu:burst";

interface Props {
  /** Render a single still frame instead of animating. */
  still?: boolean;
  className?: string;
}

const vertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uBurst;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uPixelRatio;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * (0.025 + aSeed * 0.05);

    // Rising reiatsu: drift upward and wrap, with a slow helical sway.
    p.y = mod(p.y + t + 1.0, 2.0) - 1.0;
    p.x += sin(uTime * 0.35 + aSeed * 40.0 + p.y * 3.0) * 0.035;

    // Gentle swirl around the focal point (Aizen sits at screen centre).
    float d = length(p.xy);
    float swirl = 0.12 / (d + 0.6);
    p.xy = mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl)) * p.xy;

    // Pointer repulsion in aspect-corrected space.
    vec2 diff = vec2((p.x - uPointer.x) * uAspect, p.y - uPointer.y);
    float pd = length(diff);
    p.xy += normalize(diff + 1e-4) * smoothstep(0.35, 0.0, pd) * 0.12 / vec2(uAspect, 1.0);

    // Shatter burst: everything is flung outward, then settles.
    p.xy += normalize(p.xy + 1e-4) * uBurst * (0.25 + aSeed * 0.5);

    vSeed = aSeed;
    vAlpha = smoothstep(1.0, 0.6, abs(p.y)) * (0.35 + 0.65 * fract(aSeed * 13.7));
    gl_Position = vec4(p.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (1.0 + uBurst * 1.5);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform vec3 uGhost;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float core = smoothstep(0.5, 0.0, r);
    core *= core;
    // Mostly violet (Kyoka Suigetsu), rare cyan sparks, a few ghost-white motes.
    vec3 col = mix(uViolet, uGhost, step(0.86, vSeed));
    col = mix(col, uCyan, step(0.965, vSeed));
    gl_FragColor = vec4(col, core * vAlpha);
  }
`;

/**
 * Atmospheric reiatsu particle field. Raw three.js (no R3F) keeps the client
 * bundle small; it is loaded lazily via next/dynamic and only after idle.
 */
export default function ReiatsuField({ still = false, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the CSS gradient underneath is the graceful fallback.
    }
    const dpr = Math.min(window.devicePixelRatio, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const count = coarse ? 900 : 2600;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      seed[i] = Math.random();
      size[i] = 1.5 + Math.pow(Math.random(), 4) * 9;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new BufferAttribute(size, 1));

    const uniforms = {
      uTime: { value: 0 },
      uBurst: { value: 0 },
      uPointer: { value: new Vector2(10, 10) },
      uAspect: { value: 1 },
      uPixelRatio: { value: dpr },
      uViolet: { value: new Color(colors.hogyokuBright) },
      uCyan: { value: new Color(colors.bankai) },
      uGhost: { value: new Color(colors.ghost) },
    };
    const mat = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    scene.add(new Points(geo, mat));

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      uniforms.uAspect.value = w / Math.max(h, 1);
      if (still) renderer.render(scene, camera); // resizing clears the buffer
    };
    if (still) uniforms.uTime.value = 12;
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const target = new Vector2(10, 10);
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let burst = 0;
    const onBurst = () => {
      burst = 1;
    };
    window.addEventListener(REIATSU_BURST_EVENT, onBurst);

    // Only animate while on screen and the tab is visible.
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value += dt;
      uniforms.uPointer.value.lerp(target, 0.08);
      burst *= Math.pow(0.04, dt); // exponential settle
      uniforms.uBurst.value = burst;
      renderer.render(scene, camera);
    };
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(REIATSU_BURST_EVENT, onBurst);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [still]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none h-full w-full ${className}`} />;
}
