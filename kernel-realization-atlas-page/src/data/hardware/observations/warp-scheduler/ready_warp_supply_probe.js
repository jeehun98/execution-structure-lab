export const readyWarpSupplyProbeObservation = {
  id: "ready_warp_supply_probe",
  groupLabel: "Warp Scheduling",
  type: "Ready Source Analysis",
  label: "Ready warp supply",
  title: "ready warp source 종류가 바꾸는 latency hiding signature",

  summary:
    "Latency Hiding Ratio Probe와 Warmup Stability Probe 이후, global memory stalled warp와 함께 존재하는 ready warp의 종류를 바꿔 latency hiding signature가 어떻게 달라지는지 관찰한 probe입니다. 이 실험은 ready warp의 수가 아니라 ready source의 성질이 global memory stall 조건에서 어떤 progress signature를 남기는지 확인합니다.",

  keyFindings: [
    {
      label: "Light Ready",
      value: "548.086 / 74.977",
      desc: "ready progress / global stalled progress",
    },
    {
      label: "Dep ALU Ready",
      value: "529.945 / 74.828",
      desc: "ready progress / global stalled progress",
    },
    {
      label: "Shared Ready",
      value: "326.758 / 72.984",
      desc: "global transient로 평균 저하",
    },
    {
      label: "Shared Transient",
      value: "min 45~47",
      desc: "shared_load_ready 조건의 global low-progress run",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 ready warp의 수가 충분할 때, 그 ready work의 종류가 latency hiding signature에 어떤 차이를 만드는지 확인합니다. light ALU, dependent ALU, shared load ready source를 각각 global memory stalled warp와 함께 배치하고, ready-side progress와 global-stalled progress를 분리해 관찰합니다.",
    question:
      "global memory stalled warp와 함께 존재하는 ready warp의 종류는 latency hiding signature를 어떻게 바꾸는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Ready source quality",
        text:
          "ready warp가 존재하더라도 그 warp가 independent ALU인지, dependent ALU인지, shared memory load인지에 따라 ready-side progress와 issue availability가 달라질 수 있습니다.",
      },
      {
        label: "Stalled global work",
        text:
          "dependent_global_stalled role은 global memory latency와 address dependency에 의해 낮은 progress signature를 남기는 stall source입니다.",
      },
      {
        label: "Shared memory ready source",
        text:
          "shared_load_ready는 on-chip memory access를 포함하므로 ALU ready source와 다른 progress signature를 가질 수 있습니다. 또한 특정 composition에서 global stalled variability를 키울 가능성이 있습니다.",
      },
      {
        label: "Mean vs transient",
        text:
          "평균 progress가 낮아 보일 때, 지속적인 steady-state 저하인지 특정 low-progress run의 영향인지 raw run과 CV를 함께 봐야 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler의 내부 issue policy",
    "ready source 종류가 모든 GPU에서 동일한 비율로 latency hiding에 기여한다는 주장",
    "progress ratio가 실제 throughput ratio 또는 latency ratio와 동일하다는 주장",
    "shared memory가 항상 global stalled variability를 키운다는 주장",
    "mean progress만으로 steady-state behavior를 확정했다는 주장",
  ],

  config: {
    numRunsPerCondition: 32,
    numConditions: 5,
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
    1: "dependent_alu_ready",
    2: "shared_load_ready",
    3: "dependent_global_stalled",
  },

  conditionMap: {
    0: "light_ready_vs_global_stalled",
    1: "dependent_alu_ready_vs_global_stalled",
    2: "shared_load_ready_vs_global_stalled",
    3: "mixed_ready_sources_vs_global_stalled",
    4: "all_global_stalled",
  },

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "light_ready_vs_global_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 548.086,
      variance: 0.00164795,
      stddev: 0.0405949,
      coefficientOfVariation: 0.000776091,
      minProgress: 547,
      maxProgress: 550,
    },
    {
      conditionId: 0,
      conditionName: "light_ready_vs_global_stalled",
      roleId: 3,
      roleName: "dependent_global_stalled",
      meanProgress: 74.9766,
      variance: 0.000671387,
      stddev: 0.0259111,
      coefficientOfVariation: 0.00138776,
      minProgress: 74,
      maxProgress: 75,
    },
    {
      conditionId: 1,
      conditionName: "dependent_alu_ready_vs_global_stalled",
      roleId: 1,
      roleName: "dependent_alu_ready",
      meanProgress: 529.945,
      variance: 0.000183105,
      stddev: 0.0135316,
      coefficientOfVariation: 0.000586202,
      minProgress: 529,
      maxProgress: 531,
    },
    {
      conditionId: 1,
      conditionName: "dependent_alu_ready_vs_global_stalled",
      roleId: 3,
      roleName: "dependent_global_stalled",
      meanProgress: 74.8281,
      variance: 0.0202637,
      stddev: 0.142351,
      coefficientOfVariation: 0.00441189,
      minProgress: 74,
      maxProgress: 75,
    },
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      roleId: 2,
      roleName: "shared_load_ready",
      meanProgress: 326.758,
      variance: 0.00164795,
      stddev: 0.0405949,
      coefficientOfVariation: 0.00140514,
      minProgress: 326,
      maxProgress: 328,
    },
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      roleId: 3,
      roleName: "dependent_global_stalled",
      meanProgress: 72.9844,
      variance: 0.0012207,
      stddev: 0.0349386,
      coefficientOfVariation: 0.0670622,
      minProgress: 45,
      maxProgress: 75,
    },
    {
      conditionId: 3,
      conditionName: "mixed_ready_sources_vs_global_stalled",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 548.812,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.000711194,
      minProgress: 548,
      maxProgress: 549,
    },
    {
      conditionId: 3,
      conditionName: "mixed_ready_sources_vs_global_stalled",
      roleId: 1,
      roleName: "dependent_alu_ready",
      meanProgress: 531,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 531,
      maxProgress: 531,
    },
    {
      conditionId: 3,
      conditionName: "mixed_ready_sources_vs_global_stalled",
      roleId: 2,
      roleName: "shared_load_ready",
      meanProgress: 327.625,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0.00147767,
      minProgress: 327,
      maxProgress: 328,
    },
    {
      conditionId: 3,
      conditionName: "mixed_ready_sources_vs_global_stalled",
      roleId: 3,
      roleName: "dependent_global_stalled",
      meanProgress: 74.3828,
      variance: 0.0192261,
      stddev: 0.138658,
      coefficientOfVariation: 0.00624803,
      minProgress: 74,
      maxProgress: 75,
    },
    {
      conditionId: 4,
      conditionName: "all_global_stalled",
      roleId: 3,
      roleName: "dependent_global_stalled",
      meanProgress: 72.75,
      variance: 0.0378418,
      stddev: 0.19453,
      coefficientOfVariation: 0.0163843,
      minProgress: 60,
      maxProgress: 74,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 0,
      role: "light_alu_ready",
      progress: 548.086,
      lastClock: null,
      sink: null,
      signature:
        "light_alu_ready 조건에서 가장 높은 ready-side progress를 보인 latency hiding source",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_light_ready",
      progress: 74.977,
      lastClock: null,
      sink: null,
      signature:
        "light_alu_ready와 공존할 때 안정적으로 유지된 dependent_global_stalled signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "dependent_alu_ready",
      progress: 529.945,
      lastClock: null,
      sink: null,
      signature:
        "dependent_alu_ready 조건에서 light_alu보다 낮지만 안정적인 ready-side progress",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_dependent_alu_ready",
      progress: 74.828,
      lastClock: null,
      sink: null,
      signature:
        "dependent_alu_ready와 공존할 때도 거의 유지된 global stalled steady-state signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "shared_load_ready",
      progress: 326.758,
      lastClock: null,
      sink: null,
      signature:
        "shared memory access를 포함해 ALU ready source보다 낮은 ready-side progress를 보인 source",
    },
    {
      block: 0,
      warpId: 4,
      role: "global_stalled_with_shared_load_ready",
      progress: 72.984,
      lastClock: null,
      sink: null,
      signature:
        "shared_load_ready 조건에서 특정 low-progress transient의 영향을 받은 global stalled signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "mixed_ready_sources_global_stalled",
      progress: 74.383,
      lastClock: null,
      sink: null,
      signature:
        "mixed ready source 조건에서 stable하게 유지된 global stalled signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "all_global_stalled",
      progress: 72.75,
      lastClock: null,
      sink: null,
      signature:
        "ready warp supply가 없는 all global stalled 조건의 낮은 global progress signature",
    },
  ],

  ordering: [
    "light_alu_ready",
    "dependent_alu_ready",
    "shared_load_ready",
    "dependent_global_stalled",
  ],

  ratios: {
    lightReadyVsDependentAluReady: 1.03,
    lightReadyVsSharedLoadReady: 1.68,
    dependentAluReadyVsSharedLoadReady: 1.62,
    lightReadyVsGlobalStalled: 7.31,
    sharedLoadReadyVsGlobalStalled: 4.48,
  },

  warpConditionStatsHighlights: [
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 73.0312,
      coefficientOfVariation: 0.0648136,
      minProgress: 47,
      maxProgress: 75,
    },
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      warpId: 5,
      roleName: "dependent_global_stalled",
      meanProgress: 72.9688,
      coefficientOfVariation: 0.0692454,
      minProgress: 45,
      maxProgress: 74,
    },
    {
      conditionId: 4,
      conditionName: "all_global_stalled",
      warpId: 0,
      roleName: "dependent_global_stalled",
      meanProgress: 72.6875,
      coefficientOfVariation: 0.032161,
      minProgress: 60,
      maxProgress: 74,
    },
  ],

  rawRunHighlights: [
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      runId: 8,
      warpProgress: [327, 327, 327, 327, 47, 45, 47, 45],
      note:
        "shared_load_ready 조건에서 global stalled warp들이 45~47까지 떨어진 low-progress transient",
    },
    {
      conditionId: 2,
      conditionName: "shared_load_ready_vs_global_stalled",
      runId: 9,
      warpProgress: [327, 327, 327, 327, 70, 71, 70, 70],
      note:
        "transient 이후 global stalled progress가 recovery되는 중간 run",
    },
    {
      conditionId: 3,
      conditionName: "mixed_ready_sources_vs_global_stalled",
      runId: 0,
      warpProgress: [549, 531, 328, 549, 75, 75, 75, 74],
      note:
        "mixed ready source 조건에서 role별 signature와 global stalled signature가 함께 유지됨",
    },
    {
      conditionId: 4,
      conditionName: "all_global_stalled",
      runId: 0,
      warpProgress: [60, 61, 62, 61, 72, 72, 72, 72],
      note:
        "ready warp supply가 없는 all_global_stalled 조건의 초기 low-progress transition",
    },
  ],

  interpretation: [
    "ready warp source의 종류는 ready warp 자신의 progress signature에는 강하게 반영되었습니다.",
    "light_alu_ready는 약 548 progress, dependent_alu_ready는 약 530 progress, shared_load_ready는 약 327 progress를 보였습니다.",
    "4 ready / 4 dependent_global_stalled 조건에서 global stalled warp의 steady-state progress는 대부분 74~75 근처로 유지되었습니다.",
    "light_alu_ready, dependent_alu_ready, mixed_ready_sources 조건에서는 global stalled progress가 거의 유지되었습니다.",
    "shared_load_ready 조건에서는 특정 run에서 global progress가 45~47 수준까지 떨어지는 transient가 발생했습니다.",
    "따라서 ready source 종류만으로 global stalled steady-state가 크게 바뀌지는 않았지만, shared memory ready source는 global stalled variability를 키울 수 있습니다.",
    "codegen 관점에서는 ready source의 종류를 ready-side cost와 stalled-side variability risk로 나눠 모델링해야 합니다.",
  ],

  caveats: [
    "pre-measurement global warmup을 포함했지만 shared_load_ready와 all_global_stalled 조건에서 일부 transient가 남아 있습니다.",
    "shared_load_ready 조건의 낮은 global 평균은 지속적인 steady-state 저하라기보다 특정 low-progress run의 영향이 큽니다.",
    "synthetic workload 기반 실험이며, 실제 AI kernel의 shared memory pattern과는 차이가 있을 수 있습니다.",
    "shared memory bank conflict, shared dependency chain, synchronization cost는 이 실험에서 분리되지 않았습니다.",
    "mean progress만으로 steady-state behavior를 확정하면 안 되며, raw run tail event를 함께 봐야 합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "memory_latency_bound_kernel / mixed_compute_memory_kernel / shared_memory_ready_kernel / latency_hiding_sensitive_kernel",

    affectedDecision:
      "ready_source_selection / instruction_interleaving / warp_role_composition / shared_memory_usage / kernel_variant_validation",

    costSignal:
      "ready source의 종류는 ready-side progress signature를 크게 바꿨습니다. light_alu_ready는 약 548, dependent_alu_ready는 약 530, shared_load_ready는 약 327 progress를 보였습니다. 하지만 dependent_global_stalled의 steady-state progress는 대부분 74~75 근처로 유지되었습니다. 예외적으로 shared_load_ready 조건에서 global progress가 45~47까지 떨어지는 transient가 발생해 variability가 증가했습니다.",

    ruleCandidate:
      "latency hiding용 ready work를 모두 동일하게 취급하지 않습니다. ready source는 ready-side progress cost와 stalled-side 안정성 risk를 분리해 평가합니다. light/dependent ALU ready source는 global stalled steady-state를 크게 흔들지 않는 filler work 후보로 볼 수 있지만, shared memory ready source는 global stalled variability를 키울 수 있으므로 bank conflict, shared dependency chain, synchronization, composition transient를 추가 검증한 뒤 사용합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "ready warp supply는 양만 중요한 것이 아닙니다. ready source의 instruction structure가 ready-side throughput을 결정하고, shared-memory ready source는 global-stalled variability를 키울 수 있습니다.",
  },

  costModelRole: {
    role: "ready_source_quality_analysis",

    description:
      "이 probe는 latency hiding 분석을 ready warp count에서 ready source quality로 확장합니다. 결과적으로 cost model에는 ready warp 수뿐 아니라 ready work의 종류, ready-side progress, stalled-side variability risk가 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "shared_memory_ready_interference_probe",
      "composition_transient_probe",
      "shared_memory_bank_conflict_probe",
      "elementwise_fusion_depth_probe",
    ],
  },

  measurementReliability: {
    status: "ready_source_effect_observed",

    issue:
      "pre-measurement global warmup을 포함했지만 shared_load_ready와 all_global_stalled 조건에서 일부 low-progress transient가 남아 있습니다. 따라서 평균 progress만으로 steady-state를 판단하면 안 됩니다.",

    impact:
      "ready source 종류가 global stalled steady-state mean을 크게 바꾸지는 않았지만, shared_load_ready 조건에서 variability risk가 관찰되었습니다. 이 결과는 shared-memory ready source를 더 세분화해 검증할 필요를 만듭니다.",

    mitigation:
      "후속 shared_memory_ready_interference_probe에서 shared ready source를 no-conflict, bank-conflict, dependent shared chain 등으로 분리하고, raw run tail event를 함께 추적합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "ready warp supply는 개수뿐 아니라 ready source의 종류를 봐야 합니다.",
      "ready-side progress와 global-stalled progress를 분리해서 기록합니다.",
      "light/dependent ALU ready source는 global stalled steady-state를 크게 흔들지 않았습니다.",
      "shared_load_ready는 특정 low-progress transient를 만들 수 있으므로 추가 검증이 필요합니다.",
      "mean progress만 보지 말고 CV, min/max, raw run tail event를 함께 봅니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 ready source 종류가 ready-side signature를 크게 바꾸지만, global stalled steady-state progress는 대부분 유지된다는 점을 보여줍니다. 다만 shared_load_ready 조건에서 low-progress transient가 발생했으므로, 다음 실험에서는 shared memory ready source를 더 세분화해 global stalled variability의 원인을 분리합니다.",
    examples: [
      "shared_memory_ready_interference_probe에서는 shared memory ready source를 no-conflict, bank-conflict, dependent shared chain 등으로 분리합니다.",
      "composition_transient_probe에서는 shared-ready/global-stalled 조합에서 rare transient가 반복되는지 확인합니다.",
      "shared_memory_bank_conflict_probe에서는 shared access stride와 bank conflict가 ready-side 및 global-stalled variability에 미치는 영향을 확인합니다.",
    ],
  },

  nextStep: {
    label: "Shared Memory Ready Interference Probe",
    desc:
      "shared_load_ready 조건에서 global stalled variability가 증가했으므로, 다음 단계에서는 shared memory ready source의 종류를 세분화해 어떤 shared-memory pattern이 global stalled progress를 흔드는지 확인합니다.",
    configText:
      "ready_source = shared_no_conflict | shared_bank_conflict | shared_dependent_chain\nstalled_source = dependent_global_load\nmeasure global stalled mean/CV/tail events",
    metrics: [
      "shared ready source별 ready progress",
      "global stalled progress mean",
      "global stalled CV",
      "low-progress transient count",
      "bank conflict / dependent chain 여부",
    ],
  },

  previousObservationId: "latency_hiding_warmup_stability_probe",
  nextObservationId: "shared_memory_ready_interference_probe",
};