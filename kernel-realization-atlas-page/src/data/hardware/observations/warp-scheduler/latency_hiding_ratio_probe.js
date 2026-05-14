export const latencyHidingRatioProbeObservation = {
  id: "latency_hiding_ratio_probe",
  groupLabel: "Warp Scheduling",
  type: "Latency Hiding Analysis",
  label: "Latency hiding ratio",
  title: "ready/stalled warp 비율이 만드는 latency hiding progress regime",

  summary:
    "Global Memory Contention Amplification Probe에서 global memory progress signature가 ready warp supply와 address locality에 의해 크게 변형됨이 관찰된 이후, ready light_alu warp와 stalled dependent_global warp의 비율을 직접 바꿔 latency hiding 효과를 관찰한 probe입니다. 이 실험은 global memory stall이 있을 때 ready warp가 빈 실행 기회를 얼마나 유지하는지, 그리고 stalled warp 비율이 증가할 때 progress signature가 어떤 regime으로 변하는지 확인합니다.",

  keyFindings: [
    {
      label: "Ready Baseline",
      value: "989.320",
      desc: "8 ready / 0 stalled 기준 progress",
    },
    {
      label: "Ready Stability",
      value: "≈ 980~989",
      desc: "stalled warp 증가에도 ready progress 유지",
    },
    {
      label: "Global Transition",
      value: "2 → 3 stalled",
      desc: "global progress가 126에서 83 수준으로 전환",
    },
    {
      label: "Low Plateau",
      value: "≈ 77~83",
      desc: "3+ stalled 조건의 global-stalled regime",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 global memory workload의 낮은 progress를 단순히 memory latency로만 설명하지 않고, 같은 block 안에 남아 있는 ready warp가 그 latency를 얼마나 숨기는지 확인합니다. ready light_alu warp와 dependent_global_stalled warp의 비율을 직접 바꾸어, ready work supply가 유지될 때와 줄어들 때 progress signature가 어떻게 달라지는지 관찰합니다.",
    question:
      "memory-stalled warp가 증가할 때 ready warp는 progress를 유지하는가? 그리고 dependent_global_stalled progress는 어떤 비율에서 다른 regime으로 전환되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Latency hiding",
        text:
          "global memory load가 오래 걸려도 scheduler가 다른 ready warp를 issue할 수 있으면 latency 일부가 숨겨집니다. 따라서 memory cost는 단일 warp latency가 아니라 ready work supply와 함께 관찰됩니다.",
      },
      {
        label: "Ready warp supply",
        text:
          "ready warp가 많다는 것은 scheduler가 선택할 수 있는 instruction stream이 남아 있다는 뜻입니다. memory-heavy kernel에서 occupancy와 ILP가 중요한 이유입니다.",
      },
      {
        label: "Stalled warp ratio",
        text:
          "stalled warp 비율이 높아지면 issue 가능한 work가 줄어들고, 특정 지점부터 global memory progress가 낮은 plateau로 전환될 수 있습니다.",
      },
      {
        label: "Transient variability",
        text:
          "초기 run의 낮은 progress는 cache/TLB warm state, run ordering, clock boundary 등에 의해 발생할 수 있습니다. 평균과 CV를 raw run pattern과 함께 봐야 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "global memory latency의 절대 cycle 수",
    "GPU scheduler의 내부 issue policy",
    "모든 GPU와 모든 occupancy 조건에서 같은 전환점이 나타난다는 주장",
    "progress ratio가 실제 latency hiding ratio와 완전히 동일하다는 주장",
    "CV가 stalled warp 수에 따라 단조 증가한다는 주장",
  ],

  config: {
    numRunsPerScenario: 32,
    numScenarios: 9,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    globalBufferSize: 1_048_576,
  },

  roleMap: {
    0: "light_alu_ready",
    1: "dependent_global_stalled",
  },

  scenarioMap: {
    0: "8_ready_0_stalled",
    1: "7_ready_1_stalled",
    2: "6_ready_2_stalled",
    3: "5_ready_3_stalled",
    4: "4_ready_4_stalled",
    5: "3_ready_5_stalled",
    6: "2_ready_6_stalled",
    7: "1_ready_7_stalled",
    8: "0_ready_8_stalled",
  },

  roleAggregateStats: [
    {
      scenarioId: 0,
      scenarioName: "8_ready_0_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 8,
      stalledWarpCount: 0,
      meanProgress: 989.32,
      variance: 0.237732,
      stddev: 0.487578,
      coefficientOfVariation: 0.000703437,
      minProgress: 985,
      maxProgress: 990,
    },
    {
      scenarioId: 1,
      scenarioName: "7_ready_1_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 7,
      stalledWarpCount: 1,
      meanProgress: 986.152,
      variance: 47.7886,
      stddev: 6.91293,
      coefficientOfVariation: 0.000595902,
      minProgress: 967,
      maxProgress: 989,
    },
    {
      scenarioId: 1,
      scenarioName: "7_ready_1_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 7,
      stalledWarpCount: 1,
      meanProgress: 124.156,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.113015,
      minProgress: 55,
      maxProgress: 135,
    },
    {
      scenarioId: 2,
      scenarioName: "6_ready_2_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 6,
      stalledWarpCount: 2,
      meanProgress: 981.964,
      variance: 80.9181,
      stddev: 8.99545,
      coefficientOfVariation: 0.00126656,
      minProgress: 967,
      maxProgress: 989,
    },
    {
      scenarioId: 2,
      scenarioName: "6_ready_2_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 6,
      stalledWarpCount: 2,
      meanProgress: 126.312,
      variance: 3.39941,
      stddev: 1.84375,
      coefficientOfVariation: 0.0663096,
      minProgress: 56,
      maxProgress: 133,
    },
    {
      scenarioId: 3,
      scenarioName: "5_ready_3_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 5,
      stalledWarpCount: 3,
      meanProgress: 982.106,
      variance: 8.06195,
      stddev: 2.83936,
      coefficientOfVariation: 0.00173641,
      minProgress: 979,
      maxProgress: 988,
    },
    {
      scenarioId: 3,
      scenarioName: "5_ready_3_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 5,
      stalledWarpCount: 3,
      meanProgress: 83.2396,
      variance: 0.966363,
      stddev: 0.983038,
      coefficientOfVariation: 0.0573754,
      minProgress: 51,
      maxProgress: 85,
    },
    {
      scenarioId: 4,
      scenarioName: "4_ready_4_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 4,
      stalledWarpCount: 4,
      meanProgress: 980.641,
      variance: 0.00512695,
      stddev: 0.0716027,
      coefficientOfVariation: 0.000749785,
      minProgress: 979,
      maxProgress: 988,
    },
    {
      scenarioId: 4,
      scenarioName: "4_ready_4_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 4,
      stalledWarpCount: 4,
      meanProgress: 81.2188,
      variance: 0.346191,
      stddev: 0.58838,
      coefficientOfVariation: 0.0220305,
      minProgress: 50,
      maxProgress: 82,
    },
    {
      scenarioId: 5,
      scenarioName: "3_ready_5_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 3,
      stalledWarpCount: 5,
      meanProgress: 980.958,
      variance: 0.00542535,
      stddev: 0.073657,
      coefficientOfVariation: 0.000375128,
      minProgress: 980,
      maxProgress: 982,
    },
    {
      scenarioId: 5,
      scenarioName: "3_ready_5_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 3,
      stalledWarpCount: 5,
      meanProgress: 79.8438,
      variance: 0.417969,
      stddev: 0.646505,
      coefficientOfVariation: 0.0178884,
      minProgress: 49,
      maxProgress: 81,
    },
    {
      scenarioId: 6,
      scenarioName: "2_ready_6_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 2,
      stalledWarpCount: 6,
      meanProgress: 981.188,
      variance: 0.000976562,
      stddev: 0.03125,
      coefficientOfVariation: 0.000395689,
      minProgress: 981,
      maxProgress: 982,
    },
    {
      scenarioId: 6,
      scenarioName: "2_ready_6_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 2,
      stalledWarpCount: 6,
      meanProgress: 79.6667,
      variance: 0.389865,
      stddev: 0.624392,
      coefficientOfVariation: 0.0134619,
      minProgress: 49,
      maxProgress: 80,
    },
    {
      scenarioId: 7,
      scenarioName: "1_ready_7_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      readyWarpCount: 1,
      stalledWarpCount: 7,
      meanProgress: 981.438,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.000505461,
      minProgress: 981,
      maxProgress: 982,
    },
    {
      scenarioId: 7,
      scenarioName: "1_ready_7_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 1,
      stalledWarpCount: 7,
      meanProgress: 78.7812,
      variance: 0.287109,
      stddev: 0.535826,
      coefficientOfVariation: 0.0106432,
      minProgress: 48,
      maxProgress: 79,
    },
    {
      scenarioId: 8,
      scenarioName: "0_ready_8_stalled",
      roleId: 1,
      roleName: "dependent_global_stalled",
      readyWarpCount: 0,
      stalledWarpCount: 8,
      meanProgress: 77.4297,
      variance: 0.201599,
      stddev: 0.448998,
      coefficientOfVariation: 0.0671055,
      minProgress: 47,
      maxProgress: 79,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 0,
      role: "8_ready_0_stalled",
      progress: 989.32,
      lastClock: null,
      sink: null,
      signature:
        "모든 warp가 ready light_alu일 때의 baseline progress signature",
    },
    {
      block: 0,
      warpId: 7,
      role: "7_ready_1_stalled_global",
      progress: 124.156,
      lastClock: null,
      sink: null,
      signature:
        "ready warp가 충분할 때 단일 global-stalled warp가 보인 상대적으로 높은 global progress regime",
    },
    {
      block: 0,
      warpId: 6,
      role: "6_ready_2_stalled_global",
      progress: 126.312,
      lastClock: null,
      sink: null,
      signature:
        "2 stalled까지 유지되는 높은 global progress regime",
    },
    {
      block: 0,
      warpId: 5,
      role: "5_ready_3_stalled_global",
      progress: 83.24,
      lastClock: null,
      sink: null,
      signature:
        "3 stalled부터 낮은 global progress plateau로 전환된 signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "4_ready_4_stalled_global",
      progress: 81.219,
      lastClock: null,
      sink: null,
      signature:
        "balanced ready/stalled 조건에서 유지되는 낮은 global progress regime",
    },
    {
      block: 0,
      warpId: 0,
      role: "1_ready_7_stalled_ready",
      progress: 981.438,
      lastClock: null,
      sink: null,
      signature:
        "ready warp가 1개만 남아도 light_alu progress가 유지되는 signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "0_ready_8_stalled_global",
      progress: 77.43,
      lastClock: null,
      sink: null,
      signature:
        "모든 warp가 dependent global load에 묶인 낮은 progress regime",
    },
  ],

  ordering: [
    "8_ready_0_stalled",
    "7_ready_1_stalled_global",
    "6_ready_2_stalled_global",
    "5_ready_3_stalled_global",
    "4_ready_4_stalled_global",
    "3_ready_5_stalled_global",
    "2_ready_6_stalled_global",
    "1_ready_7_stalled_global",
    "0_ready_8_stalled_global",
  ],

  ratios: {
    readyBaselineVsOneReady: 1.01,
    globalTwoStalledVsThreeStalled: 1.52,
    globalOneStalledVsAllStalled: 1.6,
    readyBaselineVsAllStalledGlobal: 12.78,
  },

  warpScenarioStatsHighlights: [
    {
      scenarioId: 1,
      scenarioName: "7_ready_1_stalled",
      warpId: 7,
      roleName: "dependent_global_stalled",
      meanProgress: 124.156,
      coefficientOfVariation: 0.113015,
      minProgress: 55,
      maxProgress: 135,
    },
    {
      scenarioId: 2,
      scenarioName: "6_ready_2_stalled",
      warpId: 6,
      roleName: "dependent_global_stalled",
      meanProgress: 124.469,
      coefficientOfVariation: 0.115713,
      minProgress: 56,
      maxProgress: 131,
    },
    {
      scenarioId: 3,
      scenarioName: "5_ready_3_stalled",
      warpId: 5,
      roleName: "dependent_global_stalled",
      meanProgress: 82.0625,
      coefficientOfVariation: 0.0924507,
      minProgress: 51,
      maxProgress: 85,
    },
    {
      scenarioId: 8,
      scenarioName: "0_ready_8_stalled",
      warpId: 0,
      roleName: "dependent_global_stalled",
      meanProgress: 76.4062,
      coefficientOfVariation: 0.0895388,
      minProgress: 47,
      maxProgress: 79,
    },
  ],

  interpretation: [
    "ready light_alu warp는 stalled dependent_global warp가 증가해도 대부분의 조건에서 약 980~989 수준의 progress를 유지했습니다.",
    "dependent_global_stalled progress는 1~2 stalled 조건에서는 약 124~126 수준을 유지했습니다.",
    "3 stalled 조건부터 global progress가 약 83 수준으로 떨어지며 낮은 plateau로 전환되었습니다.",
    "4~8 stalled 조건에서는 global progress가 약 77~81 수준에 머물렀습니다.",
    "따라서 latency hiding은 단순히 warp 수가 많을수록 좋아지는 현상이 아니라, ready warp와 stalled warp의 비율에 따라 다른 execution regime을 형성합니다.",
    "codegen 관점에서는 memory-heavy kernel이 latency hiding을 유지하려면 active warp 수뿐 아니라 실제 ready instruction stream을 공급할 수 있어야 합니다.",
  ],

  caveats: [
    "synthetic dependent global memory chain 기반 실험입니다.",
    "단일 block, 8 warps/block, 고정 launch shape 조건입니다.",
    "일부 scenario에서 초기 run 또는 특정 run의 낮은 progress가 CV를 키웠습니다.",
    "CV를 stalled warp 수의 단조 증가 지표로 해석하면 안 됩니다.",
    "mean progress regime과 raw run pattern을 함께 봐야 합니다.",
    "warm/cold cache 또는 TLB state, run ordering 효과는 다음 warmup stability probe에서 분리해야 합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "memory_latency_bound_kernel / mixed_compute_memory_kernel / global_load_chain / occupancy_sensitive_kernel",

    affectedDecision:
      "warps_per_block / occupancy_tradeoff / ILP_generation / load_compute_interleaving / fusion_depth_limit",

    costSignal:
      "ready light_alu warp는 stalled global warp가 증가해도 약 980~989 수준의 progress를 유지했습니다. 반면 dependent_global_stalled progress는 1~2 stalled 조건의 약 124~126 regime에서 3 stalled 이상부터 약 78~83 regime으로 전환되었습니다. 즉 memory latency cost는 global load 자체보다 ready work supply와 stalled/ready ratio에 의해 관찰 형태가 달라집니다.",

    ruleCandidate:
      "memory-heavy kernel variant는 active warp 수뿐 아니라 실제 ready work supply를 보존하도록 생성합니다. deep fusion이나 register pressure 증가로 occupancy와 ready warp supply가 줄어드는 경우 latency hiding penalty를 부여합니다. load 직후 dependency chain으로 막히는 구조는 multiple elements per thread, independent instruction interleaving, load/compute scheduling으로 완화합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium-high",
    },

    reminder:
      "latency hiding은 공짜가 아닙니다. memory-heavy kernel에서 register pressure가 occupancy를 낮추거나 모든 warp가 memory dependency에 묶이면 global latency가 progress 하락으로 직접 드러납니다.",
  },

  costModelRole: {
    role: "latency_hiding_regime_detection",

    description:
      "이 probe는 ready/stalled warp ratio를 직접 바꿔 global memory latency가 어떤 progress regime을 만드는지 확인합니다. cost model에는 memory op count뿐 아니라 ready warp supply, stalled warp ratio, occupancy/ILP에 따른 latency hiding capacity가 포함되어야 함을 보여줍니다.",

    usedBy: [
      "latency_hiding_warmup_stability_probe",
      "ready_warp_supply_probe",
      "shared_memory_ready_interference_probe",
      "elementwise_fusion_depth_probe",
    ],
  },

  measurementReliability: {
    status: "latency_hiding_observed",

    issue:
      "일부 scenario에서 초기 run 또는 특정 run의 낮은 global progress가 CV를 크게 만들었습니다. 따라서 aggregate CV만 보고 단조적인 latency hiding 저하로 해석하면 안 됩니다.",

    impact:
      "mean progress 기준으로는 1~2 stalled와 3+ stalled 사이의 regime 전환이 뚜렷합니다. 다만 cold/warm memory state나 run ordering 효과를 분리해야 global variability의 원인을 더 명확히 설명할 수 있습니다.",

    mitigation:
      "후속 warmup stability probe에서 pre-touch, warmup run, run ordering, cache/TLB state를 분리해 초기 low-progress event가 steady-state인지 transient인지 확인합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "memory latency hiding은 active warp 수가 아니라 ready work supply에 의해 결정됩니다.",
      "register pressure가 occupancy를 줄이면 memory latency가 드러날 수 있습니다.",
      "모든 warp가 dependent global load에 묶이는 구조는 latency hiding 실패 위험이 큽니다.",
      "memory-heavy kernel은 load/compute interleaving 또는 per-thread ILP로 ready work를 만들어야 합니다.",
      "CV는 raw run pattern과 함께 봐야 하며, 초기 transient를 steady-state cost로 오해하면 안 됩니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 ready/stalled ratio가 global memory progress regime을 바꾼다는 점을 보여줍니다. 다음 warmup stability probe에서는 초기 low-progress event와 cache/TLB warm state를 분리하고, ready warp supply probe에서는 ready work의 종류와 품질이 latency hiding에 어떤 영향을 주는지 확인합니다.",
    examples: [
      "latency_hiding_warmup_stability_probe에서는 pre-touch와 warmup 조건으로 초기 global variability를 분리합니다.",
      "ready_warp_supply_probe에서는 ready warp 수뿐 아니라 ready work의 instruction structure가 latency hiding에 미치는 영향을 확인합니다.",
      "shared_memory_ready_interference_probe에서는 ready source가 shared memory dependent chain일 때 global-stalled progress가 어떻게 바뀌는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Latency Hiding Warmup Stability Probe",
    desc:
      "초기 run과 특정 run에서 global progress 변동이 관찰되었으므로, 다음 단계에서는 warm/cold memory state와 run ordering 효과를 분리합니다.",
    configText:
      "compare no_warmup vs warmup\ncompare pre_touch vs no_pre_touch\ntrack early-run global progress drop",
    metrics: [
      "early run global progress",
      "steady-state global progress",
      "CV before/after warmup",
      "pre-touch 여부에 따른 low-progress event 감소",
    ],
  },

  previousObservationId: "global_memory_contention_amplification_probe",
  nextObservationId: "latency_hiding_warmup_stability_probe",
};