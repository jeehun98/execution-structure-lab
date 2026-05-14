export const schedulerPhaseProbeObservation = {
  id: "scheduler_phase_probe",
  groupLabel: "Warp Scheduling",
  type: "Scheduler/Grid Phase Analysis",
  label: "Scheduler phase probe",
  title: "composition transient의 scheduler/grid phase localization 분석",

  summary:
    "Composition Phase Repeatability Probe에서 3 shared-chain + 1 light + 4 global 조건의 low-progress transient가 희박하게 반복됨을 확인한 이후, block 수, dummy kernel 삽입, cycle budget을 바꿔 transient event가 특정 block, launch phase, grid-level execution phase, 관측 window에 어떻게 민감하게 반응하는지 확인한 probe입니다.",

  keyFindings: [
    {
      label: "Single Block",
      value: "min 46 / rate 0.0039",
      desc: "blocks=1, 100k, no dummy 기준선",
    },
    {
      label: "Multi Block",
      value: "blocks=8 rate 0.00885",
      desc: "blocks=8에서 event rate와 severity 증가",
    },
    {
      label: "Co-occurrence",
      value: "multi-block same-run",
      desc: "여러 block이 같은 run에서 동시에 low-progress 상태 진입",
    },
    {
      label: "Dummy Perturbation",
      value: "min 34~35",
      desc: "dummy kernel 삽입 후 transient 제거가 아니라 phase/severity 변화",
    },
    {
      label: "Window Issue",
      value: "50k/200k invalid threshold",
      desc: "fixed threshold 60으로 cycle budget 간 직접 비교 불가",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 3 shared-chain + 1 light + 4 global composition에서 발생한 rare low-progress transient가 단일 block 내부 artifact인지, block 수와 launch phase에 따라 증폭되거나 이동하는 grid-level event signature인지 확인합니다. 이를 위해 active block 수, dummy kernel 삽입 여부, cycle budget을 바꿔 transient_count, transient_rate, min progress, multi-block co-occurrence를 추적합니다.",
    question:
      "composition transient는 block-local 현상인가, 아니면 grid size와 launch phase perturbation에 민감한 rare event signature인가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Grid-level exposure",
        text:
          "active block 수가 늘면 관측되는 block-local samples가 늘어납니다. 단순 total event 증가는 exposure 증가일 수 있지만, event rate와 severity까지 증가하면 grid-level phase sensitivity를 의심할 수 있습니다.",
      },
      {
        label: "Multi-block co-occurrence",
        text:
          "여러 block이 같은 batch/run에서 동시에 low-progress 상태에 들어가면 단일 block 내부 noise보다는 launch/run phase와 결합된 event signature일 가능성이 커집니다.",
      },
      {
        label: "Dummy kernel perturbation",
        text:
          "측정 kernel 앞에 dummy kernel을 삽입하면 cache, scheduler, launch queue, phase alignment가 바뀔 수 있습니다. transient가 제거되지 않고 위치나 강도가 바뀐다면 launch context sensitivity로 해석할 수 있습니다.",
      },
      {
        label: "Observation window normalization",
        text:
          "cycle budget이 달라지면 progress 절대값도 달라집니다. fixed threshold를 그대로 쓰면 50k에서는 모든 sample이 transient로 잡히고, 200k에서는 transient가 가려질 수 있습니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler 내부 phase를 직접 증명했다는 주장",
    "block_id가 SM id와 같다는 주장",
    "block 수 증가에 따라 transient rate가 선형 증가한다는 주장",
    "dummy kernel이 항상 transient를 증가시킨다는 일반 법칙",
    "cycle budget 50k/200k 결과를 fixed threshold 60으로 직접 비교할 수 있다는 주장",
  ],

  config: {
    numBatches: 8,
    runsPerBatch: 64,
    numConditions: 8,
    warmupRuns: 4,
    maxBlocks: 8,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    baseCycleBudget: 100_000,
    globalBufferSize: 1_048_576,
    readyWarpCount: 4,
    stalledWarpCount: 4,
    lightWarpId: 2,
    transientThreshold: 60,
  },

  roleMap: {
    0: "light_alu_ready",
    1: "shared_dependent_chain_ready",
    2: "dependent_global_stalled",
  },

  conditionMap: {
    0: "blocks1_cycle100k_no_dummy",
    1: "blocks2_cycle100k_no_dummy",
    2: "blocks4_cycle100k_no_dummy",
    3: "blocks8_cycle100k_no_dummy",
    4: "blocks1_cycle100k_dummy_before",
    5: "blocks4_cycle100k_dummy_before",
    6: "blocks1_cycle50k_no_dummy",
    7: "blocks1_cycle200k_no_dummy",
  },

  conditionParameters: [
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      activeBlocks: 1,
      cycleBudget: 100_000,
      dummyBefore: false,
    },
    {
      conditionId: 1,
      conditionName: "blocks2_cycle100k_no_dummy",
      activeBlocks: 2,
      cycleBudget: 100_000,
      dummyBefore: false,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      activeBlocks: 4,
      cycleBudget: 100_000,
      dummyBefore: false,
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      activeBlocks: 8,
      cycleBudget: 100_000,
      dummyBefore: false,
    },
    {
      conditionId: 4,
      conditionName: "blocks1_cycle100k_dummy_before",
      activeBlocks: 1,
      cycleBudget: 100_000,
      dummyBefore: true,
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      activeBlocks: 4,
      cycleBudget: 100_000,
      dummyBefore: true,
    },
    {
      conditionId: 6,
      conditionName: "blocks1_cycle50k_no_dummy",
      activeBlocks: 1,
      cycleBudget: 50_000,
      dummyBefore: false,
    },
    {
      conditionId: 7,
      conditionName: "blocks1_cycle200k_no_dummy",
      activeBlocks: 1,
      cycleBudget: 200_000,
      dummyBefore: false,
    },
  ],

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 549.074,
      coefficientOfVariation: 0.000608632,
      minProgress: 547,
      maxProgress: 550,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 297.232,
      coefficientOfVariation: 0.00142544,
      minProgress: 297,
      maxProgress: 299,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 75.7998,
      coefficientOfVariation: 0.026226,
      minProgress: 46,
      maxProgress: 76,
      transientCount: 8,
      transientRate: 0.00390625,
    },
    {
      conditionId: 1,
      conditionName: "blocks2_cycle100k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 77.1433,
      coefficientOfVariation: 0.0302366,
      minProgress: 45,
      maxProgress: 79,
      transientCount: 20,
      transientRate: 0.00488281,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 77.2932,
      coefficientOfVariation: 0.0306174,
      minProgress: 45,
      maxProgress: 79,
      transientCount: 40,
      transientRate: 0.00488281,
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 77.1006,
      coefficientOfVariation: 0.0454651,
      minProgress: 34,
      maxProgress: 82,
      transientCount: 145,
      transientRate: 0.0088501,
    },
    {
      conditionId: 4,
      conditionName: "blocks1_cycle100k_dummy_before",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 71.7437,
      coefficientOfVariation: 0.0379207,
      minProgress: 34,
      maxProgress: 73,
      transientCount: 12,
      transientRate: 0.00585938,
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 73.699,
      coefficientOfVariation: 0.0370702,
      minProgress: 35,
      maxProgress: 77,
      transientCount: 48,
      transientRate: 0.00585938,
    },
    {
      conditionId: 6,
      conditionName: "blocks1_cycle50k_no_dummy",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 274.076,
      coefficientOfVariation: 0.00106995,
      minProgress: 273,
      maxProgress: 276,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 6,
      conditionName: "blocks1_cycle50k_no_dummy",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 148.926,
      coefficientOfVariation: 0.00186694,
      minProgress: 148,
      maxProgress: 150,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 6,
      conditionName: "blocks1_cycle50k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 36.1899,
      coefficientOfVariation: 0.0540469,
      minProgress: 17,
      maxProgress: 37,
      transientCount: 2048,
      transientRate: 1,
    },
    {
      conditionId: 7,
      conditionName: "blocks1_cycle200k_no_dummy",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 1099.31,
      coefficientOfVariation: 0.000497662,
      minProgress: 1098,
      maxProgress: 1103,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 7,
      conditionName: "blocks1_cycle200k_no_dummy",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 595.743,
      coefficientOfVariation: 0.000951359,
      minProgress: 595,
      maxProgress: 598,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 7,
      conditionName: "blocks1_cycle200k_no_dummy",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 144.625,
      coefficientOfVariation: 0.0313911,
      minProgress: 85,
      maxProgress: 146,
      transientCount: 0,
      transientRate: 0,
    },
  ],

  blockConditionStatsHighlights: [
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      blockId: 0,
      globalMeanProgress: 75.7998,
      globalMinProgress: 46,
      transientCount: 2,
      transientRate: 0.00390625,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      blockId: 0,
      globalMeanProgress: 75.7896,
      globalMinProgress: 45,
      transientCount: 2,
      transientRate: 0.00390625,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      blockId: 1,
      globalMeanProgress: 78.5918,
      globalMinProgress: 46,
      transientCount: 2,
      transientRate: 0.00390625,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      blockId: 2,
      globalMeanProgress: 78.6509,
      globalMinProgress: 47,
      transientCount: 3,
      transientRate: 0.00585938,
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      blockId: 3,
      globalMeanProgress: 76.1406,
      globalMinProgress: 45,
      transientCount: 3,
      transientRate: 0.00585938,
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      blockId: 0,
      globalMeanProgress: 75.042,
      globalMinProgress: 34,
      transientCount: 4,
      transientRate: 0.0078125,
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      blockId: 7,
      globalMeanProgress: 80.8428,
      globalMinProgress: 35,
      transientCount: 5,
      transientRate: 0.00976562,
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      blockId: 0,
      globalMeanProgress: 71.7915,
      globalMinProgress: 35,
      transientCount: 3,
      transientRate: 0.00585938,
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      blockId: 3,
      globalMeanProgress: 72.8032,
      globalMinProgress: 35,
      transientCount: 3,
      transientRate: 0.00585938,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 4,
      role: "blocks1_cycle100k_no_dummy_global",
      progress: 75.8,
      lastClock: null,
      sink: null,
      signature:
        "single-block 100k 기준선. rare transient는 존재하지만 rate는 약 0.0039 수준",
    },
    {
      block: 0,
      warpId: 4,
      role: "blocks4_cycle100k_no_dummy_global",
      progress: 77.293,
      lastClock: null,
      sink: null,
      signature:
        "blocks=4 조건. 같은 run에서 여러 block이 동시에 low-progress 상태로 들어가는 co-occurrence 관찰",
    },
    {
      block: 0,
      warpId: 4,
      role: "blocks8_cycle100k_no_dummy_global",
      progress: 77.101,
      lastClock: null,
      sink: null,
      signature:
        "blocks=8 조건. rate와 severity가 함께 증가하며 min progress 34 기록",
    },
    {
      block: 0,
      warpId: 4,
      role: "blocks1_cycle100k_dummy_before_global",
      progress: 71.744,
      lastClock: null,
      sink: null,
      signature:
        "dummy kernel 삽입 후 transient가 제거되지 않고 min progress 34까지 하락",
    },
    {
      block: 0,
      warpId: 4,
      role: "blocks1_cycle50k_no_dummy_global",
      progress: 36.19,
      lastClock: null,
      sink: null,
      signature:
        "cycle 50k 조건. fixed threshold 60 때문에 모든 sample이 transient로 분류되어 직접 비교 불가",
    },
    {
      block: 0,
      warpId: 4,
      role: "blocks1_cycle200k_no_dummy_global",
      progress: 144.625,
      lastClock: null,
      sink: null,
      signature:
        "cycle 200k 조건. fixed threshold 60이 너무 낮아 event 검출 기준으로 부적절",
    },
  ],

  multiBlockCoOccurrenceHighlights: [
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      batchId: 1,
      runId: 3,
      affectedBlocks: [0, 1, 2, 3],
      minGlobalProgressByBlock: [45, 47, 47, 45],
      note:
        "blocks=4 조건에서 모든 block이 같은 run에 low-progress 상태로 진입",
    },
    {
      conditionId: 2,
      conditionName: "blocks4_cycle100k_no_dummy",
      batchId: 4,
      runId: 22,
      affectedBlocks: [0, 1, 2, 3],
      minGlobalProgressByBlock: [45, 46, 47, 45],
      note:
        "blocks=4 조건의 반복 co-occurrence event",
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      batchId: 0,
      runId: 8,
      affectedBlocks: [0, 1, 2, 3, 4, 5, 6, 7],
      minGlobalProgressByBlock: [45, 46, 46, 45, 45, 46, 46, 47],
      note:
        "blocks=8 조건에서 모든 block이 같은 run에 low-progress 상태로 진입",
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      batchId: 7,
      runId: 18,
      affectedBlocks: [0, 1, 2, 3, 4, 5, 6, 7],
      minGlobalProgressByBlock: [34, 35, 35, 34, 34, 35, 34, 35],
      note:
        "blocks=8 조건에서 가장 강한 grid-level low-progress event",
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      batchId: 2,
      runId: 4,
      affectedBlocks: [0, 1, 2, 3],
      minGlobalProgressByBlock: [35, 35, 36, 35],
      note:
        "dummy kernel 삽입 이후에도 multi-block co-occurrence 유지",
    },
  ],

  rawRunHighlights: [
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      batchId: 3,
      runId: 18,
      blockId: 0,
      minGlobalProgress: 47,
      note:
        "single-block 기준선에서 rare transient 재현",
    },
    {
      conditionId: 0,
      conditionName: "blocks1_cycle100k_no_dummy",
      batchId: 6,
      runId: 30,
      blockId: 0,
      minGlobalProgress: 46,
      note:
        "single-block 기준선의 두 번째 transient event",
    },
    {
      conditionId: 3,
      conditionName: "blocks8_cycle100k_no_dummy",
      batchId: 7,
      runId: 18,
      blockId: "0..7",
      minGlobalProgress: "34~35",
      note:
        "blocks=8 조건에서 모든 block이 강한 low-progress 상태로 들어간 대표 event",
    },
    {
      conditionId: 4,
      conditionName: "blocks1_cycle100k_dummy_before",
      batchId: 2,
      runId: 37,
      blockId: 0,
      minGlobalProgress: 34,
      note:
        "dummy kernel 삽입 후 single-block에서도 강한 transient 발생",
    },
    {
      conditionId: 5,
      conditionName: "blocks4_cycle100k_dummy_before",
      batchId: 2,
      runId: 4,
      blockId: "0..3",
      minGlobalProgress: "35~36",
      note:
        "dummy kernel 삽입 후 blocks=4에서 multi-block co-occurrence 발생",
    },
    {
      conditionId: 6,
      conditionName: "blocks1_cycle50k_no_dummy",
      batchId: 2,
      runId: 31,
      blockId: 0,
      minGlobalProgress: 17,
      note:
        "cycle 50k 조건의 low sample. 단, fixed threshold 문제 때문에 normalized 재검증 필요",
    },
  ],

  ratios: {
    blocks8RateVsBlocks1Rate: 2.2656,
    dummyBlocks1RateVsNoDummyBlocks1Rate: 1.5,
    dummyBlocks4RateVsNoDummyBlocks4Rate: 1.2,
    blocks8MinVsBlocks1Min: 0.739,
    cycle50kMeanVs100kMean: 0.477,
    cycle200kMeanVs100kMean: 1.908,
  },

  interpretation: [
    "composition transient는 single-block 조건에서도 재현되었습니다.",
    "block 수가 증가하면 total transient event가 증가했고, blocks=8에서는 transient rate와 severity도 함께 증가했습니다.",
    "blocks=2와 blocks=4는 rate가 거의 동일하므로 block 수에 선형 비례한다고 해석하면 안 됩니다.",
    "blocks=4와 blocks=8 조건에서 여러 block이 같은 run에 동시에 low-progress 상태로 들어가는 co-occurrence가 관찰되었습니다.",
    "이 co-occurrence는 block-local noise보다 launch/run phase와 결합된 grid-level event signature로 해석하는 것이 자연스럽습니다.",
    "dummy kernel 삽입은 transient를 제거하지 않았고, min progress와 event 위치를 바꿨습니다.",
    "따라서 predecessor kernel 또는 launch context가 rare tail event에 영향을 줄 수 있습니다.",
    "cycle budget 50k와 200k 결과는 fixed threshold 60 때문에 직접 비교하면 안 됩니다.",
    "cycle budget이 달라지는 후속 실험에서는 normalized progress 또는 median-ratio threshold를 사용해야 합니다.",
  ],

  caveats: [
    "block_id는 SM id가 아니므로 block별 transient를 SM-locality로 해석하면 안 됩니다.",
    "scheduler 내부 phase를 직접 측정한 것은 아닙니다.",
    "block 수 증가와 transient rate 사이를 선형 관계로 해석하면 안 됩니다.",
    "dummy kernel 효과는 launch phase perturbation의 신호이지, 모든 dummy/predecessor kernel에 일반화된 법칙은 아닙니다.",
    "cycle 50k와 200k 조건은 fixed threshold 60 때문에 100k 조건과 직접 비교할 수 없습니다.",
    "single block, synthetic workload 기반 실험이므로 실제 AI kernel 적용 전 graph-level 검증이 필요합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "shared_memory_tiled_kernel / mixed_compute_memory_kernel / memory_latency_bound_kernel / graph_level_kernel_sequence / rare_tail_risk_kernel",

    affectedDecision:
      "kernel_variant_validation / grid_size_selection / predecessor_kernel_sensitivity / benchmark_protocol / normalized_window_metric / tail_risk_model",

    costSignal:
      "3 shared-chain + 1 light + 4 global composition의 transient는 block 수와 launch phase 조건에 민감했습니다. blocks=8에서는 transient rate가 약 0.00885로 증가했고 min progress가 34까지 낮아졌습니다. dummy kernel 삽입도 transient를 제거하지 않고 min progress와 event 위치를 바꾸었습니다. 따라서 kernel 내부 warp composition뿐 아니라 grid size, predecessor kernel, launch context, observation window가 tail risk에 영향을 줄 수 있습니다.",

    ruleCandidate:
      "shared-memory mixed-role fused kernel은 단일 block microbenchmark 평균만으로 선택하지 않습니다. block count sweep, predecessor-kernel perturbation, multi-block co-occurrence, min progress, transient rate를 포함한 tail-risk validation을 통과해야 합니다. cycle budget이 다른 probe 결과는 fixed threshold로 비교하지 말고 normalized progress 또는 median-ratio threshold로 재평가합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "kernel variant의 안정성은 내부 warp composition만으로 결정되지 않습니다. grid size, preceding kernel, launch phase, observation window가 rare tail event를 바꿀 수 있습니다.",
  },

  costModelRole: {
    role: "grid_phase_tail_risk_localization",

    description:
      "이 probe는 composition transient가 block-local event인지, grid size와 launch phase에 민감한 event인지 확인합니다. 결과적으로 cost model에는 평균 progress뿐 아니라 blockCountSensitivity, dummyLaunchSensitivity, multiBlockCoOccurrence, minProgress, transientRate, normalizedWindowMetric이 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "normalized_window_probe",
      "transient_event_localization",
      "graph_level_kernel_sequence_model",
      "kernel_variant_tail_risk_model",
    ],
  },

  measurementReliability: {
    status: "grid_phase_sensitivity_observed",

    issue:
      "block 수와 dummy kernel 삽입에 따른 transient 변화는 관찰되었지만, scheduler 내부 phase나 SM locality를 직접 측정한 것은 아닙니다. 또한 cycle budget 조건은 fixed threshold 60 때문에 직접 비교가 불가능합니다.",

    impact:
      "현재 결과는 composition transient가 단순 block-local noise가 아니라 grid size와 launch phase에 민감한 rare event signature일 가능성을 높입니다. 다만 cycle budget 효과는 normalized threshold 기반 후속 실험으로 분리해야 합니다.",

    mitigation:
      "후속 normalized_window_probe에서 progress/cycle_budget, median-ratio threshold, MAD-based threshold를 사용합니다. 이후 transient_event_localization에서 condition order shuffle, dummy kernel 종류, block count sweep, role placement rotation을 더 세분화합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "단일 block 평균 progress만 보고 kernel variant를 선택하지 않습니다.",
      "block count가 증가하면 tail event exposure와 severity가 달라질 수 있습니다.",
      "preceding kernel 또는 dummy launch가 rare transient의 phase를 바꿀 수 있습니다.",
      "여러 block이 같은 run에서 동시에 low-progress 상태로 들어가는지 확인합니다.",
      "cycle budget이 다르면 fixed threshold가 아니라 normalized threshold로 비교합니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 composition transient가 block 수와 launch phase에 민감한 rare event signature임을 보여줍니다. 하지만 cycle budget 변화 조건은 fixed threshold 60 때문에 직접 비교할 수 없으므로, 다음 normalized window probe에서는 progress를 cycle budget 또는 condition median에 대해 정규화해 관측 window 효과를 다시 검증합니다.",
    examples: [
      "normalized_window_probe에서는 50k, 75k, 100k, 150k, 200k cycle budget을 비율 기반 threshold로 비교합니다.",
      "transient_event_localization에서는 dummy kernel 종류와 삽입 위치를 바꿔 launch context sensitivity를 좁힙니다.",
      "graph_level_kernel_sequence_model에서는 predecessor kernel에 따라 variant tail risk가 달라지는지 확인합니다.",
      "kernel_variant_tail_risk_model에서는 mean progress와 min/CV/transient rate를 함께 사용합니다.",
    ],
  },

  nextStep: {
    label: "Normalized Window Probe",
    desc:
      "cycle budget 조건에서 fixed threshold 문제가 드러났으므로, 다음 단계에서는 progress를 cycle budget과 condition median 기준으로 정규화해 관측 window 길이에 따른 transient signature를 다시 검증합니다.",
    configText:
      "cycle_budget = 50k | 75k | 100k | 150k | 200k\nconditions = blocks1_no_dummy | blocks4_no_dummy | blocks8_no_dummy | blocks4_dummy_before\nnormalized_progress = progress / cycle_budget\ntransient if global_progress < condition_median * 0.75",
    metrics: [
      "normalized global progress",
      "condition median global progress",
      "median-ratio min progress",
      "MAD-based transient threshold",
      "normalized transient count",
      "cycle budget별 event rate",
    ],
  },

  previousObservationId: "composition_phase_repeatability_probe",
  nextObservationId: "normalized_window_probe",
};