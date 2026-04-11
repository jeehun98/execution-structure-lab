export const hardwareEvidenceSections = [
  {
    title: "Memory Response Patterns",
    desc: "메모리 계층은 스펙 표보다 실행 반응에서 더 선명하게 드러납니다. stride, locality, transaction fragmentation, footprint collapse, address-space handling의 차이는 같은 의미의 연산이라도 전혀 다른 realization quality로 이어질 수 있습니다. 이 섹션은 주소 구조 변화에 대해 GPU가 어떤 비용 곡선을 보이는지, 그리고 그 곡선이 어떤 실행 조건에서 어떻게 해석되어야 하는지를 읽기 위한 층입니다.",
    items: [
      "Stride sweep / coalescing response",
      "Wrapped fixed-work response",
      "Bounded no-wrap collapse",
      "Cache line / locality effects",
      "Transaction fragmentation",
    ],
  },
  {
    title: "Shared Memory and On-Chip Structure",
    desc: "shared memory는 단순히 빠른 메모리가 아니라, 접근 규칙과 배치 방식이 강하게 드러나는 on-chip 구조입니다. bank conflict, padding, transpose, broadcast 여부는 tile staging과 local reuse가 실제로 성립하는 조건을 보여줍니다. 이 섹션은 global irregularity를 local regularity로 바꿀 수 있는지, 그리고 그 변환이 실제 하드웨어에서 어느 정도 이득으로 이어지는지를 읽기 위한 층입니다.",
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
    desc: "실제 realization은 primitive 단위의 reduction, streaming accumulation, staging, rematerialization, overlap 구조 위에서 성립합니다. 이 섹션은 어떤 primitive family가 실제 GPU에서 병목을 덜 만들고, 어떤 family가 특정 hardware response와 더 잘 맞는지를 보기 위한 실험 층입니다. 목표는 빠른 커널을 하나 고르는 것이 아니라, 어떤 computation structure가 특정 하드웨어에서 더 자연스럽게 성립하는지를 읽는 데 있습니다.",
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
    desc: "GPU의 실행 품질은 FLOPs 하나로 닫히지 않습니다. occupancy, latency hiding, issue spacing, dependency chain, memory pressure의 균형이 실제 realization quality를 결정합니다. 이 섹션은 추상적인 계산 구조가 실행 경로 위에서 어떤 병목으로 나타나는지, 그리고 어떤 구조가 하드웨어의 스케줄링 여유를 더 잘 활용하는지를 측정 기반으로 읽기 위한 층입니다.",
    items: [
      "Occupancy / latency hiding",
      "Issue pattern sensitivity",
      "Throughput ceilings",
      "Dependency pressure",
      "Execution path asymmetry",
    ],
  },
];