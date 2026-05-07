const warp = {
  id: "warp",
  label: "Warp",
  title: "Warp",
  kind: "execution-unit",
  status: "concept",

  layer: "execution-unit",
  order: 1,

  description:
    "CUDA thread들이 보통 32개 단위로 묶여 실행되는 기본 scheduling 단위입니다. GPU probing에서는 warp 단위 progress, stall, dependency, memory access 반응을 관찰 대상으로 삼습니다.",

  connectsTo: [
    {
      id: "same_workload_baseline",
      type: "probe_baseline",
      label: "baseline",
    },
  ],

  meta: {
    title: "Warp",
    desc:
      "GPU scheduler가 instruction issue 대상으로 삼는 기본 실행 단위입니다. warp-level progress와 stall signature를 관찰하는 기준 단위입니다.",
  },
};

export default warp;