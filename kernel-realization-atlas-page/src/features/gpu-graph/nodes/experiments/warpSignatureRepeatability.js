const warpSignatureRepeatability = {
  id: "warp_signature_repeatability",
  label: "Warp Signature Repeatability",
  title: "Warp 실행 구조 서명 반복성 검증",
  description:
    "Warp Signature v0에서 관찰된 workload별 progress signature가 단일 run의 우연한 흔들림인지, 동일 조건에서 반복 실행해도 유지되는 안정적인 실행 서명인지 검증하는 probe입니다. 이 실험은 새로운 workload class를 추가하는 실험이 아니라, 기존 signature observation의 재현성을 확인하기 위한 validation 단계입니다.",

  status: "observed",
  kind: "experiment",

  layer: "signature-validation",
  order: 3,

  detailPath: "/hardware-evidence/warp_signature_repeatability",

  graphSummary: {
    intro:
      "Warp Signature v0에서 관찰된 workload별 progress signature가 단일 run의 우연한 흔들림인지, 동일 조건 반복 실행에서도 유지되는지 확인한 validation 실험입니다.",

    buildUp: [
      {
        id: "same_workload_baseline",
        label: "Same Workload Baseline",
        summary:
          "동일 workload 조건에서 강한 warp_id progress 편향이 나타나는지 확인해 후속 signature 해석의 기준선을 만들었습니다.",
      },
      {
        id: "warp_execution_signature_v0",
        label: "Warp Signature v0",
        summary:
          "서로 다른 execution pattern이 동일한 cycle budget 안에서 구분 가능한 progress signature를 남긴다는 최초 observation을 만들었습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 v0 observation을 단일 run 결과에서 반복 가능한 signature로 끌어올리는 validation 단계입니다. 새로운 workload class를 추가하는 것이 아니라, 기존 관찰값의 재현성을 확인합니다.",

    keyTakeaway:
      "핵심은 progress signature가 한 번의 launch에서 우연히 나온 값인지, 동일 kernel 구조와 동일 실행 조건에서 안정적으로 반복되는 구조적 관찰값인지 분리하는 것입니다. codegen 관점에서는 반복성을 통과한 signature만 cost model signal 후보로 승격할 수 있습니다.",

    nextQuestion:
      "반복 가능한 signature가 확인되었더라도, 그 signature가 특정 warp_id에 고정된 것인지 workload pattern을 따라가는 것인지는 아직 분리해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "동일한 launch shape, 동일한 cycle budget, 동일한 workload pattern 조건에서 64회 반복 실행한 결과, warp별 progress signature가 모든 run에서 완전히 동일하게 재현되었습니다. 관찰된 progress 배열은 [588, 560, 478, 466, 588, 561, 479, 466]이며, 모든 warp의 coefficient of variation은 0이었습니다. 따라서 현재 조건에서는 v0에서 관찰된 progress 차이를 단일 run noise가 아니라 안정적인 workload execution signature로 볼 수 있습니다. codegen 관점에서는 이 signature를 dependency-aware cost model의 경험적 입력 후보로 승격할 수 있습니다.",

    metrics: [
      {
        label: "run count",
        value: "64",
        note: "동일 조건 반복 실행 횟수",
      },
      {
        label: "warp progress signature",
        value: "[588, 560, 478, 466, 588, 561, 479, 466]",
        note: "64회 run 전체에서 동일하게 관찰된 progress 배열",
      },
      {
        label: "coefficient of variation",
        value: "0",
        note: "모든 warp에서 run-to-run 변동 없음",
      },
      {
        label: "pattern repetition",
        value: "0≈4, 1≈5, 2≈6, 3≈7",
        note: "local_warp_id & 3 기반 workload pattern이 반복적으로 같은 signature를 남김",
      },
    ],

    interpretation:
      "이 결과는 warp별 progress signature가 단일 launch에서만 우연히 보인 값이 아니라, 현재 kernel 구조와 동일 실행 조건 안에서 반복 가능한 구조적 관찰값임을 보여줍니다. 특히 warp 0과 4, 1과 5, 2와 6, 3과 7이 유사한 progress를 보인 것은 workload pattern 배정 방식이 progress signature에 반영되었음을 시사합니다.",

    caveat:
      "다만 이 결과는 단일 block, 동일 launch shape, 동일 cycle budget 조건에서의 반복성 검증입니다. 아직 SM 배치 차이, block scheduling, occupancy 변화, warp id 자체의 위치 효과는 분리하지 않았으므로, 일반적인 warp scheduler 법칙이나 절대적인 연산 속도비로 해석해서는 안 됩니다.",
  },

  codegenImpact: {
    targetPattern:
      "probe_cost_model / dependency_aware_cost_model / workload_signature_validation",

    affectedDecision:
      "cost_signal_promotion / kernel_variant_validation / benchmark_repeatability_policy",

    costSignal:
      "동일 조건에서 64회 반복 실행했을 때 workload별 progress signature가 완전히 동일하게 재현되었습니다. 따라서 v0의 progress ordering은 단일 run noise가 아니라 반복 가능한 workload execution signature 후보로 볼 수 있습니다.",

    ruleCandidate:
      "codegen cost model에는 단일 run에서만 관찰된 signature를 바로 넣지 않고, 반복 실행에서 안정적으로 유지되는 signature만 empirical cost signal 후보로 승격합니다. 반복성 검증을 통과한 workload pattern은 후속 permutation과 mixed workload 실험에서 role-based cost signal로 추적합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium",
    },

    reminder:
      "반복성은 codegen rule 자체가 아니라 cost signal 승격 조건입니다. 같은 조건에서 재현되는 signature만 compiler cost model의 후보 신호로 다룹니다.",
  },

  costModelRole: {
    role: "repeatability_validation",

    description:
      "이 probe는 Warp Signature v0에서 얻은 execution signature가 단일 run noise가 아니라 동일 조건에서 반복 가능한 관찰값인지 검증합니다. 반복성이 확인된 signature는 후속 permutation attribution과 mixed composition 실험에서 cost model signal 후보로 사용할 수 있습니다.",

    usedBy: [
      "warp_signature_permutation",
      "mixed_workload_probe",
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
    ],
  },

  measurementReliability: {
    status: "repeatability_validated",

    issue:
      "반복성은 강하게 확인되었지만, 아직 role과 warp_id가 고정된 조건입니다. 따라서 이 signature가 workload pattern을 따라가는지, 아니면 특정 warp_id 또는 position에 고정되는지는 별도 permutation 검증이 필요합니다.",

    impact:
      "현재 조건에서는 run-to-run noise가 사실상 관찰되지 않았으므로, v0 signature를 안정적인 workload execution signature 후보로 다룰 수 있습니다. 다만 hard codegen rule로 고정하려면 attribution과 composition 검증이 추가로 필요합니다.",

    mitigation:
      "다음 단계에서 workload role을 warp_id에 회전 배치하는 permutation probe를 수행해, signature가 warp_id가 아니라 workload pattern assignment를 따라가는지 확인합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "반복성 검증은 cost signal을 신뢰하기 위한 최소 조건입니다.",
      "단일 run observation은 바로 codegen rule이 될 수 없습니다.",
      "반복 실행에서 유지되는 progress signature만 empirical cost model 후보로 승격합니다.",
      "반복성이 확인되어도 warp_id attribution은 아직 별도 검증이 필요합니다.",
      "이 실험은 새로운 workload rule을 만드는 실험이 아니라 v0 signature의 신뢰도를 높이는 validation입니다.",
    ],
  },

  probingMeaning:
    "이 node는 Warp Signature v0의 관찰값이 반복 가능한 실행 서명인지 검증하는 validation node입니다. v0가 execution pattern별 signature 후보를 만든 단계라면, 이 실험은 그 signature가 run-to-run noise가 아니라 동일 조건에서 재현되는 안정적 관찰값임을 확인하는 단계입니다. codegen 관점에서는 v0 signature를 empirical cost model 후보로 승격하기 위한 repeatability gate 역할을 합니다.",

  relatedNodes: [
    {
      id: "warp_execution_signature_v0",
      reason:
        "v0에서 관찰된 workload별 progress signature의 반복성을 직접 검증하는 후속 probe",
    },
    {
      id: "same_workload_baseline",
      reason:
        "동일 workload 조건에서의 기준선을 바탕으로 workload별 signature의 반복성을 해석함",
    },
    {
      id: "warp",
      reason:
        "warp-level progress 배열이 반복 실행에서 동일하게 유지되는지 관찰함",
    },
    {
      id: "signature_refinement_plan",
      reason:
        "단일 run observation을 안정적인 signature 해석으로 끌어올리기 위한 refinement 단계",
    },
  ],

  connectsTo: [
    {
      id: "warp_signature_permutation",
      type: "signature-attribution",
      label: "repeatability → attribution",
    },
  ],
};

export default warpSignatureRepeatability;