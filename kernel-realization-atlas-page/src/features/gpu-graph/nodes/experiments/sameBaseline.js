const sameBaseline = {
  id: "same_workload_baseline",
  label: "Same Workload Baseline",
  title: "동일 workload 기준선",
  description:
    "동일한 independent ALU workload를 여러 warp에 부여해, workload 차이가 없는 조건에서 warp progress가 어떤 기준 형태로 정렬되는지 관찰합니다.",

  status: "observed",
  kind: "experiment",

  layer: "baseline-result",
  order: 1,

  detailPath: "/hardware-evidence/same_workload_baseline",

  graphSummary: {
    intro:
      "모든 warp에 동일한 independent ALU workload를 부여해, workload 차이가 없는 조건에서 warp별 progress가 어떤 기준 형태를 보이는지 확인한 baseline 실험입니다.",

    buildUp: [],

    roleInFlow:
      "이 노드는 이후 Warp Execution Signature 계열 실험을 해석하기 위한 기준선 역할을 합니다. 서로 다른 workload를 비교하기 전에, 동일 workload 조건에서 warp_id 자체가 강한 progress 편향을 만드는지 먼저 확인합니다.",

    keyTakeaway:
      "핵심은 scheduler 정책을 직접 판정하는 것이 아니라, 후속 실험에서 관찰되는 progress 차이를 workload structure의 차이로 해석할 수 있는 최소 기준을 확보하는 것입니다.",

    nextQuestion:
      "동일 workload 조건에서 뚜렷한 장기 progress 편향이 없다면, 서로 다른 execution pattern을 부여했을 때 progress signature가 어떻게 달라지는지 확인할 수 있습니다.",
  },

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
      type: "baseline-to-observation",
      label: "baseline → signature observation",
    },
  ],
};

export default sameBaseline;