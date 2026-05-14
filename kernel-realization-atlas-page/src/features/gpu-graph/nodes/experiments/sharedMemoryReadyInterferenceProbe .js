const sharedMemoryReadyInterferenceProbe = {
  id: "shared_memory_ready_interference_probe",
  label: "Shared Memory Ready Interference",
  title: "shared memory ready source가 global stall signature에 미치는 영향",
  description:
    "Ready Warp Supply Probe에서 shared_load_ready 조건만 dependent_global_stalled의 variability를 크게 증가시킨 이후, shared memory ready source를 no-conflict, bank-conflict, dependent-chain 조건으로 분해해 어떤 shared memory access pattern이 global stalled warp의 progress signature를 흔드는지 확인한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "shared-memory-interference",
  order: 10,

  detailPath: "/hardware-evidence/shared_memory_ready_interference_probe",

  graphSummary: {
    intro:
      "Ready Warp Supply Probe에서 shared_load_ready 조건만 global stalled variability를 키운 이후, shared memory ready source를 access pattern별로 분해해 어떤 조건이 transient를 만드는지 확인한 실험입니다.",

    buildUp: [
      {
        id: "latency_hiding_ratio_probe",
        label: "Latency Hiding Ratio",
        summary:
          "ready/stalled warp 비율에 따라 ready light_alu progress는 유지되고, dependent_global_stalled progress는 다른 regime을 만든다는 점을 확인했습니다.",
      },
      {
        id: "latency_hiding_warmup_stability_probe",
        label: "Latency Hiding Warmup Stability",
        summary:
          "global progress의 초기 low sample이 steady-state behavior라기보다 cache/TLB warm state에 민감한 transient signature일 수 있음을 확인했습니다.",
      },
      {
        id: "ready_warp_supply_probe",
        label: "Ready Warp Supply",
        summary:
          "ready warp source의 종류는 ready-side progress를 크게 바꾸지만, global stalled steady-state는 대부분 유지되며 shared_load_ready 조건에서만 variability가 튀는 신호를 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 ready warp source 중 shared memory 계열을 더 세분화하는 interference 분석 단계입니다. 단순 shared_load_ready를 no-conflict, bank-conflict, dependent-chain으로 분해해 global stalled variability의 원인을 좁힙니다.",

    keyTakeaway:
      "핵심은 shared memory access 자체나 단순 bank conflict가 global variability를 크게 만든 것이 아니라, 4개의 ready warp가 모두 shared dependent-chain으로 구성된 조건에서 dependent_global_stalled의 low-progress transient가 발생했다는 점입니다. codegen 관점에서는 shared memory 사용 여부를 reuse만으로 판단하지 말고, shared dependency structure와 global-stalled role의 composition risk를 함께 봐야 합니다.",

    nextQuestion:
      "shared dependent-chain ready warp가 몇 개일 때 global transient가 발생하는지 확인해야 합니다. 다음 단계에서는 shared dependent-chain ready의 개수를 0~4개로 바꾸는 composition transient probe가 적절합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "shared memory ready source가 항상 dependent_global_stalled variability를 키우는 것은 아니었습니다. shared no-conflict ready와 shared bank-conflict ready 조건에서는 global stalled progress가 비교적 안정적으로 유지되었습니다. 반면 4개의 ready warp가 모두 shared dependent-chain일 때, 특정 run에서 dependent_global_stalled progress가 45~46 수준까지 떨어지는 transient가 발생했습니다. 따라서 이전 Ready Warp Supply Probe에서 관찰된 shared_load_ready variability는 단순 shared memory access나 bank conflict 때문이라기보다, shared dependent-chain ready source와 global memory stalled warp가 특정 composition으로 공존할 때 나타나는 transient interaction으로 해석할 수 있습니다. codegen 관점에서는 shared memory staging이나 shared-memory based ready work를 생성할 때, 단순 bank conflict뿐 아니라 dependency chain과 mixed-role composition tail risk를 같이 고려해야 합니다.",

    metrics: [
      {
        label: "light ready + global",
        value: "ready 546.688 / global 73.977",
        note: "비교 기준. global stalled progress가 안정적",
      },
      {
        label: "shared no-conflict + global",
        value: "ready 487.258 / global 73.727",
        note: "단순 shared load는 global stalled variability를 크게 키우지 않음",
      },
      {
        label: "shared bank-conflict + global",
        value: "ready 348.141 / global 70.094",
        note: "bank conflict는 shared ready progress와 global progress를 낮추지만 큰 transient는 만들지 않음",
      },
      {
        label: "shared dependent-chain + global",
        value: "ready 264.086 / global 72.008 / CV 0.0667",
        note: "특정 run에서 global progress가 45~46까지 떨어지는 transient 발생",
      },
      {
        label: "mixed shared ready + global",
        value: "487 / 348 / 264 / global 72.984",
        note: "shared ready source가 섞이면 global stalled variability가 다시 안정화됨",
      },
      {
        label: "all shared dependent-chain",
        value: "263.160",
        note: "shared dependent-chain workload 자체는 비교적 안정적",
      },
    ],

    interpretation:
      "이 결과는 shared memory ready source의 내부 access pattern이 ready-side progress signature를 강하게 바꾼다는 점을 보여줍니다. no-conflict, bank-conflict, dependent-chain 순으로 shared ready progress가 낮아졌습니다. 하지만 global stalled variability는 shared dependent-chain ready가 4개 모두 배치된 조건에서만 크게 증가했습니다. 따라서 global stalled variability의 원인은 단순 bank conflict가 아니라, shared dependent-chain ready source가 global memory stalled warp와 특정 비율로 공존할 때 나타나는 composition-level transient로 보는 것이 적절합니다.",

    caveat:
      "condition 3의 낮은 global progress는 지속적인 steady-state 저하가 아니라 특정 run에서 발생한 low-progress transient의 영향입니다. 또한 bank conflict 패턴은 GPU architecture의 shared memory bank mapping과 access granularity에 영향을 받기 때문에, 결과를 절대적인 shared memory 성능 수치로 해석하면 안 됩니다. 이 실험은 shared ready source가 global stalled progress signature를 어떻게 변형하는지에 대한 관찰입니다.",
  },

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

  probingMeaning:
    "이 node는 Ready Warp Supply Probe에서 관찰된 shared_load_ready의 global variability 증가 현상을 분해한 실험입니다. 결과적으로 단순 shared load나 bank conflict보다 shared dependent-chain ready source와 global stalled warp의 특정 혼합 composition이 transient variability를 만든다는 신호를 제공합니다. 이는 latency hiding이 ready warp 수나 ready workload 종류만으로 결정되지 않고, ready source의 dependency structure와 stalled workload의 조합에 의해 변형될 수 있음을 보여줍니다. codegen 관점에서는 shared memory 기반 kernel variant의 평균 비용뿐 아니라 composition-level tail risk를 평가해야 함을 보여주는 interference node입니다.",

  relatedNodes: [
    {
      id: "ready_warp_supply_probe",
      reason:
        "이전 실험에서 shared_load_ready 조건만 dependent_global_stalled variability가 크게 증가했기 때문에, 그 원인을 shared access pattern별로 분해함",
    },
    {
      id: "shared_memory",
      reason:
        "shared no-conflict, bank-conflict, dependent-chain access pattern을 ready source로 사용함",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_stalled workload와 shared ready source의 상호작용을 관찰함",
    },
    {
      id: "latency_hiding",
      reason:
        "ready source의 dependency structure가 global memory stall hiding signature에 미치는 영향을 분석함",
    },
    {
      id: "ready_warp_supply",
      reason:
        "ready warp의 수뿐 아니라 ready source의 내부 dependency structure가 중요하다는 흐름을 확장함",
    },
    {
      id: "warp",
      reason:
        "warp별 progress, role assignment, run-to-run variability를 측정 단위로 사용함",
    },
  ],

  connectsTo: [
    {
      id: "composition_transient_probe",
      type: "composition-transient-analysis",
      label: "shared dependent-chain mix → transient analysis",
    },
  ],
};

export default sharedMemoryReadyInterferenceProbe;