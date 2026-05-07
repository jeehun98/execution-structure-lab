const shared = {
  id: "shared_memory",
  label: "Shared Memory",
  title: "Shared Memory",
  kind: "memory",
  status: "concept",

  layer: "execution-unit",
  order: 2,

  description:
    "Block 내부 thread들이 공유하는 on-chip memory입니다. 접근 패턴, bank mapping, conflict 여부에 따라 latency와 throughput이 달라질 수 있습니다.",

  connectsTo: [],

  meta: {
    title: "Shared Memory",
    desc:
      "Block 내부에서 공유되는 on-chip memory입니다. warp 단위 access pattern과 bank conflict 분석에서 중요한 관찰 대상입니다.",
  },
};

export default shared;