export const hardwareEvidenceSections = [
  {
    title: "Hardware Response Patterns",
    desc: "GPU의 반응을 스펙 표가 아니라 측정된 거동으로 읽습니다. memory hierarchy, access pattern, scheduling 특성이 실제 실행에서 어떤 비용, 병목, 제약으로 나타나는지를 추적해 realization 선택의 물리적 바닥을 확보합니다.",
    items: [
      "Stride sweep / coalescing",
      "Cache line / locality",
      "Shared memory bank conflict",
      "Occupancy / latency hiding",
      "Throughput ceilings",
    ],
  },
  {
    title: "Execution Primitive Evidence",
    desc: "primitive 단위에서 어떤 realization family가 실제로 성립하고 유리한지를 봅니다. 목표는 요소를 나열하는 것이 아니라, reduction, streaming, tile staging, rematerialization 같은 구조가 어떤 구현 선택과 비용 구조로 이어지는지 읽는 것입니다.",
    items: [
      "Reduction topology",
      "Streaming update",
      "Tile staging",
      "Rematerialization",
      "Primitive-to-kernel-family mapping",
    ],
  },
];