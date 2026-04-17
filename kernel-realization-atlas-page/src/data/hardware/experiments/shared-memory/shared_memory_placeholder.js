const sharedMemoryPlaceholder = {
  id: "shared-memory-placeholder",
  category: "Shared Memory",
  label: "Shared Memory Probes (Planned)",
  summary:
    "Shared memory bank mapping, conflict, broadcast, padding effect를 다루는 probe를 이 분류 아래에서 관리합니다. 현재는 구조 확장을 위한 placeholder 항목입니다.",

  question:
    "Shared memory를 단순한 on-chip fast memory가 아니라, bank mapping과 warp access pattern의 제약을 가진 구조로 읽으려면 어떤 probe들이 필요한가?",

  whyItMatters:
    "Shared memory 최적화는 단순히 global memory보다 빠르다는 사실만으로 충분하지 않습니다. 실제 성능은 warp 단위 접근 패턴, 같은 bank 접근의 형태, padding 여부, read/write 차이에 크게 영향을 받습니다. 따라서 이 분류는 향후 bank conflict, broadcast, padding 효과를 분리해서 해석하는 기준층이 됩니다.",

  method: [
    "현재는 Shared Memory 분류 구조를 먼저 세우기 위한 placeholder probe입니다.",
    "이 아래에 shared_bank_conflict_stride, shared_broadcast_vs_conflict, shared_pad_effect 같은 실험을 순차적으로 추가합니다.",
    "각 실험은 stride, padding, read/write 패턴 변화에 따른 latency curve와 access response를 기록하는 방향으로 설계됩니다.",
    "향후 실제 결과가 들어오면 Global Memory 그룹과 같은 방식으로 chartData, interpretation, nextProbes를 구체화합니다.",
  ],

  kernelShape: {
    accessPattern: "shared memory probe placeholder",
    comparedAxis: [
      "bank conflict",
      "broadcast vs conflict",
      "padding effect",
      "warp-local access pattern",
    ],
    status: "planned",
  },

  codeSnippet: `// planned shared memory probe examples
// 1) stride-based shared load/store sweep
// 2) same-bank broadcast vs different-address conflict
// 3) padded vs non-padded shared tile comparison`,

  observe: [
    "특정 stride에서 latency spike가 나타나는가",
    "같은 bank 접근이라도 같은 address와 다른 address가 다른 반응을 보이는가",
    "padding이 spike를 완화하는가",
    "read와 write가 같은 민감도를 보이는가",
  ],

  outputs: [
    "shared stride timing curve",
    "bank conflict spike summary",
    "padding comparison notes",
    "broadcast vs conflict interpretation guide",
  ],

  chartData: [
    {
      stride: 1,
      placeholder_avg_ms: 0,
      placeholder_conflict_score: 0,
    },
  ],

  charts: [
    {
      title: "Shared Memory Probe Placeholder",
      xKey: "stride",
      yKeys: ["placeholder_avg_ms"],
      summary:
        "실제 shared memory 결과가 들어오면 stride별 timing curve와 padding 비교 그래프가 이 위치에 표시됩니다.",
    },
  ],

  resultHighlights: [
    "현재는 Shared Memory 분류를 안전하게 확장하기 위한 placeholder 항목입니다.",
    "실제 probe 추가 전에도 페이지 탐색 구조를 먼저 고정할 수 있습니다.",
  ],

  interpretation: [
    "이 항목은 실험 결과 해석용이 아니라 분류 구조 확장용 placeholder입니다.",
    "향후 실제 shared memory probe가 추가되면, bank conflict와 padding 효과를 같은 그룹 안에서 비교 해석할 수 있게 됩니다.",
  ],

  caveats: [
    "현재 수치는 placeholder이며 실제 측정 결과가 아닙니다.",
    "실제 해석은 shared memory probe 구현과 측정 이후에만 의미를 가집니다.",
  ],

  nextProbes: [
    "shared_bank_conflict_stride",
    "shared_broadcast_vs_conflict",
    "shared_pad_effect",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
  ],
};

export default sharedMemoryPlaceholder;