export const hardwareEvidenceSections = [
  {
    title: "Memory Response Patterns",
    desc: "메모리 계층은 추상적으로 보이지 않지만 실제 실행에서는 가장 빠르게 비용 차이를 드러냅니다. stride, locality, transaction fragmentation, residency window의 차이는 동일 의미 연산이라도 전혀 다른 realization 품질로 이어질 수 있습니다.",
    items: [
      "Stride sweep / coalescing response",
      "Transaction fragmentation",
      "Cache line / locality effects",
      "Fixed-work access response",
      "On-chip vs off-chip residency clues",
    ],
  },
  {
    title: "Shared Memory and On-Chip Structure",
    desc: "shared memory는 단순히 빠른 메모리가 아니라 접근 패턴 제약이 강한 구조입니다. bank conflict, padding, transpose, broadcast가 실제로 어떤 비용 차이를 만드는지를 관찰하면 tile staging과 local reuse의 실질적 조건을 읽을 수 있습니다.",
    items: [
      "Shared memory bank conflict",
      "Broadcast vs conflict distinction",
      "Padding / transpose effects",
      "Local staging viability",
      "Tile residency constraints",
    ],
  },
  {
    title: "Execution Primitive Evidence",
    desc: "실제 realization은 primitive 단위의 누적, reduction, staging, rematerialization, issue overlap 같은 구조 위에서 성립합니다. 이 섹션은 어떤 primitive family가 실제 GPU에서 유효하게 작동하는지 보기 위한 실험 층입니다.",
    items: [
      "Reduction behavior",
      "Streaming accumulation",
      "Tile staging patterns",
      "Load / compute overlap clues",
      "Primitive-level bottleneck reading",
    ],
  },
  {
    title: "Scheduling and Throughput Clues",
    desc: "GPU는 단순히 FLOPs만으로 읽히지 않습니다. occupancy, latency hiding, issue spacing, memory pressure, execution dependency의 균형이 realization quality를 결정합니다. 측정 기반으로 이 반응을 보면 추상 구조가 실제 hardware path에서 어떻게 깎이는지 읽을 수 있습니다.",
    items: [
      "Occupancy / latency hiding",
      "Issue pattern sensitivity",
      "Throughput ceilings",
      "Dependency pressure",
      "Execution path asymmetry",
    ],
  },
];