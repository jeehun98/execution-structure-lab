const warpExecutionSignatureV0 = {
  id: "warp_execution_signature_v0",
  label: "Warp Signature v0",
  title: "Warp 실행 구조 서명 v0",
  description:
    "동일한 cycle budget 안에서 서로 다른 warp execution pattern이 어떤 progress signature를 남기는지 관찰한 1차 probe입니다. 이 실험은 단순한 작업 속도 비교가 아니라, dependency structure와 memory hierarchy가 warp-level progress에 남기는 상대적 실행 흔적을 읽기 위한 observation입니다.",

  status: "observed",
  kind: "experiment",

  layer: "observation-result",
  order: 2,

  detailPath: "/hardware-evidence/warp_execution_signature_v0",

  graphSummary: {
    intro:
      "동일한 cycle budget 안에서 서로 다른 execution pattern을 가진 warp들이 서로 다른 progress signature를 남기는지 관찰한 최초의 signature observation입니다.",

    buildUp: [
      {
        id: "same_workload_baseline",
        label: "Same Workload Baseline",
        summary:
          "모든 warp가 동일한 independent ALU workload를 수행할 때 뚜렷한 장기 progress 편향이 나타나는지 먼저 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 workload execution pattern별 progress signature 후보를 처음 발견하는 observation 단계입니다. 동일 workload 기준선 이후, dependency structure와 memory access pattern이 달라질 때 warp progress가 어떻게 갈라지는지 확인합니다.",

    keyTakeaway:
      "핵심은 어떤 작업이 절대적으로 빠른지 비교하는 것이 아니라, 서로 다른 execution pattern이 warp-level progress에 구분 가능한 상대적 실행 서명을 남기는지 관찰하는 것입니다.",

    nextQuestion:
      "이 signature가 단일 run의 우연인지, 반복 실행에서도 유지되는 안정적인 구조인지 검증해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "서로 다른 execution pattern은 동일한 cycle budget 안에서 구분 가능한 progress signature를 남겼습니다. 다만 현재 결과는 단일 run의 v0 관찰값이므로, 절대적인 연산 속도비가 아니라 workload별 실행 서명으로 해석해야 합니다.",

    metrics: [
      {
        label: "fast independent ALU",
        value: "462,823",
        note: "가장 높은 progress",
      },
      {
        label: "shared load",
        value: "129,754",
        note: "dependent ALU chain보다 높은 progress",
      },
      {
        label: "dependent ALU chain",
        value: "90,648",
        note: "긴 dependency chain으로 progress 감소",
      },
      {
        label: "dependent global load",
        value: "10,646",
        note: "global memory latency와 address dependency가 결합된 최저 progress",
      },
    ],

    interpretation:
      "이 결과는 warp별로 다른 작업을 주었을 때 속도가 다르다는 단순한 확인이 아니라, execution pattern별 progress signature를 읽기 위한 v0 observation입니다.",

    caveat:
      "각 workload는 iter 1회당 instruction mix와 dependency 구조가 다르므로, progress 값은 절대적인 성능비가 아니라 상대적 실행 서명으로 읽어야 합니다.",
  },

  probingMeaning:
    "이 node는 동일 workload baseline 이후, workload class가 달라질 때 progress 분포가 어떻게 갈라지는지 보여주는 첫 번째 execution signature observation입니다.",

  relatedNodes: [
    {
      id: "same_workload_baseline",
      reason:
        "동일 workload 조건에서 강한 warp_id progress 편향이 나타나는지 확인한 기준선",
    },
    {
      id: "warp",
      reason:
        "warp-level progress를 직접 관찰하는 probe",
    },
    {
      id: "shared_memory",
      reason:
        "shared_load role이 on-chip memory access signature를 포함함",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_load role이 global memory latency와 address dependency를 포함함",
    },
  ],

  connectsTo: [
    {
      id: "warp_signature_repeatability",
      type: "signature-validation",
      label: "observation → repeatability",
    },
  ],
};

export default warpExecutionSignatureV0;