import type { StaticImageData } from "next/image";
import heroAizen from "../../public/images/hero-aizen.png";

/** Kidō classes double as stack categories. */
export type KidoClass = "hado" | "bakudo" | "kaido";
export type ProjectCategory = "web" | "webgl" | "tooling" | "experiment";

export interface StackTag {
  name: string;
  /** hadō = what users see · bakudō = what holds it together · kaidō = what keeps it healthy */
  kido: KidoClass;
}

export interface Project {
  id: string;
  fileNo: string;
  codename: string;
  title: string;
  category: ProjectCategory;
  /** Reiatsu threat level, 1 (dormant) – 5 (catastrophic). */
  threat: 1 | 2 | 3 | 4 | 5;
  year: string;
  status: "Active" | "Sealed" | "Prototype";
  summary: string;
  details: string[];
  stack: StackTag[];
  links: { live?: string; repo?: string };
  preview?: { image?: StaticImageData; video?: string };
  /** True for example dossiers that should be replaced with real work. */
  sample?: boolean;
}

export const categories: { id: ProjectCategory | "all"; label: string }[] = [
  { id: "all", label: "All files" },
  { id: "web", label: "Web" },
  { id: "webgl", label: "WebGL" },
  { id: "tooling", label: "Tooling" },
  { id: "experiment", label: "Experiments" },
];

export const projects: Project[] = [
  {
    id: "kyoka-archive",
    fileNo: "12-001",
    codename: "KYŌKA",
    title: "KYŌKA // ARCHIVE",
    category: "webgl",
    threat: 4,
    year: "2026",
    status: "Active",
    summary: "This site: a gallery-grade Bleach fan installation with a shatterable hero, spatial gallery and living codex.",
    details: [
      "Next.js App Router, statically rendered and served from Vercel's edge.",
      "Raw three.js reiatsu field with GPU-only animation, lazy-loaded after idle.",
      "Procedural Web Audio: every click, chime and drone is synthesised, with no audio files.",
      "Full reduced-motion path and keyboard-complete dialogs.",
    ],
    stack: [
      { name: "Next.js", kido: "hado" },
      { name: "Three.js", kido: "hado" },
      { name: "Motion", kido: "hado" },
      { name: "Tailwind v4", kido: "bakudo" },
      { name: "Vercel", kido: "bakudo" },
      { name: "Web Audio", kido: "kaido" },
    ],
    links: { live: "https://shinigami-reiatsu.vercel.app", repo: "https://github.com/kuriadev/BleachThemeWebsite" },
    preview: { image: heroAizen },
  },
  {
    id: "sample-senkaimon",
    fileNo: "12-014",
    codename: "SENKAIMON",
    title: "Sample dossier: Gateway CMS",
    category: "web",
    threat: 2,
    year: "2026",
    status: "Prototype",
    summary: "Example entry. Replace with a real project in src/content/projects.ts.",
    details: ["Describe the problem, your role and the outcome here.", "Add a short video to /public/videos and set preview.video for hover playback."],
    stack: [
      { name: "React", kido: "hado" },
      { name: "PostgreSQL", kido: "bakudo" },
      { name: "Playwright", kido: "kaido" },
    ],
    links: {},
    sample: true,
  },
  {
    id: "sample-gigai",
    fileNo: "12-027",
    codename: "GIGAI",
    title: "Sample dossier: Design-token pipeline",
    category: "tooling",
    threat: 1,
    year: "2025",
    status: "Sealed",
    summary: "Example entry. Replace with a real project in src/content/projects.ts.",
    details: ["Describe the problem, your role and the outcome here."],
    stack: [
      { name: "Node.js", kido: "bakudo" },
      { name: "Style Dictionary", kido: "bakudo" },
      { name: "Vitest", kido: "kaido" },
    ],
    links: {},
    sample: true,
  },
  {
    id: "sample-hogyoku",
    fileNo: "12-033",
    codename: "HŌGYOKU",
    title: "Sample dossier: Shader playground",
    category: "experiment",
    threat: 5,
    year: "2025",
    status: "Prototype",
    summary: "Example entry. Replace with a real project in src/content/projects.ts.",
    details: ["Describe the problem, your role and the outcome here."],
    stack: [
      { name: "GLSL", kido: "hado" },
      { name: "WebGPU", kido: "hado" },
      { name: "Vite", kido: "bakudo" },
    ],
    links: {},
    sample: true,
  },
];
