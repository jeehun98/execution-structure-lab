export const sharedMemoryReadyInterferenceProbeObservation = {
  id: "shared_memory_ready_interference_probe",
  groupLabel: "Warp Scheduling",
  type: "Shared Memory Interference",
  label: "Shared memory ready interference",
  title: "shared memory ready source가 global stalled signature에 미치는 영향",

  summary:
    "Ready Warp Supply Probe에서 shared_load_ready 조건만 dependent_global_stalled의 variability를 크게 증가시킨 이후, shared memory ready source를 no-conflict, bank-conflict, dependent-chain 조건으로 분해해 어떤 shared memory access pattern이 global stalled warp의 progress signature를 흔드는지 확인한 probe입니다.",

  keyFindings: [
    {
      label: "No Conflict",
      value: "487.258 / 73.727",
      desc: "ready progress / global stalled progress",
    },
    {
      label: "Bank Conflict",
      value: "348.141 / 70.094",
      desc: "ready-side와 global mean은 낮아지지만 큰 transient는 없음",
    },
    {
      label: "Dep Chain",
      value: "264.086 / 72.008",
      desc: "global stalled CV 0.0667",
    },
    {
      label: "Low Transient",
      value: "45~46",
      desc: "shared dependent-chain 조건 run 4에서 발생",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 shared memory ready source를 no-conflict, bank-conflict, dependent-chain으로 나누어, 어떤 shared-memory access pattern이 dependent_global_stalled warp의 progress variability를 키우는지 확인합니다. 목적은 shared memory가 빠른지 느린지의 절대 비교가 아니라, shared ready source의 내부 dependency structure가 global stalled signature를 어떻게 변형하는지 보는 것입니다.",
    question:
      "shared memory ready source 중 어떤 access pattern이 global-stalled variability를 증가시키는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Shared no-conflict",
        text:
          "shared memory 접근이 있어도 bank conflict와 dependency chain이 강하지 않으면 ready-side progress는 비교적 높고 global-stalled progress도 안정적으로 유지될 수 있습니다.",
      },
      {
        label: "Shared bank conflict",
        text:
          "bank conflict는 shared ready source의 progress를 낮추지만, 이번 결과에서는 global stalled variability를 크게 키우는 주요 원인으로 보이지 않았습니다.",
      },
      {
        label: "Shared dependent chain",
        text:
          "shared memory access가 dependent chain으로 구성되면 ready source 자체의 progress가 낮아지고, global-stalled warp와 특정 composition으로 공존할 때 transient variability가 커질 수 있습니다.",
      },
      {
        label: "Composition-level transient",
        text:
          "특정 ready source가 단독으로 느리다는 사실보다, 그 ready source가 global-stalled workload와 어떤 비율로 섞이는지가 low-progress transient를 만들 수 있습니다.",
      },
    ],
  },

  notTryingToProve: [
    "shared memory bank conflict의 절대 latency",
    "GPU scheduler의 내부 issue policy",
    "shared memory가 항상 global-stalled variability를 키운다는 주장",
    "bank conflict가 항상 가장 큰 병목이라는 주장",
    "progress ratio가 실제 throughput ratio 또는 latency ratio와 동일하다는 주장",
  ],

  config: {
    numRunsPerCondition: 32,
    numConditions: 6,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    globalBufferSize: 1_048_576,
    readyWarpCount: 4,
    stalledWarpCount: 4,
    preMeasurementGlobalWarmup: 1,
  },

  roleMap: {
    0: "light_alu_ready",
    1: "shared_no_conflict_ready",
    2: "shared_bank_conflict_ready",
    3: "shared_dependent_chain_ready",
    4: "dependent_global_stalled",
  },

  conditionMap: {
    0: "light_ready_vs_global_stalled",
    1: "shared_no_conflict_ready_vs_global_stalled",
    2: "shared_bank_conflict_ready_vs_global_stalled",
    3: "shared_dependent_chain_ready_vs_global_stalled",
    4: "mixed_shared_ready_vs_global_stalled",
    5: "all_shared_dependent_chain",
  },

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "light_ready_vs_global_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 546.688,
      variance: 0.00146484,
      stddev: 0.0382733,
      coefficientOfVariation: 0.000903262,
      minProgress: 546,
      maxProgress: 548,
    },
    {
      conditionId: 0,
      conditionName: "light_ready_vs_global_stalled",
      roleId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 73.9766,
      variance: 0.000671387,
      stddev: 0.0259111,
      coefficientOfVariation: 0.00140653,
      minProgress: 73,
      maxProgress: 74,
    },
    {
      conditionId: 1,
      conditionName: "shared_no_conflict_ready_vs_global_stalled",
      roleId: 1,
      roleName: "shared_no_conflict_ready",
      meanProgress: 487.258,
      variance: 0.00360107,
      stddev: 0.060009,
      coefficientOfVariation: 0.000886729,
      minProgress: 487,
      maxProgress: 488,
    },
    {
      conditionId: 1,
      conditionName: "shared_no_conflict_ready_vs_global_stalled",
      roleId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 73.7266,
      variance: 0.0280151,
      stddev: 0.167377,
      coefficientOfVariation: 0.00556198,
      minProgress: 73,
      maxProgress: 74,
    },
    {
      conditionId: 2,
      conditionName: "shared_bank_conflict_ready_vs_global_stalled",
      roleId: 2,
      roleName: "shared_bank_conflict_ready",
      meanProgress: 348.141,
      variance: 0.0305176,
      stddev: 0.174693,
      coefficientOfVariation: 0.00109152,
      minProgress: 347,
      maxProgress: 349,
    },
    {
      conditionId: 2,
      conditionName: "shared_bank_conflict_ready_vs_global_stalled",
      roleId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 70.0938,
      variance: 0.00146484,
      stddev: 0.0382733,
      coefficientOfVariation: 0.00406095,
      minProgress: 70,
      maxProgress: 71,
    },
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      roleId: 3,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 264.086,
      variance: 0.00115967,
      stddev: 0.0340539,
      coefficientOfVariation: 0.00115328,
      minProgress: 263,
      maxProgress: 265,
    },
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      roleId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 72.0078,
      variance: 0.00115967,
      stddev: 0.0340539,
      coefficientOfVariation: 0.0666912,
      minProgress: 45,
      maxProgress: 73,
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      roleId: 1,
      roleName: "shared_no_conflict_ready",
      meanProgress: 486.703,
      variance: 0.00610352,
      stddev: 0.078125,
      coefficientOfVariation: 0.000922054,
      minProgress: 486,
      maxProgress: 487,
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      roleId: 2,
      roleName: "shared_bank_conflict_ready",
      meanProgress: 348.094,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.000837362,
      minProgress: 348,
      maxProgress: 349,
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      roleId: 3,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 264.031,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.000658985,
      minProgress: 264,
      maxProgress: 265,
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      roleId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 72.9844,
      variance: 0.000244141,
      stddev: 0.015625,
      coefficientOfVariation: 0.00119224,
      minProgress: 72,
      maxProgress: 73,
    },
    {
      conditionId: 5,
      conditionName: "all_shared_dependent_chain",
      roleId: 3,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 263.16,
      variance: 0.0106049,
      stddev: 0.10298,
      coefficientOfVariation: 0.0023416,
      minProgress: 262,
      maxProgress: 265,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 0,
      role: "light_alu_ready",
      progress: 546.688,
      lastClock: null,
      sink: null,
      signature:
        "비교 기준이 되는 light_alu_ready source. global stalled progress를 안정적으로 유지",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_light_ready",
      progress: 73.977,
      lastClock: null,
      sink: null,
      signature:
        "light ready와 공존할 때 안정적인 dependent_global_stalled signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "shared_no_conflict_ready",
      progress: 487.258,
      lastClock: null,
      sink: null,
      signature:
        "no-conflict shared access ready source. shared memory access가 있어도 global stalled variability를 크게 키우지 않음",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_shared_no_conflict",
      progress: 73.727,
      lastClock: null,
      sink: null,
      signature:
        "shared no-conflict ready와 공존할 때 비교적 안정적인 global stalled signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "shared_bank_conflict_ready",
      progress: 348.141,
      lastClock: null,
      sink: null,
      signature:
        "bank conflict로 ready-side progress가 낮아진 shared memory source",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_shared_bank_conflict",
      progress: 70.094,
      lastClock: null,
      sink: null,
      signature:
        "shared bank conflict ready와 공존할 때 global mean은 낮아졌지만 큰 transient는 보이지 않음",
    },
    {
      block: 0,
      warpId: 0,
      role: "shared_dependent_chain_ready",
      progress: 264.086,
      lastClock: null,
      sink: null,
      signature:
        "shared dependent-chain ready source. ready-side progress가 가장 낮음",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_shared_dependent_chain",
      progress: 72.008,
      lastClock: null,
      sink: null,
      signature:
        "shared dependent-chain ready 4개와 공존할 때 low-progress transient로 variability가 증가한 global stalled signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "mixed_shared_ready_global_stalled",
      progress: 72.984,
      lastClock: null,
      sink: null,
      signature:
        "shared ready source가 섞인 조건에서는 global stalled variability가 안정화된 signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "all_shared_dependent_chain",
      progress: 263.16,
      lastClock: null,
      sink: null,
      signature:
        "global stalled warp 없이 all shared dependent-chain만 수행한 조건. workload 자체는 비교적 안정적",
    },
  ],

  ordering: [
    "light_alu_ready",
    "shared_no_conflict_ready",
    "shared_bank_conflict_ready",
    "shared_dependent_chain_ready",
    "dependent_global_stalled",
  ],

  ratios: {
    noConflictVsBankConflict: 1.4,
    noConflictVsDependentChain: 1.84,
    bankConflictVsDependentChain: 1.32,
    lightReadyVsNoConflict: 1.12,
    dependentChainGlobalMinDrop: 1.6,
  },

  warpConditionStatsHighlights: [
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 72.0625,
      coefficientOfVariation: 0.0653592,
      minProgress: 46,
      maxProgress: 73,
    },
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      warpId: 6,
      roleName: "dependent_global_stalled",
      meanProgress: 72,
      coefficientOfVariation: 0.0680414,
      minProgress: 45,
      maxProgress: 73,
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 73,
      coefficientOfVariation: 0,
      minProgress: 73,
      maxProgress: 73,
    },
    {
      conditionId: 5,
      conditionName: "all_shared_dependent_chain",
      warpId: 0,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 263.281,
      coefficientOfVariation: 0.002554,
      minProgress: 262,
      maxProgress: 265,
    },
  ],

  rawRunHighlights: [
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      runId: 4,
      warpProgress: [264, 264, 264, 264, 46, 46, 45, 45],
      note:
        "shared dependent-chain ready 4개와 global stalled 4개가 공존할 때 발생한 low-progress transient",
    },
    {
      conditionId: 3,
      conditionName: "shared_dependent_chain_ready_vs_global_stalled",
      runId: 5,
      warpProgress: [264, 264, 264, 264, 70, 69, 69, 70],
      note:
        "low transient 이후 global stalled progress가 회복되는 중간 run",
    },
    {
      conditionId: 4,
      conditionName: "mixed_shared_ready_vs_global_stalled",
      runId: 0,
      warpProgress: [487, 348, 264, 487, 73, 73, 73, 73],
      note:
        "shared ready source가 섞이면 role별 ready signature와 global stalled signature가 안정적으로 유지됨",
    },
    {
      conditionId: 5,
      conditionName: "all_shared_dependent_chain",
      runId: 16,
      warpProgress: [262, 262, 262, 262, 262, 262, 262, 262],
      note:
        "shared dependent-chain workload 자체는 global stalled role 없이 비교적 안정적으로 반복됨",
    },
  ],

  interpretation: [
    "shared memory ready source의 내부 access pattern은 ready-side progress signature를 크게 바꿨습니다.",
    "shared no-conflict ready는 약 487 progress, shared bank-conflict ready는 약 348 progress, shared dependent-chain ready는 약 264 progress를 보였습니다.",
    "shared no-conflict ready와 shared bank-conflict ready 조건에서는 dependent_global_stalled progress가 비교적 안정적으로 유지되었습니다.",
    "shared bank-conflict는 ready-side progress와 global mean을 낮추지만, 큰 low-progress transient를 만들지는 않았습니다.",
    "shared dependent-chain ready 4개와 dependent_global_stalled 4개가 공존하는 조건에서만 global stalled warp가 45~46까지 떨어지는 transient가 발생했습니다.",
    "mixed shared ready 조건에서는 no-conflict, bank-conflict, dependent-chain source가 섞였지만 global stalled progress가 안정화되었습니다.",
    "따라서 문제는 shared memory access 자체나 단순 bank conflict가 아니라, shared dependent-chain ready source와 global stalled role의 특정 composition으로 보는 것이 적절합니다.",
  ],

  caveats: [
    "condition 3의 낮은 global progress는 지속적인 steady-state 저하가 아니라 특정 run에서 발생한 low-progress transient의 영향입니다.",
    "bank conflict 패턴은 GPU architecture의 shared memory bank mapping과 access granularity에 영향을 받습니다.",
    "결과를 절대적인 shared memory 성능 수치로 해석하면 안 됩니다.",
    "single block, fixed launch shape, synthetic workload 조건의 관찰입니다.",
    "shared dependent-chain ready warp 수의 임계점은 아직 분리되지 않았습니다.",
  ],

  codegenImpact: {
    targetPattern:
      "shared_memory_tiled_kernel / mixed_compute_memory_kernel / memory_latency_bound_kernel / shared_dependent_chain_kernel",

    affectedDecision:
      "shared_memory_usage / shared_layout_selection / dependency_scheduling / warp_role_composition / tail_risk_validation",

    costSignal:
      "shared no-conflict ready와 shared bank-conflict ready 조건에서는 dependent_global_stalled progress가 비교적 안정적이었습니다. 반면 shared dependent-chain ready 4개와 dependent_global_stalled 4개가 공존하는 조건에서 global stalled warp가 특정 run에 45~46까지 떨어지는 low-progress transient를 보였습니다. 따라서 shared memory ready source의 비용은 bank conflict만으로 설명되지 않고, dependency chain과 global-stalled composition에 의해 tail risk가 생길 수 있습니다.",

    ruleCandidate:
      "shared memory를 사용하는 kernel variant를 생성할 때 reuse 이득만 보지 않고, shared access의 dependency chain, bank conflict, synchronization, mixed-role composition risk를 함께 평가합니다. shared dependent-chain ready source가 global memory stalled role과 공존하는 variant는 mean progress뿐 아니라 CV, min/max, raw-run tail event를 검증한 뒤 선택합니다. 단순 shared no-conflict나 bank-conflict보다 shared dependent-chain composition에 더 강한 validation penalty를 둡니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "shared memory는 자동으로 안전한 latency-hiding source가 아닙니다. bank conflict보다 shared dependency chain과 global-stalled workload의 composition이 더 큰 transient risk를 만들 수 있습니다.",
  },

  costModelRole: {
    role: "shared_ready_interference_analysis",

    description:
      "이 probe는 ready source quality 분석 중 shared memory 계열을 세분화합니다. 결과적으로 cost model에는 shared memory 사용 여부뿐 아니라 no-conflict, bank-conflict, dependent-chain, 그리고 global-stalled role과의 composition tail risk가 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "composition_transient_probe",
      "shared_memory_bank_conflict_probe",
      "shared_memory_layout_rule",
      "elementwise_fusion_depth_probe",
    ],
  },

  measurementReliability: {
    status: "shared_interference_observed",

    issue:
      "shared dependent-chain 조건의 global progress 저하는 전체 steady-state 하락이 아니라 특정 raw run의 low-progress transient로 관찰되었습니다. 따라서 평균 progress만으로 해석하면 원인을 과장할 수 있습니다.",

    impact:
      "shared memory access 자체나 bank conflict 자체보다 shared dependent-chain ready source와 global stalled workload의 특정 composition이 transient를 만들 가능성이 높다는 방향을 제공합니다.",

    mitigation:
      "후속 composition_transient_probe에서 shared dependent-chain ready warp 수를 0~4개로 바꾸고, low-progress run의 발생 빈도와 threshold를 별도로 추적합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "shared memory 사용 여부를 reuse만으로 결정하지 않습니다.",
      "bank conflict만 보지 말고 shared dependency chain을 별도 cost signal로 봅니다.",
      "shared dependent-chain ready source는 global-stalled role과 함께 있을 때 tail risk를 만들 수 있습니다.",
      "mean progress만 보지 말고 CV, min/max, raw run low-progress event를 함께 봅니다.",
      "shared memory ready source가 섞인 mixed condition에서는 transient가 완화될 수 있으므로 composition 비율을 분리해야 합니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 shared memory ready source 중 shared dependent-chain composition에서 global stalled transient가 발생한다는 점을 보여줍니다. 다음 composition transient probe에서는 shared dependent-chain ready warp 수를 바꿔 transient가 특정 비율에서 발생하는지 확인합니다.",
    examples: [
      "composition_transient_probe에서는 shared dependent-chain ready warp 수를 0~4개로 바꿉니다.",
      "shared_memory_bank_conflict_probe에서는 shared access stride와 bank mapping을 별도로 분리합니다.",
      "shared_memory_layout_rule에서는 padding/layout 변경이 ready-side progress와 global stalled variability를 어떻게 바꾸는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Composition Transient Probe",
    desc:
      "shared dependent-chain ready 4개와 global stalled 4개가 공존할 때 low-progress transient가 나타났으므로, 다음 단계에서는 shared dependent-chain ready warp 수를 변화시켜 transient 발생 조건을 좁힙니다.",
    configText:
      "shared_dependent_chain_ready_count = 0..4\nglobal_stalled_count = 4\ntrack low-progress transient frequency",
    metrics: [
      "global stalled mean progress",
      "global stalled CV",
      "low-progress transient count",
      "min progress",
      "shared dependent-chain ready count별 threshold",
    ],
  },

  previousObservationId: "ready_warp_supply_probe",
  nextObservationId: "composition_transient_probe",
};