/**
 * Deterministic "broken mirror" triangulation used by the Kyoka Suigetsu
 * shatter. A jittered grid is split into triangles; each shard carries its
 * clip-path polygon and centroid (all in % of the frame).
 */
export interface Shard {
  id: number;
  clip: string;
  cx: number;
  cy: number;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeShards(cols = 7, rows = 5, seed = 1789): Shard[] {
  const rand = mulberry32(seed);
  const pts: [number, number][][] = [];
  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      const edgeX = c === 0 || c === cols;
      const edgeY = r === 0 || r === rows;
      const jx = edgeX ? 0 : (rand() - 0.5) * (70 / cols);
      const jy = edgeY ? 0 : (rand() - 0.5) * (70 / rows);
      pts[r][c] = [(c / cols) * 100 + jx, (r / rows) * 100 + jy];
    }
  }

  const shards: Shard[] = [];
  let id = 0;
  const push = (tri: [number, number][]) => {
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
    const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    shards.push({
      id: id++,
      clip: `polygon(${tri.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(",")})`,
      cx,
      cy,
    });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      // Alternate the diagonal so cracks don't all run the same way.
      if ((r + c) % 2 === 0) {
        push([a, b, e]);
        push([a, e, d]);
      } else {
        push([a, b, d]);
        push([b, e, d]);
      }
    }
  }
  return shards;
}
