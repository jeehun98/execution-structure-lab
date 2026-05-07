const sameBaseline = {
  id: "same_workload_baseline",
  label: "Same Workload Baseline",
  title: "동일 workload 기준선",
  description:
    "동일한 independent ALU workload를 여러 warp에 부여해, workload 차이가 없는 조건에서 warp progress가 어떤 기준 형태로 정렬되는지 관찰합니다.",
  status: "observed",
  kind: "experiment",

  layer: "probe-baseline",
  order: 1,

  detailPath: "/hardware-evidence/same_workload_baseline",

  resultSummary: {
    title: "해석 기준",
    conclusion:
      "동일 independent ALU workload 조건에서는 warp_id 0~3 사이의 장기 progress 차이가 뚜렷하게 나타나지 않았습니다. 이 결과는 후속 execution signature v0에서 관찰되는 progress 차이를 warp_id 자체의 편향이 아니라 workload structure, dependency, memory access pattern의 차이로 해석하기 위한 기준선입니다.",
    metrics: [
      {
        label: "progress",
        value: "459,715",
        note: "4개 warp 모두 동일한 progress 기록",
      },
      {
        label: "warp count",
        value: "4",
        note: "단일 block 내 warp 0~3 비교",
      },
      {
        label: "clock delta",
        value: "+4 cycles",
        note: "최종 기록 시점 기준 거의 연속적인 기록",
      },
      {
        label: "sink",
        value: "0",
        note: "result-cancellation 방지를 위한 보강 필요",
      },
    ],
    interpretation:
      "이 baseline은 scheduler 정책을 직접 판정하기 위한 실험이 아니라, 동일 workload 조건에서 warp progress가 자연스럽게 정렬되는지를 확인하는 control case입니다.",
    caveat:
      "이 결과만으로 scheduler가 round-robin이거나 warp_id 순서로 issue한다고 단정할 수는 없습니다.",
  },

  connectsTo: [
    {
      id: "warp_execution_signature_v0",
      type: "baseline_for",
    },
  ],
};

export default sameBaseline;