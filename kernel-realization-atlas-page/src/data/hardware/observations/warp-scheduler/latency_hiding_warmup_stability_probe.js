export const latencyHidingWarmupStabilityProbeObservation = {
  id: "latency_hiding_warmup_stability_probe",
  groupLabel: "Warp Scheduling",
  type: "Warmup Stability Validation",
  label: "Latency hiding warmup stability",
  title: "global memory warm/cold state가 바꾸는 latency hiding signature",

  summary:
    "Latency Hiding Ratio Probe에서 dependent_global_stalled warp가 초기 run에서 낮은 progress를 보인 뒤 plateau로 수렴하는 현상이 관찰된 이후, 이 변동이 cache/TLB warm state, buffer pre-touch, eviction, reinitialization, measured-after-global-chain-warmup 조건에 의해 어떻게 달라지는지 확인한 안정성 검증 probe입니다.",

  keyFindings: [
    {
      label: "Steady Plateau",
      value: "≈ 81~82",
      desc: "reuse/reinitialize/warmup 조건의 global progress",
    },
    {
      label: "Eviction",
      value: "49.547",
      desc: "evict-before-each-run의 cold-state signature",
    },
    {
      label: "Pretouch CV",
      value: "0.071",
      desc: "첫 run low sample로 variability 증가",
    },
    {
      label: "Codegen Use",
      value: "warm/cold split",
      desc: "steady-state cost와 transient penalty 분리",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 latency hiding ratio 실험에서 보인 초기 low global progress가 steady-state latency hiding behavior인지, cache/TLB warm state 또는 memory hierarchy cold state에 따른 transient signature인지 분리합니다. reuse, pretouch, eviction, reinitialize, measured-after-global-chain-warmup 조건을 비교합니다.",
    question:
      "dependent_global_stalled의 초기 low progress는 steady-state 현상인가, 아니면 memory hierarchy warm/cold state에 따른 transient signature인가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Warm/cold memory state",
        text:
          "global memory dependent workload는 cache/TLB state, prior access pattern, eviction 여부에 따라 관찰 progress가 달라질 수 있습니다.",
      },
      {
        label: "Eviction sensitivity",
        text:
          "eviction buffer를 사용해 매 run 전 memory hierarchy를 교란하면 dependent global chain의 progress가 cold-state signature로 이동할 수 있습니다.",
      },
      {
        label: "Pretouch is not always warmup",
        text:
          "단순 선형 buffer touch는 dependent address chain이 실제로 사용하는 access path와 같지 않을 수 있습니다. pretouch kernel 자체가 cache/TLB state를 다르게 교란할 가능성도 있습니다.",
      },
      {
        label: "Steady-state cost",
        text:
          "probe-derived cost model에는 초기 transient sample과 반복 안정화 이후의 steady-state sample을 분리해서 기록해야 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "특정 cache level 또는 TLB hit/miss를 직접 증명했다는 주장",
    "eviction buffer가 모든 cache/TLB 상태를 완전히 초기화한다는 주장",
    "pretouch가 항상 memory warmup을 보장한다는 주장",
    "모든 GPU와 모든 memory access pattern에서 같은 수치가 나온다는 주장",
    "초기 low progress가 오직 cache/TLB state 때문이라는 단정",
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
    evictionBufferSize: 8_388_608,
    readyWarpCount: 4,
    stalledWarpCount: 4,
  },

  roleMap: {
    0: "light_alu_ready",
    1: "dependent_global_stalled",
  },

  conditionMap: {
    0: "reuse_without_pretouch",
    1: "pretouch_before_each_run",
    2: "evict_before_each_run",
    3: "reinitialize_before_each_run",
    4: "measured_after_global_chain_warmup",
  },

  roleAggregateStats: [
    {
      conditionId: 0,
      conditionName: "reuse_without_pretouch",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 979.57,
      variance: 0.00750732,
      stddev: 0.0866448,
      coefficientOfVariation: 0.000513614,
      minProgress: 979,
      maxProgress: 981,
    },
    {
      conditionId: 0,
      conditionName: "reuse_without_pretouch",
      roleId: 1,
      roleName: "dependent_global_stalled",
      meanProgress: 81.7188,
      variance: 0.0561523,
      stddev: 0.236965,
      coefficientOfVariation: 0.00413578,
      minProgress: 80,
      maxProgress: 82,
    },
    {
      conditionId: 1,
      conditionName: "pretouch_before_each_run",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 979.781,
      variance: 0.00927734,
      stddev: 0.096319,
      coefficientOfVariation: 0.001411,
      minProgress: 979,
      maxProgress: 987,
    },
    {
      conditionId: 1,
      conditionName: "pretouch_before_each_run",
      roleId: 1,
      roleName: "dependent_global_stalled",
      meanProgress: 80.625,
      variance: 0.0981445,
      stddev: 0.31328,
      coefficientOfVariation: 0.0711417,
      minProgress: 48,
      maxProgress: 82,
    },
    {
      conditionId: 2,
      conditionName: "evict_before_each_run",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 987.062,
      variance: 0.00439453,
      stddev: 0.0662913,
      coefficientOfVariation: 0.000428004,
      minProgress: 986,
      maxProgress: 988,
    },
    {
      conditionId: 2,
      conditionName: "evict_before_each_run",
      roleId: 1,
      roleName: "dependent_global_stalled",
      meanProgress: 49.5469,
      variance: 0.0202637,
      stddev: 0.142351,
      coefficientOfVariation: 0.0119512,
      minProgress: 48,
      maxProgress: 51,
    },
    {
      conditionId: 3,
      conditionName: "reinitialize_before_each_run",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 979.516,
      variance: 0.00805664,
      stddev: 0.0897588,
      coefficientOfVariation: 0.000517181,
      minProgress: 979,
      maxProgress: 981,
    },
    {
      conditionId: 3,
      conditionName: "reinitialize_before_each_run",
      roleId: 1,
      roleName: "dependent_global_stalled",
      meanProgress: 81.7188,
      variance: 0.0795898,
      stddev: 0.282117,
      coefficientOfVariation: 0.00303961,
      minProgress: 81,
      maxProgress: 82,
    },
    {
      conditionId: 4,
      conditionName: "measured_after_global_chain_warmup",
      roleId: 0,
      roleName: "light_alu_ready",
      meanProgress: 979.508,
      variance: 0.00360107,
      stddev: 0.060009,
      coefficientOfVariation: 0.000506697,
      minProgress: 979,
      maxProgress: 980,
    },
    {
      conditionId: 4,
      conditionName: "measured_after_global_chain_warmup",
      roleId: 1,
      roleName: "dependent_global_stalled",
      meanProgress: 81.7344,
      variance: 0.0412598,
      stddev: 0.203125,
      coefficientOfVariation: 0.00567149,
      minProgress: 77,
      maxProgress: 82,
    },
  ],

  records: [
    {
      block: 0,
      warpId: 4,
      role: "reuse_without_pretouch_global",
      progress: 81.719,
      lastClock: null,
      sink: null,
      signature:
        "reuse 조건에서 dependent_global_stalled가 약 81~82 plateau로 안정화된 steady-state signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "pretouch_before_each_run_global",
      progress: 80.625,
      lastClock: null,
      sink: null,
      signature:
        "pretouch 조건에서 평균은 80~81 수준이지만 첫 run low sample로 CV가 증가한 signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "evict_before_each_run_global",
      progress: 49.547,
      lastClock: null,
      sink: null,
      signature:
        "eviction 조건에서 dependent_global_stalled가 약 49~50으로 낮아진 cold-state signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "reinitialize_before_each_run_global",
      progress: 81.719,
      lastClock: null,
      sink: null,
      signature:
        "buffer reinitialize 자체는 global progress를 불안정하게 만들지 않은 signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "measured_after_global_chain_warmup",
      progress: 81.734,
      lastClock: null,
      sink: null,
      signature:
        "global-chain warmup 이후 측정한 안정적인 steady-state global memory signature",
    },
    {
      block: 0,
      warpId: 0,
      role: "light_alu_ready_stability",
      progress: 979.5,
      lastClock: null,
      sink: null,
      signature:
        "모든 조건에서 크게 무너지지 않은 ready light_alu progress signature",
    },
  ],

  ordering: [
    "reuse_without_pretouch_global",
    "reinitialize_before_each_run_global",
    "measured_after_global_chain_warmup",
    "pretouch_before_each_run_global",
    "evict_before_each_run_global",
  ],

  ratios: {
    warmupVsEviction: 1.65,
    reuseVsEviction: 1.65,
    reinitializeVsEviction: 1.65,
    pretouchVsEviction: 1.63,
    lightReadyVsEvictedGlobal: 19.92,
  },

  warpConditionStatsHighlights: [
    {
      conditionId: 1,
      conditionName: "pretouch_before_each_run",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 80.9375,
      coefficientOfVariation: 0.0709038,
      minProgress: 49,
      maxProgress: 82,
    },
    {
      conditionId: 2,
      conditionName: "evict_before_each_run",
      warpId: 4,
      roleName: "dependent_global_stalled",
      meanProgress: 49.5312,
      coefficientOfVariation: 0.0112685,
      minProgress: 49,
      maxProgress: 51,
    },
    {
      conditionId: 4,
      conditionName: "measured_after_global_chain_warmup",
      warpId: 5,
      roleName: "dependent_global_stalled",
      meanProgress: 81.8438,
      coefficientOfVariation: 0.0106296,
      minProgress: 77,
      maxProgress: 82,
    },
  ],

  interpretation: [
    "dependent_global_stalled progress는 reuse_without_pretouch 조건에서 약 81.719로 안정화되었습니다.",
    "reinitialize_before_each_run 조건에서도 global progress는 약 81.719로 유지되어, buffer 재초기화 자체가 progress를 불안정하게 만들지는 않았습니다.",
    "measured_after_global_chain_warmup 조건에서도 약 81.734로 안정적인 plateau가 유지되었습니다.",
    "evict_before_each_run 조건에서는 global progress가 약 49.547로 낮아져 cold-state signature가 명확히 재현되었습니다.",
    "pretouch_before_each_run 조건은 평균은 약 80.625였지만 첫 run에서 낮은 sample이 발생해 CV가 크게 증가했습니다.",
    "따라서 이전 latency hiding ratio probe의 초기 low progress는 steady-state scheduler behavior라기보다 memory hierarchy warm/cold state에 민감한 transient signature로 해석하는 것이 안전합니다.",
    "codegen 관점에서는 memory-heavy kernel의 cost를 steady-state cost와 cold/transient penalty로 분리해야 합니다.",
  ],

  caveats: [
    "eviction, pretouch, warmup은 cache/TLB state를 간접적으로 조작하는 방식입니다.",
    "이 결과만으로 특정 cache level이나 TLB hit/miss를 직접 증명할 수는 없습니다.",
    "pretouch가 예상과 달리 첫 run low sample을 만들었으므로, pretouch가 항상 warmup을 보장한다고 해석하면 안 됩니다.",
    "synthetic dependent global memory chain 기반 실험입니다.",
    "단일 block, 8 warps/block, 고정 launch shape 조건에서의 결과입니다.",
  ],

  codegenImpact: {
    targetPattern:
      "memory_latency_bound_kernel / global_load_chain / cache_state_sensitive_kernel / benchmark_calibration",

    affectedDecision:
      "steady_state_cost_model / cold_start_penalty / benchmark_protocol / kernel_variant_validation / warmup_policy",

    costSignal:
      "reuse, reinitialize, measured-after-global-chain-warmup 조건에서는 dependent_global_stalled progress가 약 81~82 수준으로 안정화되었습니다. 반면 evict-before-each-run 조건에서는 약 49~50 수준으로 낮아졌습니다. 따라서 global memory progress는 steady-state latency hiding behavior와 cold-state transient가 분리되어야 합니다.",

    ruleCandidate:
      "memory-heavy kernel variant를 평가할 때 cold-start/transient cost와 steady-state cost를 분리합니다. codegen cost model에는 warm-state steady cost를 기본으로 사용하되, cold cache/TLB 또는 dispersed access에 민감한 pattern에는 transient penalty를 별도로 부여합니다. benchmark calibration에서는 measured-after-global-chain-warmup 같은 control 조건을 사용해 초기 low sample을 steady-state cost로 오해하지 않도록 합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "초기 low progress를 곧바로 steady-state memory cost로 쓰면 안 됩니다. memory-heavy kernel cost model은 warm/cold state와 measurement protocol을 분리해야 합니다.",
  },

  costModelRole: {
    role: "warmup_state_calibration",

    description:
      "이 probe는 latency hiding ratio 실험에서 보인 초기 low global progress가 steady-state behavior인지 memory hierarchy warm/cold artifact인지 분리합니다. 결과적으로 probe-derived cost model에는 steady-state cost와 cold/transient penalty를 나누는 calibration layer가 필요함을 보여줍니다.",

    usedBy: [
      "ready_warp_supply_probe",
      "shared_memory_ready_interference_probe",
      "composition_transient_probe",
      "benchmark_protocol",
    ],
  },

  measurementReliability: {
    status: "warmup_effect_observed",

    issue:
      "eviction, pretouch, warmup은 GPU cache/TLB 상태를 간접적으로 조작하는 방식입니다. 따라서 특정 cache level이나 TLB hit/miss를 직접 증명한 것은 아닙니다.",

    impact:
      "latency hiding ratio probe에서 관찰된 초기 low global progress를 steady-state scheduler behavior로 해석하지 않도록 기준을 제공합니다. 이후 global memory 계열 probe는 warmup/control 조건을 명시해야 합니다.",

    mitigation:
      "후속 실험에서는 measured-after-global-chain-warmup을 control로 사용하고, 필요하면 Nsight Compute의 cache hit/miss, memory throughput, stall reason 지표로 보강합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "memory-heavy kernel의 cost는 cold-start와 steady-state를 분리해서 기록합니다.",
      "초기 low progress sample을 곧바로 kernel steady-state cost로 쓰지 않습니다.",
      "benchmark와 probe에는 warmup/control 조건을 명시합니다.",
      "eviction 조건에서 낮은 progress가 재현되면 cold-state penalty 후보로 기록합니다.",
      "pretouch가 실제 dependent access chain의 warm state와 동일하다고 가정하면 안 됩니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 latency hiding ratio에서 보인 global progress variability를 warm/cold state 관점에서 분리합니다. 이후 ready warp supply 실험에서는 measured-after-global-chain-warmup 조건을 기본 control로 사용하고, ready source의 종류가 latency hiding에 미치는 영향을 비교합니다.",
    examples: [
      "ready_warp_supply_probe에서는 warmup-controlled 상태에서 ready source의 종류를 바꿉니다.",
      "shared_memory_ready_interference_probe에서는 shared-memory ready source가 global-stalled role에 미치는 영향을 비교합니다.",
      "composition_transient_probe에서는 rare low-progress event가 warm/cold state와 별개로 composition에 의해 발생하는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Ready Warp Supply Probe",
    desc:
      "warmup/control 조건을 정리했으므로, 다음 단계에서는 ready warp의 수뿐 아니라 ready work의 종류가 latency hiding source로 얼마나 효과적인지 비교합니다.",
    configText:
      "control = measured_after_global_chain_warmup\nready_source = light_alu | dependent_alu | shared_load | shared_dependent_chain\nmeasure ready progress and global stalled progress",
    metrics: [
      "ready source별 progress",
      "global stalled progress 유지 여부",
      "ready source quality",
      "global progress CV",
    ],
  },

  previousObservationId: "latency_hiding_ratio_probe",
  nextObservationId: "ready_warp_supply_probe",
};