export const compositionTransientProbeObservation = {
  id: "composition_transient_probe",
  groupLabel: "Warp Scheduling",
  type: "Composition Transient Analysis",
  label: "Composition transient probe",
  title: "ready-source composition이 만드는 global stall tail-risk",

  summary:
    "Shared Memory Ready Interference Probe에서 shared_dependent_chain_ready와 dependent_global_stalled가 공존할 때 global progress transient가 발생한 이후, shared dependent-chain ready warp의 수를 0개부터 4개까지 바꿔 어떤 ready-source composition에서 transient가 발생하는지 확인한 probe입니다. 이 실험은 shared-chain ready warp 개수 자체보다 ready-source composition의 비대칭성과 run-phase interaction이 global stalled progress에 어떤 tail risk를 만드는지 분석합니다.",

  keyFindings: [
    {
      label: "Stable Balanced",
      value: "2 shared + 2 light",
      desc: "global 76.000 / CV 0",
    },
    {
      label: "Strong Transient",
      value: "3 shared + 1 light",
      desc: "global min 45 / CV 0.0567",
    },
    {
      label: "Stable All Shared",
      value: "4 shared + 0 light",
      desc: "global 75.891 / CV 0.0031",
    },
    {
      label: "Codegen Use",
      value: "composition tail risk",
      desc: "개수 기반 penalty가 아니라 composition 기반 평가 필요",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 shared dependent-chain ready warp의 수를 0개부터 4개까지 바꾸면서, dependent_global_stalled warp의 low-progress transient가 어떤 ready-source composition에서 발생하는지 확인합니다. 목적은 shared-chain ready warp가 많을수록 나쁜지 확인하는 것이 아니라, 특정 role mix와 비대칭 composition이 global stalled tail event를 만드는지 보는 것입니다.",
    question:
      "dependent_global_stalled의 low-progress transient는 shared dependent-chain ready warp 수에 비례하는가, 아니면 특정 ready-source composition에서만 발생하는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Composition asymmetry",
        text:
          "같은 ready warp 수라도 shared-chain과 light ready source의 비율이 달라지면 scheduler가 보는 ready instruction stream의 구성이 달라집니다. 이 비대칭성이 특정 run phase와 결합해 global stalled transient를 만들 수 있습니다.",
      },
      {
        label: "Shared dependent-chain ready",
        text:
          "shared memory dependent-chain workload는 ready source이지만, 그 내부 dependency 때문에 light ALU ready source와 다른 progress signature를 남깁니다.",
      },
      {
        label: "Global stalled tail event",
        text:
          "평균 progress는 거의 유지되더라도 특정 run에서 dependent_global_stalled warp가 45~47 수준까지 떨어질 수 있습니다. 이런 현상은 mean이 아니라 min/CV/raw run으로 포착해야 합니다.",
      },
      {
        label: "Non-monotonic risk",
        text:
          "4 shared-chain 조건이 안정적인데 3 shared-chain + 1 light 조건이 불안정하므로, risk는 shared-chain 개수에 단조적으로 비례하지 않습니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler의 내부 issue policy",
    "shared-dependent-chain ready warp가 많을수록 항상 나쁘다는 주장",
    "3 shared-chain + 1 light 조합이 모든 GPU와 모든 occupancy에서 항상 불안정하다는 주장",
    "progress ratio가 실제 throughput ratio 또는 latency ratio와 동일하다는 주장",
    "단일 실험만으로 hard codegen rule을 확정했다는 주장",
  ],

  config: {
    numRunsPerCondition: 48,
    numConditions: 7,
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
    1: "shared_dependent_chain_ready",
    2: "dependent_global_stalled",
  },

  conditionMap: {
    0: "zero_shared_chain_four_light_four_global",
    1: "one_shared_chain_three_light_four_global",
    2: "two_shared_chain_two_light_four_global",
    3: "three_shared_chain_one_light_four_global",
    4: "four_shared_chain_zero_light_four_global",
    5: "all_shared_dependent_chain",
    6: "all_global_stalled",
  },

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "zero_shared_chain_four_light_four_global",
      roleId: 0,
      roleName: "light_alu_ready",
      sharedChainReadyCount: 0,
      lightReadyCount: 4,
      globalStalledCount: 4,
      meanProgress: 549.01,
      variance: 0.000325521,
      stddev: 0.0180422,
      coefficientOfVariation: 0.0000909887,
      minProgress: 549,
      maxProgress: 550,
    },
    {
      conditionId: 0,
      conditionName: "zero_shared_chain_four_light_four_global",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 0,
      lightReadyCount: 4,
      globalStalledCount: 4,
      meanProgress: 76.1562,
      variance: 0.0248481,
      stddev: 0.157633,
      coefficientOfVariation: 0.00389831,
      minProgress: 76,
      maxProgress: 77,
    },
    {
      conditionId: 1,
      conditionName: "one_shared_chain_three_light_four_global",
      roleId: 0,
      roleName: "light_alu_ready",
      sharedChainReadyCount: 1,
      lightReadyCount: 3,
      globalStalledCount: 4,
      meanProgress: 549.25,
      variance: 0.000868056,
      stddev: 0.0294628,
      coefficientOfVariation: 0.000814486,
      minProgress: 549,
      maxProgress: 551,
    },
    {
      conditionId: 1,
      conditionName: "one_shared_chain_three_light_four_global",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      sharedChainReadyCount: 1,
      lightReadyCount: 3,
      globalStalledCount: 4,
      meanProgress: 299.167,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.00124572,
      minProgress: 299,
      maxProgress: 300,
    },
    {
      conditionId: 1,
      conditionName: "one_shared_chain_three_light_four_global",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 1,
      lightReadyCount: 3,
      globalStalledCount: 4,
      meanProgress: 75.724,
      variance: 0.0000813802,
      stddev: 0.0090211,
      coefficientOfVariation: 0.0228672,
      minProgress: 63,
      maxProgress: 77,
    },
    {
      conditionId: 2,
      conditionName: "two_shared_chain_two_light_four_global",
      roleId: 0,
      roleName: "light_alu_ready",
      sharedChainReadyCount: 2,
      lightReadyCount: 2,
      globalStalledCount: 4,
      meanProgress: 549.812,
      variance: 0.000434028,
      stddev: 0.0208333,
      coefficientOfVariation: 0.000708238,
      minProgress: 549,
      maxProgress: 550,
    },
    {
      conditionId: 2,
      conditionName: "two_shared_chain_two_light_four_global",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      sharedChainReadyCount: 2,
      lightReadyCount: 2,
      globalStalledCount: 4,
      meanProgress: 299.052,
      variance: 0.000108507,
      stddev: 0.0104167,
      coefficientOfVariation: 0.000738812,
      minProgress: 299,
      maxProgress: 300,
    },
    {
      conditionId: 2,
      conditionName: "two_shared_chain_two_light_four_global",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 2,
      lightReadyCount: 2,
      globalStalledCount: 4,
      meanProgress: 76,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 76,
      maxProgress: 76,
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      roleId: 0,
      roleName: "light_alu_ready",
      sharedChainReadyCount: 3,
      lightReadyCount: 1,
      globalStalledCount: 4,
      meanProgress: 549.833,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.000677802,
      minProgress: 549,
      maxProgress: 550,
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      sharedChainReadyCount: 3,
      lightReadyCount: 1,
      globalStalledCount: 4,
      meanProgress: 298.799,
      variance: 0.0000964506,
      stddev: 0.00982093,
      coefficientOfVariation: 0.00149834,
      minProgress: 298,
      maxProgress: 300,
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 3,
      lightReadyCount: 1,
      globalStalledCount: 4,
      meanProgress: 75.2656,
      variance: 0.000298394,
      stddev: 0.0172741,
      coefficientOfVariation: 0.0567483,
      minProgress: 45,
      maxProgress: 76,
    },
    {
      conditionId: 4,
      conditionName: "four_shared_chain_zero_light_four_global",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      sharedChainReadyCount: 4,
      lightReadyCount: 0,
      globalStalledCount: 4,
      meanProgress: 298.375,
      variance: 0.00802951,
      stddev: 0.0896076,
      coefficientOfVariation: 0.00162716,
      minProgress: 298,
      maxProgress: 300,
    },
    {
      conditionId: 4,
      conditionName: "four_shared_chain_zero_light_four_global",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 4,
      lightReadyCount: 0,
      globalStalledCount: 4,
      meanProgress: 75.8906,
      variance: 0.0146213,
      stddev: 0.120919,
      coefficientOfVariation: 0.00309885,
      minProgress: 75,
      maxProgress: 76,
    },
    {
      conditionId: 5,
      conditionName: "all_shared_dependent_chain",
      roleId: 1,
      roleName: "shared_dependent_chain_ready",
      sharedChainReadyCount: 8,
      lightReadyCount: 0,
      globalStalledCount: 0,
      meanProgress: 296.755,
      variance: 0.010498,
      stddev: 0.10246,
      coefficientOfVariation: 0.00218798,
      minProgress: 295,
      maxProgress: 298,
    },
    {
      conditionId: 6,
      conditionName: "all_global_stalled",
      roleId: 2,
      roleName: "dependent_global_stalled",
      sharedChainReadyCount: 0,
      lightReadyCount: 0,
      globalStalledCount: 8,
      meanProgress: 74.6406,
      variance: 0.000515408,
      stddev: 0.0227026,
      coefficientOfVariation: 0.0258048,
      minProgress: 61,
      maxProgress: 75,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 4,
      role: "zero_shared_chain_global_stalled",
      progress: 76.156,
      lastClock: null,
      sink: null,
      signature:
        "0 shared-chain + 4 light + 4 global 조건. light ready 기준선에서 global stalled progress가 안정적",
    },
    {
      block: 0,
      warpId: 4,
      role: "one_shared_chain_global_stalled",
      progress: 75.724,
      lastClock: null,
      sink: null,
      signature:
        "1 shared-chain + 3 light 조건. 약한 low-progress transient가 발생해 min 63 기록",
    },
    {
      block: 0,
      warpId: 4,
      role: "two_shared_chain_global_stalled",
      progress: 76,
      lastClock: null,
      sink: null,
      signature:
        "2 shared-chain + 2 light 조건. global stalled progress가 CV 0으로 완전히 안정적",
    },
    {
      block: 0,
      warpId: 4,
      role: "three_shared_chain_global_stalled",
      progress: 75.266,
      lastClock: null,
      sink: null,
      signature:
        "3 shared-chain + 1 light 조건. 특정 run에서 global progress가 45~47까지 떨어지는 강한 transient 발생",
    },
    {
      block: 0,
      warpId: 4,
      role: "four_shared_chain_global_stalled",
      progress: 75.891,
      lastClock: null,
      sink: null,
      signature:
        "4 shared-chain + 0 light 조건. 모든 ready warp가 shared-chain이어도 global stalled progress는 안정적",
    },
    {
      block: 0,
      warpId: 0,
      role: "all_shared_dependent_chain",
      progress: 296.755,
      lastClock: null,
      sink: null,
      signature:
        "global stalled warp 없이 all shared dependent-chain만 수행한 조건. shared-chain workload 자체는 안정적",
    },
    {
      block: 0,
      warpId: 0,
      role: "all_global_stalled",
      progress: 74.641,
      lastClock: null,
      sink: null,
      signature:
        "ready warp가 없는 all global stalled 조건. 초기 warm transition이 남아 있음",
    },
  ],

  ordering: [
    "two_shared_chain_two_light_four_global",
    "four_shared_chain_zero_light_four_global",
    "zero_shared_chain_four_light_four_global",
    "one_shared_chain_three_light_four_global",
    "three_shared_chain_one_light_four_global",
    "all_global_stalled",
  ],

  ratios: {
    condition3MinDropVsPlateau: 1.69,
    condition1MinDropVsPlateau: 1.2,
    balancedVsTransientCV: "0 vs 0.0567",
    condition3CvVsCondition4Cv: 18.31,
    allSharedVsSharedInMixed: 0.99,
  },

  warpConditionStatsHighlights: [
    {
      conditionId: 1,
      conditionName: "one_shared_chain_three_light_four_global",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 75.7292,
      coefficientOfVariation: 0.0246659,
      minProgress: 63,
      maxProgress: 77,
    },
    {
      conditionId: 2,
      conditionName: "two_shared_chain_two_light_four_global",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 76,
      coefficientOfVariation: 0,
      minProgress: 76,
      maxProgress: 76,
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      warpId: 5,
      roleName: "dependent_global_stalled",
      meanProgress: 75.25,
      coefficientOfVariation: 0.0591511,
      minProgress: 45,
      maxProgress: 76,
    },
    {
      conditionId: 4,
      conditionName: "four_shared_chain_zero_light_four_global",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 76,
      coefficientOfVariation: 0,
      minProgress: 76,
      maxProgress: 76,
    },
    {
      conditionId: 6,
      conditionName: "all_global_stalled",
      warpId: 0,
      roleName: "dependent_global_stalled",
      meanProgress: 74.625,
      coefficientOfVariation: 0.0254584,
      minProgress: 62,
      maxProgress: 75,
    },
  ],

  rawRunHighlights: [
    {
      conditionId: 1,
      conditionName: "one_shared_chain_three_light_four_global",
      runId: 15,
      warpProgress: [300, 551, 550, 550, 63, 66, 64, 63],
      note:
        "1 shared-chain 조건에서 발생한 약한 low-progress transient",
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      runId: 26,
      warpProgress: [299, 299, 299, 550, 47, 45, 47, 46],
      note:
        "3 shared-chain + 1 light 조건에서 발생한 가장 강한 low-progress transient. ready side는 정상이고 global stalled role만 급락",
    },
    {
      conditionId: 3,
      conditionName: "three_shared_chain_one_light_four_global",
      runId: 27,
      warpProgress: [300, 299, 299, 550, 72, 72, 73, 72],
      note:
        "강한 transient 이후 global stalled progress가 회복되는 중간 run",
    },
    {
      conditionId: 2,
      conditionName: "two_shared_chain_two_light_four_global",
      runId: 0,
      warpProgress: [299, 299, 549, 549, 76, 76, 76, 76],
      note:
        "balanced composition에서 global stalled progress가 안정적으로 유지됨",
    },
    {
      conditionId: 4,
      conditionName: "four_shared_chain_zero_light_four_global",
      runId: 0,
      warpProgress: [299, 299, 298, 298, 76, 76, 76, 76],
      note:
        "모든 ready warp가 shared-chain이어도 global stalled progress는 안정적",
    },
    {
      conditionId: 6,
      conditionName: "all_global_stalled",
      runId: 0,
      warpProgress: [62, 62, 62, 61, 62, 62, 62, 61],
      note:
        "all global stalled 조건에서 초기 warm transition이 남아 있음",
    },
  ],

  interpretation: [
    "dependent_global_stalled의 low-progress transient는 shared_dependent_chain_ready warp 수에 단조적으로 비례하지 않았습니다.",
    "0 shared-chain + 4 light 조건은 global progress가 76.156으로 안정적이었습니다.",
    "1 shared-chain + 3 light 조건에서는 min 63 수준의 약한 transient가 발생했습니다.",
    "2 shared-chain + 2 light 조건은 global progress 76, CV 0으로 가장 안정적인 balanced composition이었습니다.",
    "3 shared-chain + 1 light 조건에서는 run 26에서 global stalled warp가 45~47까지 떨어지는 강한 transient가 발생했습니다.",
    "4 shared-chain + 0 light 조건은 모든 ready warp가 shared-chain임에도 global progress가 75~76 수준으로 안정적이었습니다.",
    "따라서 문제는 shared-chain ready warp의 절대 개수가 아니라, shared-chain과 light ready source가 만드는 비대칭 composition 및 run-phase interaction으로 보는 것이 적절합니다.",
    "codegen 관점에서는 shared-dependent-chain count만으로 penalty를 주지 말고, composition pattern과 tail event를 함께 추적해야 합니다.",
  ],

  caveats: [
    "condition 3의 낮은 global progress는 지속적인 steady-state 저하가 아니라 특정 run에서 발생한 transient입니다.",
    "pre-measurement global warmup을 넣었음에도 중간 run에서 transient가 발생했기 때문에 단순 초기 warmup artifact로만 설명하기 어렵습니다.",
    "condition 실행 순서, role placement, scheduler phase와의 결합 가능성은 아직 분리되지 않았습니다.",
    "single block, fixed launch shape, synthetic workload 조건의 관찰입니다.",
    "이 결과만으로 일반적인 scheduler 정책이나 모든 GPU에서의 hard rule을 단정하면 안 됩니다.",
  ],

  codegenImpact: {
    targetPattern:
      "shared_memory_tiled_kernel / mixed_compute_memory_kernel / memory_latency_bound_kernel / shared_dependent_chain_kernel",

    affectedDecision:
      "warp_role_composition / shared_memory_usage / dependency_scheduling / tail_risk_validation / kernel_variant_selection",

    costSignal:
      "global stalled transient는 shared dependent-chain ready warp 수에 단조적으로 비례하지 않았습니다. 2 shared-chain + 2 light와 4 shared-chain + 0 light 조건은 안정적이었지만, 3 shared-chain + 1 light 조건에서 global stalled warp가 특정 run에 45~47까지 떨어졌습니다. 따라서 shared-dependent-chain count만으로는 risk를 설명할 수 없고, ready-source composition의 비대칭성과 run-phase interaction을 함께 봐야 합니다.",

    ruleCandidate:
      "shared-dependent-chain이 포함된 mixed-role kernel variant는 단순 개수 기반 penalty가 아니라 composition pattern 기반으로 평가합니다. shared_chain_ready_count, light_ready_count, global_stalled_count, role placement, low-progress transient count, min global progress, global CV를 함께 추적합니다. 평균 progress가 유지되더라도 tail event가 있는 variant는 validation penalty를 부여합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "shared-dependent-chain ready warp가 많을수록 나쁘다는 단순 규칙은 틀릴 수 있습니다. 3 shared-chain + 1 light처럼 비대칭 composition이 tail risk를 만들 수 있습니다.",
  },

  costModelRole: {
    role: "composition_tail_risk_analysis",

    description:
      "이 probe는 shared dependent-chain ready source와 dependent global stalled source가 섞일 때, global stalled transient가 어떤 composition에서 발생하는지 확인합니다. 결과적으로 cost model에는 ready source 종류뿐 아니라 ready-source composition의 비대칭성, low-progress event count, min progress, CV가 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "composition_phase_repeatability_probe",
      "scheduler_phase_probe",
      "shared_memory_layout_rule",
      "kernel_variant_tail_risk_model",
    ],
  },

  measurementReliability: {
    status: "composition_transient_observed",

    issue:
      "가장 강한 transient는 3 shared-chain + 1 light + 4 global 조건의 특정 run에서 발생했습니다. 따라서 이것이 condition 자체의 반복 가능한 특성인지, role placement, condition 실행 순서, run phase에 의존하는 artifact인지는 아직 추가 검증이 필요합니다.",

    impact:
      "현재 결과는 shared-chain 개수 기반 단조 penalty가 부정확하다는 강한 근거를 제공합니다. 다만 hard codegen rule로 승격하려면 phase repeatability와 placement rotation 검증이 필요합니다.",

    mitigation:
      "후속 composition_phase_repeatability_probe에서 condition 실행 순서 shuffle, role placement rotation, repeated batches를 수행하고 low-progress event의 run_id와 발생 빈도를 추적합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "shared-dependent-chain count만으로 penalty를 주지 않습니다.",
      "3 shared-chain + 1 light처럼 비대칭 composition이 tail risk를 만들 수 있습니다.",
      "평균 progress가 유지되어도 min progress와 low-progress event count를 반드시 봅니다.",
      "balanced composition은 오히려 안정적일 수 있으므로 role mix를 분리해서 봅니다.",
      "tail event가 있는 kernel variant는 phase repeatability 검증 전까지 hard rule로 승격하지 않습니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 shared-chain ready 개수 자체가 아니라 ready-source composition의 비대칭성이 global stalled transient를 만들 수 있음을 보여줍니다. 다음 composition phase repeatability probe에서는 이 transient가 같은 condition과 phase에서 반복되는지, 혹은 condition order와 role placement에 의존하는지 확인합니다.",
    examples: [
      "condition 실행 순서를 shuffle해 run-phase artifact를 분리합니다.",
      "role placement를 rotation해 warp_id 또는 position effect를 분리합니다.",
      "3 shared-chain + 1 light 조건을 repeated batch로 반복해 low-progress event frequency를 측정합니다.",
      "2 shared-chain + 2 light와 4 shared-chain + 0 light를 control로 유지합니다.",
    ],
  },

  nextStep: {
    label: "Composition Phase Repeatability Probe",
    desc:
      "3 shared-chain + 1 light + 4 global 조건에서 강한 low-progress transient가 발생했으므로, 다음 단계에서는 이 transient가 반복 가능한 phase 현상인지, condition order 또는 role placement artifact인지 확인합니다.",
    configText:
      "target = 3 shared-chain + 1 light + 4 global\ncontrols = 2 shared-chain + 2 light, 4 shared-chain + 0 light\nshuffle condition order\nrotate role placement\ntrack low-progress event run_id",
    metrics: [
      "low-progress event count",
      "low-progress event run_id",
      "global stalled min progress",
      "global stalled CV",
      "condition order별 event 발생 여부",
      "role placement별 event 발생 여부",
    ],
  },

  previousObservationId: "shared_memory_ready_interference_probe",
  nextObservationId: "composition_phase_repeatability_probe",
};