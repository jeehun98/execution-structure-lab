const warpSignaturePermutation = {
  id: "warp_signature_permutation",
  label: "Warp Signature Permutation",
  title: "Warp 실행 구조 서명 permutation 검증",
  description:
    "Warp Signature Repeatability에서 안정적으로 재현된 progress signature가 workload pattern을 따라가는지, 아니면 warp id 또는 warp position에 고정되는지 분리하기 위해 workload pattern assignment를 warp id에 회전 배치한 probe입니다. 이 실험은 signature의 귀속 대상을 확인하는 attribution 단계입니다.",

  status: "observed",
  kind: "experiment",

  layer: "signature-attribution",
  order: 4,

  detailPath: "/hardware-evidence/warp_signature_permutation",

  graphSummary: {
    intro:
      "반복 실행에서 안정적으로 재현된 warp progress signature가 특정 warp_id에 고정된 것인지, 아니면 workload pattern assignment를 따라 이동하는지 확인한 attribution 실험입니다.",

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
      {
        id: "warp_signature_repeatability",
        label: "Warp Signature Repeatability",
        summary:
          "v0에서 관찰된 progress signature가 단일 run의 우연이 아니라 동일 조건 반복 실행에서도 유지되는지 검증했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 반복 가능한 signature의 귀속 대상을 확인하는 attribution 단계입니다. signature가 warp_id 또는 warp position에 고정된 것인지, workload execution pattern 자체를 따라가는지 분리합니다.",

    keyTakeaway:
      "핵심은 progress 차이가 특정 warp_id의 고정 bias가 아니라, workload assignment가 이동할 때 함께 이동하는 실행 구조의 서명인지 확인하는 것입니다. 이 결과는 후속 codegen cost model이 특정 warp_id가 아니라 warp role과 workload pattern을 기준으로 비용 신호를 해석해야 함을 뒷받침합니다.",

    nextQuestion:
      "signature가 workload pattern에 귀속됨을 확인했다면, 이제 그 signature가 isolated condition을 넘어 서로 다른 workload가 공존하는 mixed composition에서도 유지되는지 확인해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "workload pattern을 warp id에 permutation한 결과, 높은 progress와 낮은 progress의 위치가 warp id에 고정되지 않고 pattern assignment를 따라 이동했습니다. pattern aggregate ordering은 0 > 1 > 2 > 3으로 유지되었습니다. 따라서 현재 조건에서 Warp Signature v0의 progress 차이는 특정 warp id의 고정 bias라기보다 workload execution pattern이 남긴 실행 서명으로 해석할 수 있습니다. codegen 관점에서는 warp_id가 아니라 warp role과 assigned workload structure를 기준으로 cost signal을 추적해야 함을 시사합니다.",

    metrics: [
      {
        label: "pattern 0",
        value: "584.094",
        note: "가장 높은 평균 progress. 어느 warp에 배치되어도 높은 signature를 유지",
      },
      {
        label: "pattern 1",
        value: "558.820",
        note: "두 번째로 높은 평균 progress",
      },
      {
        label: "pattern 2",
        value: "476.594",
        note: "pattern 0, 1보다 낮은 progress signature",
      },
      {
        label: "pattern 3",
        value: "467.719",
        note: "가장 낮은 평균 progress signature",
      },
      {
        label: "dominant ordering",
        value: "0 > 1 > 2 > 3",
        note: "permutation 이후에도 pattern별 progress ordering 유지",
      },
    ],

    interpretation:
      "permutation 0에서는 pattern 0이 warp 0과 4에 배치되어 높은 progress를 보였고, permutation 1에서는 pattern 0이 warp 3과 7로 이동하자 높은 progress도 함께 이동했습니다. permutation 2와 3에서도 같은 흐름이 반복되었습니다. 이는 progress signature가 warp id 자체보다 workload pattern에 더 강하게 귀속됨을 보여줍니다.",

    caveat:
      "pattern별 progress ordering은 명확하지만, 같은 pattern 내부에서도 1~3 progress 정도의 작은 차이가 남아 있습니다. 따라서 warp position 또는 clock64 boundary 효과가 완전히 배제된 것은 아닙니다. 또한 실험은 단일 block, 동일 launch shape 조건이므로 SM 배치, block scheduling, occupancy 변화까지 일반화해서 해석하면 안 됩니다.",
  },

  codegenImpact: {
    targetPattern:
      "warp_role_assignment / multi_role_block_kernel / dependency_aware_cost_model",

    affectedDecision:
      "workload_to_warp_mapping / role_based_cost_tracking / kernel_variant_validation",

    costSignal:
      "permutation 이후에도 progress ordering이 warp_id가 아니라 workload pattern assignment를 따라 이동했습니다. 따라서 probe-derived cost signal은 고정 warp_id가 아니라 warp role과 assigned execution pattern을 기준으로 추적해야 합니다.",

    ruleCandidate:
      "kernel codegen은 특정 warp_id에 성능 의미를 부여하지 말고, 각 warp에 배정된 role과 workload structure를 기준으로 cost를 추정합니다. role rotation 이후에도 유지되는 signature만 cost model signal로 승격합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium-high",
    },

    reminder:
      "warp_id가 아니라 warp role을 보라. codegen cost model은 'warp 0이 빠르다'가 아니라 '이 workload role이 이런 signature를 남긴다'로 기록해야 합니다.",
  },

  costModelRole: {
    role: "signature_attribution_validation",

    description:
      "이 probe는 v0와 repeatability에서 관찰된 progress signature의 귀속 대상을 검증합니다. signature가 특정 warp_id에 고정되지 않고 workload pattern assignment를 따라 이동함을 보여주므로, 후속 cost model은 warp_id 기반이 아니라 role/workload-pattern 기반으로 작성될 수 있습니다.",

    usedBy: [
      "mixed_workload_probe",
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
      "ready_warp_supply_probe",
    ],
  },

  measurementReliability: {
    status: "validated_attribution",

    issue:
      "실험은 1 block, 8 warps/block, 동일 launch shape 조건에서 수행되었습니다. 따라서 block scheduling, multi-SM placement, occupancy 변화까지 일반화할 수는 없습니다.",

    impact:
      "현재 조건에서는 progress signature가 warp_id보다 workload pattern에 강하게 귀속된다고 해석할 수 있습니다. 이 덕분에 후속 mixed workload 실험에서 role별 progress signature를 의미 있는 cost signal로 다룰 수 있습니다.",

    mitigation:
      "다른 block 수, 다른 occupancy 조건, 다른 SM 배치 조건에서도 동일한 attribution이 유지되는지 확인하면 일반성이 강화됩니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "특정 warp_id에 성능 의미를 부여하지 말고, warp role과 workload assignment를 기준으로 해석합니다.",
      "role rotation을 통과한 signature만 cost model signal로 승격합니다.",
      "warp-level codegen에서는 role assignment와 workload structure가 비용 추정의 기본 단위입니다.",
      "같은 pattern 내부의 작은 차이는 measurement noise, position effect, timing boundary 가능성으로 남겨둡니다.",
      "이 실험은 hard scheduling policy를 밝힌 것이 아니라, signature attribution을 검증한 것입니다.",
    ],
  },

  probingMeaning:
    "이 node는 반복 가능성이 확인된 warp progress signature의 원인을 분리하는 attribution probe입니다. signature가 warp id에 고정된 것이 아니라 workload execution pattern을 따라 이동한다는 점을 보여주며, 이후 mixed workload와 contention amplification 실험의 해석 기반을 강화합니다. codegen 관점에서는 warp_id가 아니라 role/workload-pattern 기반 cost model로 나아가기 위한 attribution validation입니다.",

  relatedNodes: [
    {
      id: "warp_execution_signature_v0",
      reason:
        "v0에서 관찰된 execution pattern별 progress 차이가 warp id bias가 아니라 workload pattern에 의해 주로 형성되었는지 검증함",
    },
    {
      id: "warp_signature_repeatability",
      reason:
        "반복 실행에서 안정적으로 재현된 signature를 대상으로 pattern attribution을 수행함",
    },
    {
      id: "same_workload_baseline",
      reason:
        "동일 workload 조건에서의 기준선을 바탕으로, workload pattern 차이에 의한 signature 귀속 여부를 해석함",
    },
    {
      id: "warp",
      reason:
        "warp-level progress를 기준으로 workload pattern과 warp id 효과를 분리함",
    },
    {
      id: "signature_refinement_plan",
      reason:
        "단일 run observation을 반복성 검증과 pattern attribution을 거쳐 더 신뢰할 수 있는 execution signature로 정제함",
    },
  ],

  connectsTo: [
    {
      id: "mixed_workload_probe",
      type: "composition-probe",
      label: "attribution → mixed composition",
    },
  ],
};

export default warpSignaturePermutation;