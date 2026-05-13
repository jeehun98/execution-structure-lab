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

  codegenImpact: {
  targetPattern:
    "generic_kernel_body / elementwise_chain / reduction_body / memory_dependent_kernel",

  affectedDecision:
    "dependency_aware_cost_model / instruction_interleaving / kernel_variant_selection",

  costSignal:
    "동일한 cycle budget 안에서 independent ALU, dependent ALU chain, shared load, dependent global load는 구분 가능한 warp progress signature를 남겼습니다. 특히 shared_load가 dependent_alu_chain보다 높은 progress를 보였으므로, cost model은 단순 ALU vs memory 분류가 아니라 dependency depth와 independent instruction availability를 함께 고려해야 합니다.",

  ruleCandidate:
    "kernel body의 비용을 instruction count만으로 추정하지 말고, dependency chain 길이, memory dependency 여부, 독립 instruction 공급 가능성을 별도 cost signal로 반영합니다. dependent chain이 긴 kernel은 단순 unroll보다 multiple elements per thread, load/compute interleaving, independent work scheduling을 우선 고려합니다.",

  confidence: {
    observation: "medium-high",
    interpretation: "medium",
    codegen: "medium",
  },

  reminder:
    "이 실험의 핵심은 'ALU가 빠르고 memory가 느리다'가 아닙니다. memory access가 있어도 dependency chain보다 높은 progress를 보일 수 있으므로, codegen cost model은 dependency-aware 해야 합니다.",
},

costModelRole: {
  role: "execution_signature_seed",

  description:
    "후속 probe-driven cost model의 첫 번째 workload signature seed입니다. 이 probe는 각 workload class가 동일 cycle budget 안에서 남기는 상대 progress ordering을 제공하며, 이후 repeatability, permutation, mixed workload 검증을 통해 cost signal로 승격될 후보입니다.",

  usedBy: [
    "warp_signature_repeatability",
    "warp_signature_permutation",
    "mixed_workload_probe",
    "ready_warp_supply_probe",
    "latency_hiding_ratio_probe",
  ],
},

measurementReliability: {
  status: "needs_validation",

  issue:
    "현재 결과는 단일 run의 v0 observation이며, role이 warp_id에 고정되어 있습니다. 따라서 단일 run noise와 warp_id placement bias를 완전히 배제하려면 반복 실행과 role rotation이 필요합니다.",

  impact:
    "현재 ordering은 execution signature 후보로 사용할 수 있지만, hard codegen rule로 바로 고정하기에는 이릅니다. repeatability와 permutation 검증 이후 cost model signal로 신뢰도를 높일 수 있습니다.",

  mitigation:
    "반복 실행으로 ordering 안정성을 확인하고, role rotation으로 workload signature가 warp_id가 아니라 role assignment를 따라가는지 확인합니다. 또한 progress history sampling을 추가하면 최종 progress뿐 아니라 시간에 따른 slope와 plateau를 확인할 수 있습니다.",
},

codegenReminder: {
  title: "Codegen reminder",
  items: [
    "operation cost는 단순 instruction count가 아닙니다.",
    "ALU vs memory 분류보다 dependency structure가 더 중요한 설명 축이 될 수 있습니다.",
    "dependent chain이 긴 kernel은 단순 unroll보다 independent work interleaving을 먼저 고려합니다.",
    "global memory dependent path는 load count뿐 아니라 address dependency와 latency hiding 가능성을 함께 봐야 합니다.",
    "이 v0 결과는 hard rule이 아니라 repeatability와 permutation 검증 전의 signature seed입니다.",
  ],
},
};

export default warpExecutionSignatureV0;