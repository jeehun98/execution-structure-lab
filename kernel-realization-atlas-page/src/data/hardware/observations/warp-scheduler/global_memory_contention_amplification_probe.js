export const globalMemoryContentionAmplificationProbeObservation = {
  id: "global_memory_contention_amplification_probe",
  groupLabel: "Warp Scheduling",
  type: "Memory Signature Modulation",
  label: "Global memory contention amplification",
  title: "global-load warp 수와 address mode가 바꾸는 memory progress signature",

  summary:
    "Mixed Workload Probe에서 dependent_global_load가 낮은 progress와 높은 run-to-run variability를 보인 이후, global memory dependent workload의 수와 address access mode를 바꿔 progress signature가 어떻게 변형되는지 관찰한 probe입니다. 목적은 단순 contention 증가 여부가 아니라 ready warp supply, address locality, latency hiding 조건이 global memory signature를 어떻게 바꾸는지 확인하는 것입니다.",

  keyFindings: [
    {
      label: "1 Global",
      value: "158.792",
      desc: "1 global + 7 light 조건 global 평균 progress",
    },
    {
      label: "4 Global",
      value: "198.104",
      desc: "4 global + 4 light 조건 global 평균 progress",
    },
    {
      label: "8 Global",
      value: "97.370",
      desc: "all_global_chain 조건에서 progress 하락",
    },
    {
      label: "Address Effect",
      value: "274.250 vs 95.667",
      desc: "overlap address와 dispersed address의 큰 차이",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 global-load warp 수가 많아지면 progress가 단순히 낮아지는지 확인하는 실험이 아닙니다. mixed workload에서 관찰된 dependent_global_load의 낮은 progress와 variability가 ready warp supply, address locality, all-warp memory dependency 조건에 따라 어떻게 완화되거나 증폭되는지 확인합니다.",
    question:
      "global memory dependent workload의 progress signature는 global-load warp 수, ready warp supply, address locality에 따라 어떻게 변형되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Ready warp supply",
        text:
          "memory-dependent warp가 stall되더라도 같은 block 안에 ready warp가 남아 있으면 scheduler가 다른 work를 issue할 수 있습니다. 따라서 global memory latency는 active ready work supply에 의해 관찰 signature가 달라질 수 있습니다.",
      },
      {
        label: "All-global chain",
        text:
          "모든 warp가 dependent global load에 묶이면 scheduler가 선택할 ready warp가 부족해지고, memory latency가 더 직접적으로 progress 하락으로 드러날 수 있습니다.",
      },
      {
        label: "Address locality",
        text:
          "overlap address 조건은 cache reuse 또는 locality 효과를 만들 수 있고, dispersed address 조건은 locality를 약화시켜 낮은 progress와 transient variability를 키울 수 있습니다.",
      },
      {
        label: "Role aggregate vs run variation",
        text:
          "role_aggregate_stats의 variance는 role 내부 warp mean 간 차이를 포함할 수 있습니다. run-to-run variability는 warp_scenario_stats의 coefficient_of_variation을 함께 봐야 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU memory bandwidth의 절대값",
    "global memory latency의 절대 cycle 수",
    "global-load warp 수가 증가하면 항상 progress가 감소한다는 단순 법칙",
    "모든 GPU와 모든 occupancy 조건에 대한 일반화",
    "scheduler 내부 policy를 직접 증명했다는 주장",
  ],

  config: {
    numRunsPerScenario: 24,
    numScenarios: 7,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    globalBufferSize: 1_048_576,
  },

  roleMap: {
    0: "light_alu",
    1: "dependent_global_load",
  },

  addressModeMap: {
    0: "mixed_default",
    1: "overlap",
    2: "dispersed",
  },

  scenarioMap: {
    0: "all_light_alu_baseline",
    1: "one_global_seven_light",
    2: "two_global_six_light",
    3: "four_global_four_light",
    4: "all_global_chain",
    5: "four_global_overlap_address",
    6: "four_global_dispersed_address",
  },

  roleAggregateStats: [
    {
      scenarioId: 0,
      scenarioName: "all_light_alu_baseline",
      roleId: 0,
      roleName: "light_alu",
      addressMode: 0,
      addressModeName: "mixed_default",
      meanProgress: 1086,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 1086,
      maxProgress: 1086,
    },
    {
      scenarioId: 1,
      scenarioName: "one_global_seven_light",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 0,
      addressModeName: "mixed_default",
      meanProgress: 158.792,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 158,
      maxProgress: 158,
    },
    {
      scenarioId: 2,
      scenarioName: "two_global_six_light",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 0,
      addressModeName: "mixed_default",
      meanProgress: 182.521,
      variance: 1.94835,
      stddev: 1.39583,
      coefficientOfVariation: 0.00764753,
      minProgress: 181,
      maxProgress: 183,
    },
    {
      scenarioId: 3,
      scenarioName: "four_global_four_light",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 0,
      addressModeName: "mixed_default",
      meanProgress: 198.104,
      variance: 270.359,
      stddev: 16.4426,
      coefficientOfVariation: 0.0829997,
      minProgress: 180,
      maxProgress: 215,
    },
    {
      scenarioId: 4,
      scenarioName: "all_global_chain",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 0,
      addressModeName: "mixed_default",
      meanProgress: 97.3698,
      variance: 0.370416,
      stddev: 0.608618,
      coefficientOfVariation: 0.00625058,
      minProgress: 96,
      maxProgress: 98,
    },
    {
      scenarioId: 5,
      scenarioName: "four_global_overlap_address",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 1,
      addressModeName: "overlap",
      meanProgress: 274.25,
      variance: 0.0460069,
      stddev: 0.214492,
      coefficientOfVariation: 0.000782105,
      minProgress: 273,
      maxProgress: 274,
    },
    {
      scenarioId: 6,
      scenarioName: "four_global_dispersed_address",
      roleId: 1,
      roleName: "dependent_global_load",
      addressMode: 2,
      addressModeName: "dispersed",
      meanProgress: 95.6667,
      variance: 0.0633681,
      stddev: 0.25173,
      coefficientOfVariation: 0.00263133,
      minProgress: 95,
      maxProgress: 96,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 7,
      role: "one_global_seven_light",
      progress: 158.792,
      lastClock: null,
      sink: null,
      signature:
        "1 global + 7 light 조건에서 단일 dependent_global_load가 남긴 memory-dependent progress signature",
    },
    {
      block: 0,
      warpId: 6,
      role: "two_global_six_light",
      progress: 182.521,
      lastClock: null,
      sink: null,
      signature:
        "2 global + 6 light 조건에서 global-load progress가 1 global보다 증가한 signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "four_global_four_light",
      progress: 198.104,
      lastClock: null,
      sink: null,
      signature:
        "4 global + 4 light 조건에서 ready warp supply와 memory dependency가 공존한 signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "all_global_chain",
      progress: 97.37,
      lastClock: null,
      sink: null,
      signature:
        "모든 warp가 dependent global load에 묶였을 때 ready warp supply 부족으로 낮아진 signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "four_global_overlap_address",
      progress: 274.25,
      lastClock: null,
      sink: null,
      signature:
        "overlap address 조건에서 높은 progress와 낮은 variability를 보인 locality/reuse-sensitive signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "four_global_dispersed_address",
      progress: 95.667,
      lastClock: null,
      sink: null,
      signature:
        "dispersed address 조건에서 낮은 progress와 초기 transient variability를 보인 signature",
    },
  ],

  ordering: [
    "four_global_overlap_address",
    "four_global_four_light",
    "two_global_six_light",
    "one_global_seven_light",
    "all_global_chain",
    "four_global_dispersed_address",
  ],

  ratios: {
    overlapVsDispersed: 2.87,
    overlapVsAllGlobal: 2.82,
    fourGlobalMixedVsAllGlobal: 2.03,
    twoGlobalVsOneGlobal: 1.15,
    fourGlobalVsOneGlobal: 1.25,
  },

  warpScenarioStatsHighlights: [
    {
      scenarioId: 1,
      scenarioName: "one_global_seven_light",
      warpId: 7,
      roleName: "dependent_global_load",
      meanProgress: 158.792,
      coefficientOfVariation: 0.104227,
      minProgress: 85,
      maxProgress: 168,
    },
    {
      scenarioId: 3,
      scenarioName: "four_global_four_light",
      warpId: 4,
      roleName: "dependent_global_load",
      meanProgress: 180.167,
      coefficientOfVariation: 0.0888885,
      minProgress: 105,
      maxProgress: 190,
    },
    {
      scenarioId: 5,
      scenarioName: "four_global_overlap_address",
      warpId: 4,
      roleName: "dependent_global_load",
      meanProgress: 274.208,
      coefficientOfVariation: 0.00470563,
      minProgress: 272,
      maxProgress: 277,
    },
    {
      scenarioId: 6,
      scenarioName: "four_global_dispersed_address",
      warpId: 4,
      roleName: "dependent_global_load",
      meanProgress: 96.0833,
      coefficientOfVariation: 0.0821652,
      minProgress: 61,
      maxProgress: 99,
    },
  ],

  interpretation: [
    "dependent_global_load signature는 global-load warp 수에 단순 비례해 악화되지 않았습니다.",
    "1~4개의 global-load warp가 light_alu warp와 공존할 때 global progress는 158.792 → 182.521 → 198.104로 증가했습니다.",
    "모든 warp가 global-load로 채워진 all_global_chain 조건에서는 progress가 97.370으로 크게 하락했습니다.",
    "이는 global memory latency가 단순히 global warp 수만으로 결정되지 않고, ready warp supply가 남아 있는지에 따라 관찰 signature가 크게 달라짐을 시사합니다.",
    "overlap address 조건에서는 dependent_global_load progress가 274.250으로 크게 증가하고 variability도 낮아졌습니다.",
    "dispersed address 조건에서는 progress가 95.667로 낮아지고, warp-level CV가 약 0.08 수준으로 커졌습니다.",
    "codegen 관점에서는 memory-dependent kernel 비용을 global load count 하나로 모델링하지 말고, ready warp supply, address locality/reuse, all-warp memory dependency 여부를 함께 고려해야 합니다.",
  ],

  caveats: [
    "synthetic dependent global memory chain 기반 실험입니다.",
    "단일 block, 8 warps/block, 고정 launch shape 조건입니다.",
    "role_aggregate_stats의 variance는 role 내부 warp mean 간 차이를 반영할 수 있으므로 run-to-run variability는 warp_scenario_stats의 CV를 함께 봐야 합니다.",
    "overlap address의 높은 progress는 cache locality 또는 reuse 가능성을 시사하지만, 정확한 cache level이나 hit rate를 직접 측정한 것은 아닙니다.",
    "dispersed address의 낮은 progress와 초기 variability는 cold/warm state, TLB/cache state, memory access dispersion이 섞인 결과일 수 있습니다.",
  ],

  codegenImpact: {
    targetPattern:
      "memory_dependent_kernel / mixed_compute_memory_kernel / global_load_chain / latency_hiding_sensitive_kernel",

    affectedDecision:
      "memory_cost_model / warp_role_composition / block_dim_and_occupancy / address_locality_strategy / latency_hiding_variant_selection",

    costSignal:
      "global memory dependent progress는 global-load warp 수에 단순 비례해 악화되지 않았습니다. light_alu ready warp가 공존하는 1~4 global 조건에서는 global progress가 증가했고, all_global_chain에서는 ready warp supply 부족으로 progress가 크게 낮아졌습니다. 또한 overlap address는 높은 progress와 낮은 variability를, dispersed address는 낮은 progress와 높은 초기 variability를 만들었습니다.",

    ruleCandidate:
      "memory-dependent kernel의 cost를 global load count만으로 추정하지 않습니다. cost model은 active ready warp supply, address locality/reuse 가능성, all-warp memory dependency 여부, run-to-run variability를 별도 신호로 포함합니다. global-load role이 많은 variant라도 ready work가 충분하고 locality가 있으면 비용이 완화될 수 있으며, 모든 warp가 memory dependency에 묶이는 variant는 latency hiding 실패 위험으로 penalty를 부여합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "global memory cost는 load 개수만의 함수가 아닙니다. ready warp supply와 address locality가 없으면 latency가 드러나고, reuse/locality가 있으면 같은 global-load 구조도 전혀 다른 signature를 보입니다.",
  },

  costModelRole: {
    role: "memory_signature_modulation",

    description:
      "이 probe는 mixed workload에서 관찰된 dependent_global_load signature를 global-load warp count와 address mode 조건으로 확장합니다. 결과적으로 global memory cost model에는 contention count뿐 아니라 ready warp supply, locality/reuse, cold/warm transient, variability signal이 들어가야 함을 보여줍니다.",

    usedBy: [
      "latency_hiding_ratio_probe",
      "ready_warp_supply_probe",
      "latency_hiding_warmup_stability_probe",
      "shared_memory_ready_interference_probe",
    ],
  },

  measurementReliability: {
    status: "memory_modulation_observed",

    issue:
      "이 실험은 단일 block, 8 warps/block, synthetic dependent global chain, 고정 launch shape 조건에서 수행되었습니다. 또한 role aggregate variance와 run-to-run variance를 구분해서 해석해야 합니다.",

    impact:
      "현재 조건에서는 global memory progress가 단순 contention count보다 ready warp supply와 address locality에 의해 더 강하게 변형된다고 볼 수 있습니다. 다만 실제 AI kernel에 적용하려면 coalescing, cache line reuse, vectorized load, occupancy 조건과 연결해 추가 검증이 필요합니다.",

    mitigation:
      "후속 실험에서 ready warp supply를 직접 통제하고, latency hiding ratio를 측정하며, warmup/cold state와 address locality를 분리합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "global load count만으로 memory cost를 계산하지 않습니다.",
      "memory-heavy kernel에서는 ready warp supply와 occupancy가 latency hiding 자원입니다.",
      "모든 warp가 memory dependency에 묶이면 latency hiding이 어려워지므로 penalty를 줍니다.",
      "address overlap/reuse 가능성은 global memory progress를 크게 바꿀 수 있습니다.",
      "dispersed address나 cold state에 민감한 kernel은 mean뿐 아니라 CV, min/max, transient를 함께 봅니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 global memory signature가 단순 contention count보다 ready warp supply와 address locality에 의해 변형됨을 보여줍니다. 따라서 다음 latency hiding ratio probe에서는 memory-stalled warp가 있는 동안 ready warp가 빈 issue 기회를 얼마나 채우는지 직접 분리합니다.",
    examples: [
      "latency_hiding_ratio_probe에서는 global-stalled warp와 ready light_alu warp의 progress 비율을 직접 비교합니다.",
      "ready_warp_supply_probe에서는 ready warp의 수와 종류를 바꿔 global memory signature 변형을 분리합니다.",
      "warmup stability probe에서는 dispersed/cold state에서 보이는 초기 variability가 steady-state와 어떻게 다른지 확인합니다.",
      "shared memory ready interference probe에서는 ready source가 shared memory일 때 global-stalled progress가 어떻게 바뀌는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Latency Hiding Ratio Probe",
    desc:
      "global memory progress가 ready warp supply에 의해 변형되는 신호가 관찰되었으므로, 다음 단계에서는 memory-stalled warp가 있는 동안 ready warp가 latency를 얼마나 숨기는지 직접 정량화합니다.",
    configText:
      "vary stalled_global_warp_count\nvary ready_light_alu_warp_count\nmeasure ready_progress / stalled_progress ratio",
    metrics: [
      "ready warp progress 유지율",
      "stalled global warp progress",
      "ready/stalled progress ratio",
      "warp supply 감소에 따른 latency hiding 붕괴 지점",
    ],
  },

  previousObservationId: "mixed_workload_probe",
  nextObservationId: "latency_hiding_ratio_probe",
};