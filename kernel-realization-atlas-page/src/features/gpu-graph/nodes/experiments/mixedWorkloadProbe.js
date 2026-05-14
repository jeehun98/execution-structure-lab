const mixedWorkloadProbe = {
  id: "mixed_workload_probe",
  label: "Mixed Workload Probe",
  title: "혼합 workload warp progress 상호작용 probe",
  description:
    "Warp Signature v0, Repeatability, Permutation 검증 이후, 서로 다른 workload가 같은 block 안에서 공존할 때 role별 warp progress signature가 어떻게 유지되거나 변형되는지 관찰한 후속 probe입니다. 이 실험은 isolated workload signature가 mixed composition에서도 유지되는지, 그리고 memory-dependent workload가 run-to-run variability를 증가시키는지 확인합니다.",

  status: "observed",
  kind: "experiment",

  layer: "composition-result",
  order: 5,

  detailPath: "/hardware-evidence/mixed_workload_probe",

  graphSummary: {
    intro:
      "검증된 workload execution signature가 isolated condition을 넘어, 서로 다른 workload가 같은 block 안에 공존하는 mixed composition에서도 유지되는지 확인한 실험입니다.",

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
      {
        id: "warp_signature_permutation",
        label: "Warp Signature Permutation",
        summary:
          "반복 가능한 signature가 특정 warp_id에 고정된 것이 아니라 workload pattern assignment를 따라 이동하는지 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 validated and attributed signature를 heterogeneous workload composition으로 확장하는 첫 번째 composition probe입니다. 앞선 검증들이 signature 자체의 신뢰도를 높였다면, 이 실험은 그 signature가 다른 workload와 공존할 때도 유지되는지 확인합니다.",

    keyTakeaway:
      "핵심은 개별 progress 수치가 아니라, isolated workload에서 관찰된 role별 signature ordering이 mixed workload 조건에서도 유지되는지와 memory-dependent workload가 variability를 키우는지 확인하는 것입니다. 이 결과는 codegen cost model이 단일 workload signature뿐 아니라 mixed role composition에서의 변형 가능성까지 고려해야 함을 보여줍니다.",

    nextQuestion:
      "mixed composition에서 dependent_global_load가 낮은 progress와 높은 variability를 보였다면, 이제 그 원인이 단순 global memory contention인지, ready warp supply와 address locality에 의해 변형되는지 분리해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "혼합 workload 조건에서도 role별 progress ordering은 안정적으로 유지되었습니다. mixed_all_roles 조건에서 ordering은 light_alu > dependent_alu > shared_load > dependent_global_load였고, 평균 progress는 590.812 > 539.688 > 325.625 > 103.219로 관찰되었습니다. 특히 dependent_global_load는 평균 progress가 가장 낮을 뿐 아니라 run-to-run 변동성이 가장 크게 나타나, global memory dependency가 낮은 progress signature와 높은 variability signature를 동시에 남긴다는 점을 보여줍니다. codegen 관점에서는 mixed-role kernel에서도 role별 cost signal을 분리해 추적해야 하며, memory-dependent role은 평균 비용뿐 아니라 variance/tail-risk까지 고려해야 합니다.",

    metrics: [
      {
        label: "all light ALU baseline",
        value: "593",
        note: "모든 warp가 light_alu일 때의 기준 progress",
      },
      {
        label: "light ALU with dependent ALU",
        value: "582.25",
        note: "dependent_alu와 공존할 때 light_alu progress",
      },
      {
        label: "light ALU with shared load",
        value: "583.891",
        note: "shared_load와 공존할 때 light_alu progress",
      },
      {
        label: "light ALU with global load",
        value: "588.188",
        note: "dependent_global_load와 공존할 때 light_alu progress가 baseline에 더 가깝게 유지됨",
      },
      {
        label: "mixed all roles ordering",
        value: "590.812 > 539.688 > 325.625 > 103.219",
        note: "light_alu > dependent_alu > shared_load > dependent_global_load",
      },
      {
        label: "global load variability",
        value: "CV ≈ 0.10",
        note: "mixed_all_roles에서 dependent_global_load가 가장 큰 run-to-run 변동성을 보임",
      },
    ],

    interpretation:
      "이 결과는 workload signature가 isolated pattern에서만 나타나는 것이 아니라, heterogeneous warp composition에서도 유지된다는 점을 보여줍니다. 동시에 dependent_global_load는 평균 progress가 낮을 뿐 아니라 run 간 변동성이 커서, global memory dependency가 warp progress에 낮은 진행률과 높은 temporal variability를 함께 남긴다는 신호를 제공합니다.",

    caveat:
      "이 실험은 단일 block, 고정 launch shape, synthetic workload 조건에서 수행되었습니다. 따라서 결과를 절대적인 처리량이나 일반적인 scheduler 정책으로 해석하면 안 되며, mixed workload composition에서 나타난 warp-level progress signature로 읽어야 합니다.",
  },

  codegenImpact: {
    targetPattern:
      "multi_role_block_kernel / mixed_compute_memory_kernel / memory_dependent_kernel",

    affectedDecision:
      "warp_role_composition / role_based_cost_tracking / memory_latency_risk_model / kernel_variant_validation",

    costSignal:
      "mixed workload composition에서도 role별 progress ordering이 유지되었습니다. light_alu는 높은 progress를 유지했고, dependent_global_load는 가장 낮은 평균 progress와 가장 큰 run-to-run variability를 보였습니다. 따라서 mixed-role kernel의 cost model은 role별 평균 progress뿐 아니라 memory-dependent role의 variance와 tail behavior까지 추적해야 합니다.",

    ruleCandidate:
      "heterogeneous warp-role kernel을 생성할 때 각 warp role을 하나의 평균 비용으로 합치지 말고, role별 cost signal을 분리합니다. memory-dependent role이 포함된 variant는 평균 progress뿐 아니라 CV, min/max, tail drop 가능성을 함께 평가합니다. global-load role의 낮은 progress와 높은 variability가 관찰되면 ready warp supply, address locality, latency hiding capacity를 후속 cost factor로 분리합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "mixed kernel에서는 평균 progress만 보면 안 됩니다. global memory dependent role은 낮은 평균과 높은 variability를 동시에 만들 수 있으므로, role별 mean/CV/tail을 분리해서 봐야 합니다.",
  },

  costModelRole: {
    role: "mixed_composition_validation",

    description:
      "이 probe는 v0, repeatability, permutation을 통과한 workload signature가 heterogeneous composition에서도 유지되는지 검증합니다. isolated signature가 mixed condition에서도 완전히 사라지지 않음을 보여주며, memory-dependent role의 variability를 별도 cost signal로 분리해야 한다는 근거를 제공합니다.",

    usedBy: [
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
      "ready_warp_supply_probe",
      "shared_memory_ready_interference_probe",
    ],
  },

  measurementReliability: {
    status: "composition_observed",

    issue:
      "실험은 단일 block, 8 warps/block, 고정 launch shape, synthetic workload 조건에서 수행되었습니다. 따라서 multi-block scheduling, SM placement, occupancy 변화까지 일반화할 수는 없습니다.",

    impact:
      "현재 조건에서는 role별 signature ordering이 mixed composition에서도 유지된다고 해석할 수 있습니다. 또한 dependent_global_load의 variability가 두드러지므로, 이후 global memory 계열 probe를 설계할 근거가 됩니다.",

    mitigation:
      "block 수, role 비율, global buffer size, address locality, ready warp supply를 변화시키는 후속 probe로 global memory variability의 원인을 분리합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "mixed workload에서도 role별 signature ordering은 사라지지 않을 수 있습니다.",
      "heterogeneous kernel은 role별 cost를 분리해서 추적해야 합니다.",
      "dependent_global_load는 평균 progress뿐 아니라 variability signal도 남깁니다.",
      "memory-dependent role이 있는 kernel variant는 mean만 보지 말고 CV, min/max, tail event를 함께 봅니다.",
      "이 결과는 global memory contention, ready warp supply, latency hiding probe로 이어지는 근거입니다.",
    ],
  },

  probingMeaning:
    "이 node는 workload별 signature가 단독 조건을 넘어 혼합 workload composition에서도 유지되는지 확인하는 후속 실험입니다. 특히 global memory dependency가 낮은 progress뿐 아니라 높은 run-to-run variability를 유발한다는 점을 보여주며, 이후 contention amplification과 latency hiding 계열 실험으로 확장할 근거를 제공합니다. codegen 관점에서는 mixed-role kernel의 role별 cost signal과 memory-dependent variance signal을 분리해야 함을 보여주는 composition validation node입니다.",

  relatedNodes: [
    {
      id: "warp_signature_permutation",
      reason:
        "signature가 workload pattern을 따라간다는 attribution 결과 이후, mixed composition에서도 role별 signature가 유지되는지 확인함",
    },
    {
      id: "warp_signature_repeatability",
      reason:
        "반복 가능한 signature를 기반으로 heterogeneous workload 조건에서의 변형 여부를 확인함",
    },
    {
      id: "warp_execution_signature_v0",
      reason:
        "v0에서 관찰된 execution pattern별 progress 차이가 혼합 workload 조건에서도 유지되는지 비교함",
    },
    {
      id: "same_workload_baseline",
      reason:
        "동일 workload 조건에서의 기준선을 바탕으로 mixed workload 조건의 progress 차이를 해석함",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_load role이 가장 낮은 progress와 가장 높은 run-to-run variability를 보임",
    },
    {
      id: "shared_memory",
      reason:
        "shared_load role이 낮은 progress를 보이지만 global load보다 훨씬 안정적인 signature를 보임",
    },
    {
      id: "latency_hiding",
      reason:
        "global-load warp가 stall되는 동안 ready warp의 progress가 어떻게 유지되는지 해석하기 위한 후속 연결점",
    },
  ],

  connectsTo: [
    {
      id: "global_memory_contention_amplification_probe",
      type: "memory-signature-modulation",
      label: "global variability → memory modulation",
    },
    {
      id: "latency_hiding_ratio_probe",
      type: "suggests",
      label: "global stall → latency hiding",
    },
  ],
};

export default mixedWorkloadProbe;