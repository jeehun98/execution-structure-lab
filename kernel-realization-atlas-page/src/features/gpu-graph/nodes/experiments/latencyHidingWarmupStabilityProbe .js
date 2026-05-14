const latencyHidingWarmupStabilityProbe = {
  id: "latency_hiding_warmup_stability_probe",
  label: "Latency Hiding Warmup Stability",
  title: "global memory warm state에 따른 latency hiding signature 안정성 검증",
  description:
    "Latency Hiding Ratio Probe에서 dependent_global_stalled warp가 초기 run에서 낮은 progress를 보인 뒤 plateau로 수렴하는 현상이 관찰된 이후, 이 변동이 cache/TLB warm state, buffer pre-touch, eviction, reinitialization, measured-after-global-chain-warmup 조건에 의해 어떻게 달라지는지 확인한 안정성 검증 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "stability-validation",
  order: 8,

  detailPath: "/hardware-evidence/latency_hiding_warmup_stability_probe",

  graphSummary: {
    intro:
      "Latency Hiding Ratio Probe에서 관찰된 dependent_global_stalled의 초기 low progress가 steady-state latency hiding 현상인지, memory hierarchy warm/cold state에 따른 transient signature인지 확인한 안정성 검증 실험입니다.",

    buildUp: [
      {
        id: "global_memory_contention_amplification_probe",
        label: "Global Memory Contention Amplification",
        summary:
          "global memory signature가 단순 global-load warp 수보다 ready warp supply와 address locality에 의해 크게 변형됨을 확인했습니다.",
      },
      {
        id: "latency_hiding_ratio_probe",
        label: "Latency Hiding Ratio",
        summary:
          "ready/stalled warp 비율을 바꿔 ready light_alu progress는 유지되고, dependent_global_stalled progress는 낮은 plateau로 전환되는 구조를 관찰했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 latency hiding 계열 실험의 해석을 안정화하는 validation 단계입니다. 이전 실험에서 보인 global progress variability가 scheduler behavior 자체인지, cache/TLB warm state와 measurement ordering에 의한 artifact인지 분리합니다.",

    keyTakeaway:
      "핵심은 dependent_global_stalled의 낮은 progress sample이 eviction 조건에서 재현되고, reuse/reinitialize/measured-after-global-chain-warmup 조건에서는 약 81~82 수준으로 안정화된다는 점입니다. codegen 관점에서는 cold-state/transient cost와 steady-state cost를 분리해야 합니다.",

    nextQuestion:
      "이후 ready warp supply 계열 실험에서는 measured-after-global-chain-warmup 조건을 기본 control로 넣고, ready warp의 종류를 light_alu, dependent_alu, shared_load 등으로 바꿔 latency hiding source의 차이를 비교해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "dependent_global_stalled progress는 reuse, reinitialize, measured-after-global-chain-warmup 조건에서 약 81~82 수준으로 안정화되었습니다. 반면 eviction-before-each-run 조건에서는 약 49~50 수준으로 낮아졌습니다. 따라서 이전 latency hiding ratio 실험에서 관찰된 초기 low progress는 steady-state scheduler behavior라기보다 cache/TLB warm state 또는 memory hierarchy cold state에 민감한 transient signature로 해석하는 것이 적절합니다. codegen 관점에서는 memory-heavy kernel의 cost model에서 cold-start/transient cost와 steady-state cost를 분리해야 합니다.",

    metrics: [
      {
        label: "reuse without pretouch",
        value: "global 81.719",
        note: "기본 반복 조건에서 global progress가 안정적 plateau를 형성",
      },
      {
        label: "pretouch before each run",
        value: "global 80.625 / CV 0.071",
        note: "첫 run에서 낮은 progress가 발생해 variability 증가",
      },
      {
        label: "evict before each run",
        value: "global 49.547",
        note: "eviction 조건에서 global progress가 명확히 낮은 cold-state signature로 이동",
      },
      {
        label: "reinitialize before each run",
        value: "global 81.719",
        note: "buffer 재초기화 자체는 global progress를 불안정하게 만들지 않음",
      },
      {
        label: "measured after global-chain warmup",
        value: "global 81.734",
        note: "동일 global-chain warmup 이후 steady-state plateau가 유지됨",
      },
      {
        label: "light ALU stability",
        value: "979~987",
        note: "모든 조건에서 ready light_alu progress는 크게 무너지지 않음",
      },
    ],

    interpretation:
      "이 결과는 global memory dependent workload의 progress signature가 cache/TLB warm state와 measurement ordering에 민감하다는 점을 보여줍니다. eviction을 매 run 앞에 넣으면 global progress가 약 49~50으로 낮아지는 반면, reuse, reinitialize, measured-after-global-chain-warmup 조건에서는 약 81~82 수준으로 안정화됩니다. 따라서 latency hiding 계열 실험에서는 raw run의 초기 low sample을 steady-state behavior로 바로 해석하면 안 됩니다.",

    caveat:
      "pretouch 조건은 예상과 달리 첫 run에서 낮은 global progress를 만들었습니다. 이는 단순한 선형 buffer touch가 dependent address chain의 실제 warm state와 동일하지 않거나, pretouch kernel 자체가 cache/TLB 상태를 다르게 교란했을 가능성을 남깁니다. 또한 eviction과 pretouch는 GPU cache/TLB 상태를 간접적으로 조작하는 방식이므로, 결과는 직접 증명이 아니라 warm/cold state에 따른 progress signature 변형 관찰로 해석해야 합니다.",
  },

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

  probingMeaning:
    "이 node는 latency hiding 계열 실험에서 관찰된 run-to-run variability가 steady-state scheduler behavior인지, memory hierarchy warm/cold artifact인지 분리하기 위한 안정성 검증 probe입니다. 결과적으로 dependent_global_stalled의 낮은 progress sample은 eviction 조건에서 재현되고, measured-after-global-chain-warmup 조건에서 안정화되어, 이후 latency hiding 분석에서 warmup/control 조건이 필요함을 보여줍니다. codegen 관점에서는 memory-dependent kernel의 steady-state cost와 cold/transient penalty를 분리해야 함을 보여주는 calibration node입니다.",

  relatedNodes: [
    {
      id: "latency_hiding_ratio_probe",
      reason:
        "이전 실험에서 dependent_global_stalled warp가 초기 run에서 낮은 progress를 보인 뒤 plateau로 수렴하는 현상이 관찰되었고, 이를 warm state 관점에서 검증함",
    },
    {
      id: "global_memory_contention_amplification_probe",
      reason:
        "global memory progress가 address locality와 ready warp supply에 의해 변형됨을 보인 선행 실험",
    },
    {
      id: "latency_hiding",
      reason:
        "latency hiding 해석에서 steady-state progress와 warmup artifact를 분리함",
    },
    {
      id: "cache_locality",
      reason:
        "eviction, pretouch, measured-after-warmup 조건을 통해 memory hierarchy warm/cold state가 progress signature에 미치는 영향을 관찰함",
    },
    {
      id: "global_memory",
      reason:
        "dependent global memory chain의 progress가 eviction 조건에서 낮은 cold-state signature로 이동함",
    },
    {
      id: "ready_warp_supply",
      reason:
        "다음 ready warp supply 실험에서 warmup/control 조건을 기본값으로 삼아야 하는 근거를 제공함",
    },
  ],

  connectsTo: [
    {
      id: "ready_warp_supply_probe",
      type: "ready-source-analysis",
      label: "warmup-controlled → ready source variants",
    },
    {
      id: "cache_locality",
      type: "memory-warm-state-signal",
      label: "eviction effect → cache/TLB warm state",
    },
  ],
};

export default latencyHidingWarmupStabilityProbe;