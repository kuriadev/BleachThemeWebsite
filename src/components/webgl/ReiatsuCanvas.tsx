"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useExperience } from "@/providers/ExperienceProvider";

// three.js stays out of the initial JS bundle and never runs on the server.
const ReiatsuField = dynamic(() => import("./ReiatsuField"), { ssr: false });

/**
 * Mounts the WebGL field after the browser is idle so it never competes
 * with LCP (the hero image) or hydration.
 */
export function ReiatsuCanvas({ className = "" }: { className?: string }) {
  const { reducedMotion } = useExperience();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setReady(true));
    return () => cancel(id);
  }, []);

  return (
    <div aria-hidden className={`absolute inset-0 ${className}`}>
      {ready && <ReiatsuField still={reducedMotion} />}
    </div>
  );
}
