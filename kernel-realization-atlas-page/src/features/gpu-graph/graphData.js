export const NODES = [
  { id: "block", label: "Block", layer: 0 },
  { id: "warp", label: "Warp", layer: 1 },
  { id: "execution", label: "Execution", layer: 2 },
  { id: "shared", label: "Shared Memory", layer: 3 },
  { id: "global", label: "Global Memory", layer: 3 },
];

export const EDGES = [
  { from: "block", to: "warp" },
  { from: "warp", to: "execution" },
  { from: "execution", to: "shared", type: "memory" },
  { from: "execution", to: "global", type: "memory" },
];

// focus별로 보여줄 관계
export const FOCUS_EDGES = {
  warp: ["warp->execution", "execution->shared", "execution->global"],
  shared: ["execution->shared"],
  global: ["execution->global"],
};