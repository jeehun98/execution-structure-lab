const latencyHidingRatioProbe = {
  id: "latency_hiding_ratio_probe",
  label: "Latency Hiding Ratio",
  title: "ready warp 비율에 따른 latency hiding signature 분석",
  description:
    "Global Memory Contention Amplification Probe에서 global memory progress signature가 ready warp supply와 address locality에 의해 크게 변형됨이 관찰된 이후, ready light_alu warp와 stalled dependent_global warp의 비율을 직접 바꿔 latency hiding 효과를 관찰한 후속 probe입니다. 이 실험은 global memory stall이 있을 때 ready warp가 빈 실행 기회를 얼마나 유지하는지, 그리고 stalled warp 비율이 증가할 때 progress signature가 어떤 regime으로 변하는지 확인합니다.",

  status: "observed",
  kind: "experiment",

  layer: "latency-analysis",
  order: 7,

  detailPath: "/hardware-evidence/latency_hiding_ratio_probe",

  graphSummary: {
    intro:
      "ready light_alu warp와 stalled dependent_global warp의 비율을 바꿔, memory stall 상황에서 ready warp가 얼마나 안정적으로 progress를 유지하는지 확인한 latency hiding 분석 실험입니다.",

    buildUp: [
      {
        id: "mixed_workload_probe",
        label: "Mixed Workload Probe",
        summary:
          "혼합 workload 조건에서 dependent_global_load가 낮은 progress와 높은 variability를 남긴다는 신호를 확인했습니다.",
      },
      {
        id: "global_memory_contention_amplification_probe",
        label: "Global Memory Contention Amplification",
        summary:
          "global memory signature가 단순 global-load warp 수보다 ready warp supply와 address locality에 의해 크게 변형됨을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 global memory signature 변형의 원인을 ready warp supply 관점에서 직접 분리하는 latency analysis 단계입니다. 이전 실험들이 ready warp supply의 영향을 시사했다면, 이 실험은 ready/stalled warp ratio를 직접 바꿔 그 효과를 확인합니다.",

    keyTakeaway:
      "핵심은 ready warp가 존재할 때 light_alu progress signature가 거의 유지된다는 점과, dependent_global_stalled progress가 3 stalled 이상부터 낮은 plateau로 전환된다는 점입니다. codegen 관점에서는 memory-heavy kernel의 비용을 global load 수만으로 보지 말고, ready warp supply와 stalled/ready ratio에 따른 latency hiding regime으로 해석해야 합니다.",

    nextQuestion:
      "이번 결과에서 초기 run과 특정 run의 global progress 변동이 관찰되었으므로, 다음 단계에서는 cache/TLB warm state, run ordering, pre-touch 여부가 global memory signature에 미치는 영향을 분리해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "ready light_alu warp는 stalled dependent_global warp가 증가해도 대부분의 조건에서 약 980~989 수준의 progress를 유지했습니다. 반면 dependent_global_stalled progress는 1~2 stalled 조건에서는 약 124~126 수준이었지만, 3 stalled 이상부터 약 78~83 수준의 낮은 plateau로 떨어졌습니다. 따라서 global memory latency는 단순히 개별 warp의 비용으로만 나타나는 것이 아니라, ready warp supply와 stalled warp ratio에 따라 서로 다른 progress regime을 형성합니다. codegen 관점에서는 memory-heavy kernel이 latency hiding을 유지하려면 단순히 warp 수를 늘리는 것보다 실제 ready work supply를 확보하는 것이 중요합니다.",

    metrics: [
      {
        label: "8 ready / 0 stalled",
        value: "989.320",
        note: "모든 warp가 light_alu_ready일 때의 기준 progress",
      },
      {
        label: "7 ready / 1 stalled",
        value: "ready 986.152 / global 124.156",
        note: "ready warp가 충분한 조건. 단일 global-stalled warp는 상대적으로 높은 progress와 큰 variability를 보임",
      },
      {
        label: "6 ready / 2 stalled",
        value: "ready 981.964 / global 126.312",
        note: "global progress가 여전히 상대적으로 높은 regime",
      },
      {
        label: "5 ready / 3 stalled",
        value: "ready 982.106 / global 83.240",
        note: "global progress가 낮은 plateau로 전환되는 지점",
      },
      {
        label: "4 ready / 4 stalled",
        value: "ready 980.641 / global 81.219",
        note: "balanced ready/stalled 조건에서도 ready progress는 유지됨",
      },
      {
        label: "3 ready / 5 stalled",
        value: "ready 980.958 / global 79.844",
        note: "global-stalled progress가 낮은 plateau에 머무름",
      },
      {
        label: "2 ready / 6 stalled",
        value: "ready 981.188 / global 79.667",
        note: "ready warp 수가 줄어도 light_alu progress는 크게 무너지지 않음",
      },
      {
        label: "1 ready / 7 stalled",
        value: "ready 981.438 / global 78.781",
        note: "ready warp가 1개만 남아도 light_alu progress는 유지됨",
      },
      {
        label: "0 ready / 8 stalled",
        value: "global 77.430",
        note: "모든 warp가 global memory dependency에 묶인 낮은 progress regime",
      },
      {
        label: "global transition",
        value: "2 stalled → 3 stalled",
        note: "global progress가 약 126에서 약 83으로 급락하는 전환점",
      },
    ],

    interpretation:
      "이 결과는 ready warp supply가 global memory stall 상황에서 중요한 역할을 한다는 점을 보여줍니다. ready light_alu warp는 stalled warp가 증가해도 issue 가능한 work를 제공하며, 그 progress signature는 크게 무너지지 않았습니다. 반면 dependent_global_stalled warp는 stalled warp가 3개 이상이 되는 순간 낮은 progress plateau로 이동했습니다. 이는 latency hiding이 단순히 warp 수가 많을수록 좋아지는 현상이 아니라, ready warp와 stalled warp의 비율에 따라 다른 실행 regime을 만든다는 뜻입니다.",

    caveat:
      "일부 run에서는 초기 global memory access 상태, cache/TLB warm state, clock64 boundary 효과로 보이는 큰 변동이 나타났습니다. 특히 1 stalled 조건과 0 ready / 8 stalled 조건에서 초기 또는 특정 run의 낮은 progress가 CV를 키웠습니다. 따라서 CV를 단순히 stalled warp 수의 단조 증가 지표로 해석하면 안 되며, mean progress regime과 raw run pattern을 함께 봐야 합니다.",
  },

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

  probingMeaning:
    "이 node는 global memory signature 변형의 원인을 ready warp supply 관점에서 직접 분리한 실험입니다. Mixed Workload Probe와 Global Memory Contention Amplification Probe가 global memory workload의 낮은 progress와 variability를 보여주었다면, 이 실험은 ready warp가 존재할 때 ALU progress가 유지되고, stalled warp 비율이 증가할 때 global progress가 낮은 plateau로 전환된다는 구조를 보여줍니다. codegen 관점에서는 memory-heavy kernel의 latency hiding capacity를 cost model에 명시적으로 반영해야 함을 보여주는 probe입니다.",

  relatedNodes: [
    {
      id: "global_memory_contention_amplification_probe",
      reason:
        "이전 실험에서 global memory progress가 단순 contention보다 ready warp supply와 address locality에 의해 크게 변형됨이 관찰되었기 때문에, ready/stalled warp ratio를 직접 분리해 검증함",
    },
    {
      id: "mixed_workload_probe",
      reason:
        "heterogeneous workload composition에서 dependent_global_load가 낮은 progress와 높은 variability를 보인 흐름을 이어받음",
    },
    {
      id: "latency_hiding",
      reason:
        "ready warp가 memory-stalled warp의 빈 issue 기회를 얼마나 채우는지 관찰함",
    },
    {
      id: "ready_warp_supply",
      reason:
        "scheduler가 선택할 수 있는 ready warp 공급량이 light_alu progress 유지와 global progress regime 전환에 영향을 주는 것으로 해석됨",
    },
    {
      id: "global_memory",
      reason:
        "dependent global memory chain을 stalled workload로 사용함",
    },
    {
      id: "warp",
      reason:
        "warp별 progress, ready/stalled role assignment, coefficient of variation을 측정 단위로 사용함",
    },
  ],

  connectsTo: [
    {
      id: "latency_hiding_warmup_stability_probe",
      type: "warmup-stability-analysis",
      label: "global variability → warmup stability",
    },
    
  ],
};

export default latencyHidingRatioProbe;