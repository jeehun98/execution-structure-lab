export const compositionPhaseRepeatabilityProbeObservation = {
  id: "composition_phase_repeatability_probe",
  groupLabel: "Warp Scheduling",
  type: "Phase Repeatability Validation",
  label: "Composition phase repeatability",
  title: "composition transient의 반복성 및 placement sensitivity 검증",

  summary:
    "Composition Transient Probe에서 3 shared-chain + 1 light + 4 global 조건에서 강한 dependent_global_stalled transient가 나타난 이후, 해당 transient가 단발성 artifact인지, prewarm 횟수, light warp placement, seed 방식에 따라 반복되는 composition-sensitive phase event인지 확인한 probe입니다.",

  keyFindings: [
    {
      label: "Baseline",
      value: "min 46 / event 1",
      desc: "fixed light warp3, prewarm1, linear seed",
    },
    {
      label: "Prewarm Sweep",
      value: "0/1/3 all hit",
      desc: "prewarm을 바꿔도 transient 제거 안 됨",
    },
    {
      label: "Placement Sensitivity",
      value: "warp2 min 33",
      desc: "light warp2 placement에서 가장 강한 transient",
    },
    {
      label: "Hashed Seed",
      value: "min 35 / event 2",
      desc: "linear seed artifact가 아님",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 3 shared-chain + 1 light + 4 global composition에서 발생한 low-progress transient가 단발성 우연인지, 반복 가능한 rare event인지 확인합니다. 이를 위해 prewarm count, light warp placement, seed mode를 바꾸고, transient_count와 min_progress를 추적합니다.",
    question:
      "3 shared-chain + 1 light + 4 global composition의 low-progress transient는 prewarm, placement, seed 변화 이후에도 반복되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Rare transient event",
        text:
          "평균 progress는 안정적으로 보여도 특정 run에서 dependent_global_stalled progress가 60 미만으로 떨어질 수 있습니다. 이 실험은 그런 low-progress event의 반복성을 봅니다.",
      },
      {
        label: "Prewarm sensitivity",
        text:
          "prewarm 횟수를 0, 1, 3으로 바꿔 transient가 단순 warmup 부족 때문인지 확인합니다.",
      },
      {
        label: "Placement sensitivity",
        text:
          "light warp 위치를 warp0, warp1, warp2, warp3로 바꿔 role placement가 transient 강도와 빈도에 영향을 주는지 확인합니다.",
      },
      {
        label: "Seed sensitivity",
        text:
          "linear run_id seed와 hashed seed를 비교해 transient가 특정 linear seed 패턴에 고정된 artifact인지 확인합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler 내부 phase를 직접 증명했다는 주장",
    "특정 run index에서 항상 transient가 발생한다는 주장",
    "모든 GPU와 모든 occupancy 조건에서 같은 transient rate가 나온다는 주장",
    "shared-dependent-chain 조합이 항상 위험하다는 일반 법칙",
    "평균 progress가 실제 throughput ratio와 동일하다는 주장",
  ],

  config: {
    numBatches: 8,
    runsPerBatch: 48,
    numConditions: 7,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    globalBufferSize: 1_048_576,
    readyWarpCount: 4,
    stalledWarpCount: 4,
    transientThreshold: 60,
  },

  roleMap: {
    0: "light_alu_ready",
    1: "shared_dependent_chain_ready",
    2: "dependent_global_stalled",
  },

  conditionMap: {
    0: "fixed_light_warp3_prewarm1_linear_seed",
    1: "fixed_light_warp3_prewarm0_linear_seed",
    2: "fixed_light_warp3_prewarm3_linear_seed",
    3: "permuted_light_warp0_prewarm1_linear_seed",
    4: "permuted_light_warp1_prewarm1_linear_seed",
    5: "permuted_light_warp2_prewarm1_linear_seed",
    6: "fixed_light_warp3_prewarm1_hashed_seed",
  },

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "fixed_light_warp3_prewarm1_linear_seed",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 549.523,
      coefficientOfVariation: 0.000927662,
      minProgress: 548,
      maxProgress: 551,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 0,
      conditionName: "fixed_light_warp3_prewarm1_linear_seed",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      meanProgress: 297.49,
      coefficientOfVariation: 0.00168563,
      minProgress: 297,
      maxProgress: 299,
      transientCount: 0,
      transientRate: 0,
    },
    {
      conditionId: 0,
      conditionName: "fixed_light_warp3_prewarm1_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 75.8164,
      coefficientOfVariation: 0.0230182,
      minProgress: 46,
      maxProgress: 76,
      transientCount: 1,
      transientRate: 0.00260417,
    },
    {
      conditionId: 1,
      conditionName: "fixed_light_warp3_prewarm0_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 75.8451,
      coefficientOfVariation: 0.0236062,
      minProgress: 43,
      maxProgress: 76,
      transientCount: 1,
      transientRate: 0.00260417,
    },
    {
      conditionId: 2,
      conditionName: "fixed_light_warp3_prewarm3_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 73.9987,
      coefficientOfVariation: 0.0320679,
      minProgress: 49,
      maxProgress: 76,
      transientCount: 2,
      transientRate: 0.00520833,
    },
    {
      conditionId: 3,
      conditionName: "permuted_light_warp0_prewarm1_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 72.8171,
      coefficientOfVariation: 0.0222713,
      minProgress: 49,
      maxProgress: 73,
      transientCount: 2,
      transientRate: 0.00520833,
    },
    {
      conditionId: 4,
      conditionName: "permuted_light_warp1_prewarm1_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 72.7507,
      coefficientOfVariation: 0.0308307,
      minProgress: 36,
      maxProgress: 73,
      transientCount: 2,
      transientRate: 0.00520833,
    },
    {
      conditionId: 5,
      conditionName: "permuted_light_warp2_prewarm1_linear_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 72.5879,
      coefficientOfVariation: 0.042189,
      minProgress: 33,
      maxProgress: 73,
      transientCount: 3,
      transientRate: 0.0078125,
    },
    {
      conditionId: 6,
      conditionName: "fixed_light_warp3_prewarm1_hashed_seed",
      roleId: 2,
      roleName: "dependent_global_stalled",
      meanProgress: 72.7689,
      coefficientOfVariation: 0.0306169,
      minProgress: 35,
      maxProgress: 73,
      transientCount: 2,
      transientRate: 0.00520833,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 4,
      role: "baseline_global_stalled",
      progress: 75.8164,
      lastClock: null,
      sink: null,
      signature:
        "baseline 조건에서 global stalled min 46, transient 1회가 관찰된 repeatability signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "prewarm0_global_stalled",
      progress: 75.8451,
      lastClock: null,
      sink: null,
      signature:
        "prewarm을 제거해도 min 43 transient가 발생해 단순 warmup artifact가 아님을 시사",
    },
    {
      block: 0,
      warpId: 4,
      role: "prewarm3_global_stalled",
      progress: 73.9987,
      lastClock: null,
      sink: null,
      signature:
        "prewarm을 3회로 늘려도 transient 2회가 남은 condition",
    },
    {
      block: 0,
      warpId: 4,
      role: "light_warp0_global_stalled",
      progress: 72.8171,
      lastClock: null,
      sink: null,
      signature:
        "light warp placement를 warp0으로 바꾼 조건에서도 transient가 발생",
    },
    {
      block: 0,
      warpId: 4,
      role: "light_warp1_global_stalled",
      progress: 72.7507,
      lastClock: null,
      sink: null,
      signature:
        "light warp1 placement에서 min 36으로 더 강한 transient 발생",
    },
    {
      block: 0,
      warpId: 4,
      role: "light_warp2_global_stalled",
      progress: 72.5879,
      lastClock: null,
      sink: null,
      signature:
        "light warp2 placement에서 min 33, transient 3회로 가장 강한 placement-sensitive tail risk 발생",
    },
    {
      block: 0,
      warpId: 4,
      role: "hashed_seed_global_stalled",
      progress: 72.7689,
      lastClock: null,
      sink: null,
      signature:
        "hashed seed 조건에서도 min 35, transient 2회가 관찰되어 linear seed artifact 가능성을 낮춤",
    },
  ],

  ordering: [
    "fixed_light_warp3_prewarm1_linear_seed",
    "fixed_light_warp3_prewarm0_linear_seed",
    "fixed_light_warp3_prewarm3_linear_seed",
    "permuted_light_warp0_prewarm1_linear_seed",
    "permuted_light_warp1_prewarm1_linear_seed",
    "permuted_light_warp2_prewarm1_linear_seed",
    "fixed_light_warp3_prewarm1_hashed_seed",
  ],

  ratios: {
    baselineTransientRate: 0.00260417,
    prewarm3VsBaselineTransientRate: 2,
    lightWarp2VsBaselineTransientRate: 3,
    lightWarp2MinVsBaselineMin: 0.72,
    hashedSeedVsBaselineTransientRate: 2,
  },

  batchConditionHighlights: [
    {
      conditionId: 0,
      conditionName: "fixed_light_warp3_prewarm1_linear_seed",
      batchId: 2,
      globalTransientRunCount: 1,
      globalMinProgress: 46,
      note: "baseline 조건에서 transient가 재현된 batch",
    },
    {
      conditionId: 1,
      conditionName: "fixed_light_warp3_prewarm0_linear_seed",
      batchId: 3,
      globalTransientRunCount: 1,
      globalMinProgress: 43,
      note: "prewarm 제거 조건에서도 transient 발생",
    },
    {
      conditionId: 2,
      conditionName: "fixed_light_warp3_prewarm3_linear_seed",
      batchId: 6,
      globalTransientRunCount: 1,
      globalMinProgress: 49,
      note: "prewarm 3회 조건에서도 transient 발생",
    },
    {
      conditionId: 2,
      conditionName: "fixed_light_warp3_prewarm3_linear_seed",
      batchId: 7,
      globalTransientRunCount: 1,
      globalMinProgress: 50,
      note: "prewarm 3회 조건의 두 번째 transient batch",
    },
    {
      conditionId: 4,
      conditionName: "permuted_light_warp1_prewarm1_linear_seed",
      batchId: 2,
      globalTransientRunCount: 1,
      globalMinProgress: 36,
      note: "light warp1 placement에서 강한 transient",
    },
    {
      conditionId: 5,
      conditionName: "permuted_light_warp2_prewarm1_linear_seed",
      batchId: 3,
      globalTransientRunCount: 1,
      globalMinProgress: 33,
      note: "가장 강한 placement-sensitive transient",
    },
    {
      conditionId: 6,
      conditionName: "fixed_light_warp3_prewarm1_hashed_seed",
      batchId: 1,
      globalTransientRunCount: 1,
      globalMinProgress: 35,
      note: "hashed seed 조건에서 transient 발생",
    },
  ],

  rawRunHighlights: [
    {
      conditionId: 0,
      conditionName: "fixed_light_warp3_prewarm1_linear_seed",
      batchId: 2,
      runId: 22,
      warpProgress: [298, 298, 298, 550, 46, 47, 46, 47],
      note:
        "baseline 조건에서 발생한 low-progress transient. ready side는 정상이고 global stalled warp만 급락",
    },
    {
      conditionId: 1,
      conditionName: "fixed_light_warp3_prewarm0_linear_seed",
      batchId: 3,
      runId: 37,
      warpProgress: [298, 298, 298, 550, 44, 45, 43, 43],
      note:
        "prewarm 없이도 발생한 강한 transient",
    },
    {
      conditionId: 5,
      conditionName: "permuted_light_warp2_prewarm1_linear_seed",
      batchId: 3,
      runId: null,
      warpProgress: null,
      note:
        "batch summary 기준 global min 33으로 가장 강한 placement-sensitive transient가 관찰됨",
    },
    {
      conditionId: 6,
      conditionName: "fixed_light_warp3_prewarm1_hashed_seed",
      batchId: 1,
      runId: null,
      warpProgress: null,
      note:
        "hashed seed 조건에서도 global min 35 transient가 관찰됨",
    },
  ],

  interpretation: [
    "3 shared-chain + 1 light + 4 global composition의 transient는 단발성 artifact가 아니었습니다.",
    "baseline 조건에서 min 46, transient 1회가 재현되었습니다.",
    "prewarm을 0으로 줄여도 min 43 transient가 발생했고, prewarm을 3으로 늘려도 min 49, transient 2회가 발생했습니다.",
    "따라서 transient를 단순한 warmup 부족으로만 해석하기 어렵습니다.",
    "light warp placement를 바꾸면 transient의 강도와 빈도가 달라졌습니다.",
    "light warp2 placement에서는 min 33, transient 3회로 가장 강한 tail risk가 나타났습니다.",
    "hashed seed 조건에서도 min 35, transient 2회가 관찰되어 linear run_id seed artifact 가능성도 낮아졌습니다.",
    "따라서 이 현상은 ready-source composition, role placement, scheduler/memory phase가 결합된 rare transient event로 보는 것이 적절합니다.",
    "codegen 관점에서는 shared-memory-based mixed-role kernel variant를 평균 progress만으로 선택하면 안 됩니다.",
  ],

  caveats: [
    "transient event는 전체 run 대비 희박하게 발생합니다.",
    "특정 run index에 완전히 고정된 deterministic phase로 보기는 어렵습니다.",
    "단일 block, fixed launch shape, synthetic workload 조건의 관찰입니다.",
    "scheduler 내부 phase를 직접 측정한 것은 아닙니다.",
    "후속 실험에서 condition order shuffle, dummy kernel insertion, block count 변화, role placement rotation이 필요합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "shared_memory_tiled_kernel / mixed_compute_memory_kernel / memory_latency_bound_kernel / rare_tail_risk_kernel",

    affectedDecision:
      "kernel_variant_validation / warp_role_placement / shared_memory_usage / benchmark_protocol / tail_risk_model",

    costSignal:
      "3 shared-chain + 1 light + 4 global composition에서 dependent_global_stalled transient가 여러 조건에서 반복 관찰되었습니다. prewarm0, prewarm1, prewarm3, hashed seed, light warp placement permutation 모두에서 transient가 발생했으며, 특히 light warp2 placement에서는 min progress 33과 transient count 3으로 가장 강한 tail risk가 나타났습니다.",

    ruleCandidate:
      "shared-dependent-chain과 global-stalled role이 함께 있는 kernel variant는 평균 progress만으로 선택하지 않습니다. low-progress event count, min global progress, transient rate, light warp placement sensitivity, seed sensitivity를 함께 검증합니다. transient가 반복되는 variant는 steady-state mean이 좋아도 tail-risk penalty를 부여하고, role placement rotation 또는 composition balancing을 후보 완화 전략으로 둡니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "평균이 안정적이어도 rare transient가 반복되면 codegen risk입니다. tail event는 mean이 아니라 min, count, placement sensitivity로 봐야 합니다.",
  },

  costModelRole: {
    role: "phase_repeatability_validation",

    description:
      "이 probe는 composition_transient_probe에서 관찰된 low-progress transient가 단발성 artifact인지 반복 가능한 rare event인지 검증합니다. 결과적으로 cost model에는 평균 progress뿐 아니라 transient_count, transient_rate, min_progress, placement sensitivity가 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "scheduler_phase_probe",
      "transient_event_localization",
      "kernel_variant_tail_risk_model",
      "shared_memory_layout_rule",
    ],
  },

  measurementReliability: {
    status: "phase_sensitive_transient_observed",

    issue:
      "transient는 반복되지만 발생 빈도가 낮고 특정 run index에 완전히 고정되어 있지는 않습니다. 따라서 deterministic phase라고 단정하기보다는 placement-sensitive rare event로 보는 것이 안전합니다.",

    impact:
      "prewarm 횟수와 seed 방식을 바꿔도 transient가 제거되지 않았기 때문에 단순 warmup artifact나 linear seed artifact 가능성은 낮아졌습니다. 다만 scheduler phase, launch order, role placement, SM state와의 결합 가능성은 여전히 남아 있습니다.",

    mitigation:
      "후속 scheduler_phase_probe에서 condition order shuffle, dummy kernel 삽입, role placement rotation, block 수 변화, cycle budget sweep을 수행해 transient event의 위치와 발생 조건을 좁힙니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "평균 progress만 보고 kernel variant를 선택하지 않습니다.",
      "rare low-progress event가 반복되면 tail-risk penalty를 둡니다.",
      "shared-dependent-chain + global-stalled composition은 placement sensitivity를 확인합니다.",
      "prewarm을 늘려도 사라지지 않는 transient는 steady-state validation 대상입니다.",
      "role placement rotation과 condition order shuffle을 통과한 뒤에만 hard rule로 승격합니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 composition transient가 단발성이 아니라 여러 조건에서 반복되는 rare event임을 보여줍니다. 다음 scheduler phase probe에서는 이 event가 condition order, dummy kernel 삽입, block count, cycle budget에 따라 어떻게 이동하거나 사라지는지 확인합니다.",
    examples: [
      "condition order shuffle로 실행 순서 artifact를 분리합니다.",
      "dummy kernel insertion으로 launch phase sensitivity를 확인합니다.",
      "role placement rotation으로 warp position effect를 분리합니다.",
      "block count sweep으로 단일 block artifact인지 확인합니다.",
      "cycle budget sweep으로 transient가 특정 시간 구간에 의존하는지 봅니다.",
    ],
  },

  nextStep: {
    label: "Scheduler Phase Probe",
    desc:
      "composition transient가 반복되지만 특정 run index에 고정되지 않았으므로, 다음 단계에서는 launch/condition/scheduler phase와의 결합 여부를 직접 확인합니다.",
    configText:
      "shuffle condition order\ninsert dummy kernels\nrotate role placement\nvary block count\nvary cycle budget\ntrack transient run_id and min progress",
    metrics: [
      "transient event count",
      "transient event run_id",
      "global stalled min progress",
      "condition order별 event 발생 여부",
      "dummy kernel 삽입 전후 event 이동 여부",
      "block count별 event rate",
      "cycle budget별 event intensity",
    ],
  },

  previousObservationId: "composition_transient_probe",
  nextObservationId: "scheduler_phase_probe",
};