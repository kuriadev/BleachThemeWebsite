import type { AccentKey } from "@/lib/tokens";

export interface Stat {
  label: string;
  /** 0–100, fan-assessed for visual comparison only. */
  value: number;
}

export interface Character {
  id: string;
  name: string;
  kanji: string;
  role: string;
  affiliation: string;
  zanpakuto: { name: string; kanji: string; command: string; bankai: string };
  accent: AccentKey;
  /** Short tagline for the collapsed card. */
  epithet: string;
  lore: string;
  abilities: string[];
  stats: Stat[];
  /**
   * Optional art for the expanded view. Supply your own licensed images in
   * src/assets/codex/ and import them here; cards stay typographic without one.
   */
  image?: string;
}

/** Lore is written in original, summary form for this fan project. */
export const characters: Character[] = [
  {
    id: "ichigo",
    name: "Ichigo Kurosaki",
    kanji: "黒崎一護",
    role: "Substitute Soul Reaper",
    affiliation: "Karakura Town",
    zanpakuto: { name: "Zangetsu", kanji: "斬月", command: "—", bankai: "Tensa Zangetsu" },
    accent: "hollow",
    epithet: "A blade that grew from every bloodline at once.",
    lore:
      "A teenager who could always see ghosts, Ichigo borrows a Soul Reaper's power to protect his family and never gives it back. His strength rises with every impossible fight, and the truth of his heritage — Soul Reaper, Hollow and Quincy in one — makes him the hinge the whole story turns on.",
    abilities: ["Getsuga Tenshō", "Hollowfication", "Bankai compression", "Instinctive Flash Step"],
    stats: [
      { label: "Reiatsu", value: 96 },
      { label: "Zanjutsu", value: 88 },
      { label: "Speed", value: 92 },
      { label: "Kidō", value: 12 },
      { label: "Intellect", value: 58 },
    ],
  },
  {
    id: "rukia",
    name: "Rukia Kuchiki",
    kanji: "朽木ルキア",
    role: "Captain, 13th Division",
    affiliation: "Gotei 13",
    zanpakuto: { name: "Sode no Shirayuki", kanji: "袖白雪", command: "Dance", bankai: "Hakka no Togame" },
    accent: "ghost",
    epithet: "The most beautiful blade in Soul Society.",
    lore:
      "The Soul Reaper whose borrowed power started everything. Adopted into the noble Kuchiki house, Rukia fights with precise kidō and an ice-white zanpakuto, and her Bankai drops her own body to absolute zero — a technique as lethal to its wielder as to its target.",
    abilities: ["Some no Mai: Tsukishiro", "Absolute-zero Bankai", "High-level Kidō", "Ice reconstruction"],
    stats: [
      { label: "Reiatsu", value: 78 },
      { label: "Zanjutsu", value: 74 },
      { label: "Speed", value: 76 },
      { label: "Kidō", value: 84 },
      { label: "Intellect", value: 72 },
    ],
  },
  {
    id: "aizen",
    name: "Sōsuke Aizen",
    kanji: "藍染惣右介",
    role: "Former Captain, 5th Division",
    affiliation: "Traitor · Hueco Mundo",
    zanpakuto: { name: "Kyōka Suigetsu", kanji: "鏡花水月", command: "Shatter", bankai: "Unrevealed" },
    accent: "hogyoku",
    epithet: "Every perception, already his.",
    lore:
      "Gentle, trusted, and orchestrating everything from the first chapter, Aizen fakes his own death, steals the Hōgyoku and walks out of Soul Society to remake the heavens. Anyone who has seen his zanpakuto's release is under its hypnosis — sight, sound, smell, touch, all bent at his will.",
    abilities: ["Complete Hypnosis", "Hōgyoku fusion", "Incantation-less Hadō #90", "Immortality"],
    stats: [
      { label: "Reiatsu", value: 99 },
      { label: "Zanjutsu", value: 90 },
      { label: "Speed", value: 90 },
      { label: "Kidō", value: 98 },
      { label: "Intellect", value: 100 },
    ],
  },
  {
    id: "byakuya",
    name: "Byakuya Kuchiki",
    kanji: "朽木白哉",
    role: "Captain, 6th Division",
    affiliation: "Gotei 13 · Kuchiki Clan",
    zanpakuto: { name: "Senbonzakura", kanji: "千本桜", command: "Scatter", bankai: "Senbonzakura Kageyoshi" },
    accent: "hollow",
    epithet: "A thousand blades, falling like petals.",
    lore:
      "Head of the Kuchiki house and a living rule of law, Byakuya splits his blade into countless petal-thin edges that move with a gesture. Composed to the point of coldness, he is slowly forced to weigh the law he upholds against the sister he swore to protect.",
    abilities: ["Senkei", "Gōkei", "Flash Step mastery", "Hakuteiken"],
    stats: [
      { label: "Reiatsu", value: 86 },
      { label: "Zanjutsu", value: 88 },
      { label: "Speed", value: 90 },
      { label: "Kidō", value: 80 },
      { label: "Intellect", value: 80 },
    ],
  },
  {
    id: "toshiro",
    name: "Tōshirō Hitsugaya",
    kanji: "日番谷冬獅郎",
    role: "Captain, 10th Division",
    affiliation: "Gotei 13",
    zanpakuto: { name: "Hyōrinmaru", kanji: "氷輪丸", command: "Reign over the frosted heavens", bankai: "Daiguren Hyōrinmaru" },
    accent: "bankai",
    epithet: "The youngest captain; the strongest ice.",
    lore:
      "A prodigy who made captain younger than anyone before him, Tōshirō wields the strongest ice-type zanpakuto in Soul Society. His Bankai wraps him in wings of frost that grow with time — an unfinished power still racing toward its final form.",
    abilities: ["Ryūsenka", "Sennen Hyōrō", "Hyōten Hyakkasō", "Weather control"],
    stats: [
      { label: "Reiatsu", value: 84 },
      { label: "Zanjutsu", value: 82 },
      { label: "Speed", value: 84 },
      { label: "Kidō", value: 70 },
      { label: "Intellect", value: 82 },
    ],
  },
  {
    id: "kenpachi",
    name: "Kenpachi Zaraki",
    kanji: "更木剣八",
    role: "Captain, 11th Division",
    affiliation: "Gotei 13",
    zanpakuto: { name: "Nozarashi", kanji: "野晒", command: "Drink", bankai: "Unnamed" },
    accent: "hollow",
    epithet: "He holds back so the fight can last.",
    lore:
      "A fighter who took his captaincy by cutting down the last man to hold it, Kenpachi suppresses his own crushing spiritual pressure just to make battles last longer. For most of the story he doesn't even know his sword's name — and once he learns it, the ground itself splits.",
    abilities: ["Overwhelming Reiatsu", "Kendō (two-handed)", "Eyepatch limiter", "Berserk Bankai"],
    stats: [
      { label: "Reiatsu", value: 95 },
      { label: "Zanjutsu", value: 92 },
      { label: "Speed", value: 78 },
      { label: "Kidō", value: 2 },
      { label: "Intellect", value: 40 },
    ],
  },
];
