import type { StaticImageData } from "next/image";
import type { AccentKey } from "@/lib/tokens";
import heroAizen from "../../public/images/hero-aizen.png";
import aizenPortrait from "../../public/images/aizen-portrait.png";

export interface GalleryPiece {
  id: string;
  title: string;
  kanji: string;
  medium: string;
  caption: string;
  tone: AccentKey;
  /** Layout hint for the spatial track. */
  shape: "portrait" | "landscape" | "square";
  /**
   * The artwork. Leave undefined to show an ink-wash placeholder.
   * Add your own images to /public/images/gallery/ and import them here.
   */
  image?: StaticImageData;
  alt?: string;
}

export const gallery: GalleryPiece[] = [
  {
    id: "kyoka-unbound",
    title: "Kyōka, Unbound",
    kanji: "鏡",
    medium: "Digital · Key visual",
    caption: "Arms open, the flames already obeying. The hero study, presented whole.",
    tone: "hogyoku",
    shape: "landscape",
    image: heroAizen,
    alt: "Sōsuke Aizen with arms outstretched amid violet flames and floating crystal shards.",
  },
  {
    id: "the-calm-eye",
    title: "The Calm Eye",
    kanji: "月",
    medium: "Digital · Portrait seal",
    caption: "A circular seal portrait, ringed in violet reiatsu.",
    tone: "hogyoku",
    shape: "square",
    image: aizenPortrait,
    alt: "Circular portrait of Sōsuke Aizen with an eyepatch, framed by a ring of violet energy.",
  },
  {
    id: "slot-03",
    title: "Plate III",
    kanji: "斬",
    medium: "Awaiting artwork",
    caption: "Reserved for an original illustration. Replace in content/gallery.ts.",
    tone: "hollow",
    shape: "portrait",
  },
  {
    id: "slot-04",
    title: "Plate IV",
    kanji: "魂",
    medium: "Awaiting artwork",
    caption: "Reserved for an original illustration. Replace in content/gallery.ts.",
    tone: "bankai",
    shape: "landscape",
  },
  {
    id: "slot-05",
    title: "Plate V",
    kanji: "花",
    medium: "Awaiting artwork",
    caption: "Reserved for an original illustration. Replace in content/gallery.ts.",
    tone: "ghost",
    shape: "portrait",
  },
  {
    id: "slot-06",
    title: "Plate VI",
    kanji: "水",
    medium: "Awaiting artwork",
    caption: "Reserved for an original illustration. Replace in content/gallery.ts.",
    tone: "bankai",
    shape: "square",
  },
];
