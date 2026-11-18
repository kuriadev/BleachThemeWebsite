"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { useState } from "react";
import { categories, type Project, type ProjectCategory } from "@/content/projects";
import { audio } from "@/lib/audio/engine";
import { DossierCard } from "./DossierCard";
import { SealDrawer } from "./SealDrawer";

type Filter = ProjectCategory | "all";

/** Filterable grid of SRDI dossiers + the Release Seal drawer. */
export function Archive({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const open = projects.find((p) => p.id === openId) ?? null;
  const count = (c: Filter) => (c === "all" ? projects.length : projects.filter((p) => p.category === c).length);

  return (
    <>
      <div role="group" aria-label="Filter dossiers" className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => {
              audio.play("click");
              setFilter(c.id);
            }}
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/12 px-5 text-[11px] uppercase tracking-[0.28em] text-ghost-muted transition-colors hover:border-white/30 hover:text-ghost aria-pressed:border-ghost aria-pressed:bg-ghost aria-pressed:text-void"
          >
            {c.label}
            <span className="font-mono text-[10px] opacity-60">{String(count(c.id)).padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      <p role="status" className="sr-only">
        {visible.length} dossier{visible.length === 1 ? "" : "s"} shown
      </p>

      <LayoutGroup>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <DossierCard key={p.id} project={p} onOpen={setOpenId} />
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {visible.length === 0 && (
        <p className="mt-10 font-mono text-sm uppercase tracking-[0.3em] text-ghost-faint">No files under this classification yet.</p>
      )}

      <AnimatePresence>{open && <SealDrawer key={open.id} project={open} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </>
  );
}
