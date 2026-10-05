/** Impact tree: it grows with the pieces given a second life. Stage 0 is the seed everyone starts with. */
export const TREE_STAGES = [
  { n: 0, label: 'Graine' },
  { n: 10, label: 'Petite pousse' },
  { n: 25, label: 'Jeune arbre' },
  { n: 50, label: 'Grand chêne' },
  { n: 100, label: 'Forêt entière' },
] as const;

/** Index in TREE_STAGES reached with this many pieces. */
export function treeStage(pieces: number) {
  let i = 0;
  TREE_STAGES.forEach((s, j) => { if (pieces >= s.n) i = j; });
  return i;
}

/** Progress (0-1) towards the next stage, and how many pieces are left; null once the forest is reached. */
export function nextTree(pieces: number) {
  const i = treeStage(pieces);
  const next = TREE_STAGES[i + 1];
  if (!next) return null;
  const from = TREE_STAGES[i].n;
  return { ...next, left: next.n - pieces, progress: (pieces - from) / (next.n - from) };
}
