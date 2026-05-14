const compositionTransientProbe = {
  id: "composition_transient_probe",
  label: "Composition Transient Probe",
  title: "ready-source composition이 만드는 global stall transient risk",
  description:
    "Shared Memory Ready Interference Probe에서 shared_dependent_chain_ready와 dependent_global_stalled가 공존할 때 global progress transient가 발생한 이후, shared dependent-chain ready warp의 수를 0개부터 4개까지 바꿔 어떤 ready-source composition에서 transient가 발생하는지 확인한 후속 probe입니다. 이 실험은 shared-chain ready warp 개수 자체보다 ready-source composition의 비대칭성과 run-phase interaction이 global stalled progress에 어떤 tail risk를 만드는지 분석합니다.",

  status: "observed",
  kind: "experiment",

  layer: "composition-transient-analysis",
  order: 11,

  detailPath: "/hardware-evidence/composition_transient_probe",

  graphSummary: {
    intro:
      "shared dependent-chain ready warp의 수를 0개부터 4개까지 바꿔, 어떤 ready-source composition에서 dependent_global_stalled의 low-progress transient가 발생하는지 확인한 실험입니다.",

    buildUp: [
      {
        id: "ready_warp_supply_probe",
        label: "Ready Warp Supply",
        summary:
          "ready source 종류는 ready-side signature를 바꾸지만, shared_load_ready 조건에서 global stalled variability가 튀는 신호를 확인했습니다.",
      },
      {
        id: "shared_memory_ready_interference_probe",
        label: "Shared Memory Ready Interference",
        summary:
          "shared memory ready source를 no-conflict, bank-conflict, dependent-chain으로 분해했고, shared dependent-chain ready와 global stalled 조합에서 transient가 나타남을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 shared dependent-chain ready source가 몇 개 있을 때 global stalled transient가 발생하는지 확인하는 composition-level 분석 단계입니다. ready source 종류를 넘어, ready source의 비율과 비대칭성이 progress signature를 어떻게 바꾸는지 봅니다.",

    keyTakeaway:
      "핵심은 transient가 shared-chain ready warp 수에 단조적으로 비례하지 않았다는 점입니다. 2 shared-chain + 2 light와 4 shared-chain + 0 light 조건은 안정적이었고, 3 shared-chain + 1 light 조건에서 가장 강한 transient가 발생했습니다. 따라서 문제는 shared-chain ready warp 개수 자체가 아니라 ready-source composition의 비대칭성과 run-phase interaction입니다.",

    nextQuestion:
      "이 transient가 특정 run phase에서 반복 재현되는 현상인지, role placement나 condition 실행 순서에 의존하는 artifact인지 검증해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "dependent_global_stalled의 low-progress transient는 shared_dependent_chain_ready warp 수에 단조적으로 비례하지 않았습니다. 2 shared-chain + 2 light 조건은 global progress가 76으로 완전히 안정적이었고, 4 shared-chain + 0 light 조건도 75~76 수준으로 안정적이었습니다. 반면 3 shared-chain + 1 light 조건에서는 특정 run에서 global progress가 45~47까지 떨어지는 강한 transient가 발생했습니다. 따라서 global stalled variability는 shared-chain ready warp의 절대 개수보다, shared-chain과 light ready source가 만드는 비대칭 composition 및 run-phase interaction에 의해 유도되는 것으로 해석됩니다. codegen 관점에서는 shared-dependent-chain 개수만으로 penalty를 주면 안 되며, composition pattern과 tail event를 함께 봐야 합니다.",

    metrics: [
      {
        label: "0 shared-chain + 4 light + 4 global",
        value: "global 76.156 / CV 0.0039",
        note: "light ready 기준선. global stalled progress가 안정적",
      },
      {
        label: "1 shared-chain + 3 light + 4 global",
        value: "global 75.724 / CV 0.0229 / min 63",
        note: "약한 low-progress transient 발생",
      },
      {
        label: "2 shared-chain + 2 light + 4 global",
        value: "global 76.000 / CV 0",
        note: "가장 안정적인 balanced composition",
      },
      {
        label: "3 shared-chain + 1 light + 4 global",
        value: "global 75.266 / CV 0.0567 / min 45",
        note: "가장 강한 low-progress transient 발생",
      },
      {
        label: "4 shared-chain + 0 light + 4 global",
        value: "global 75.891 / CV 0.0031",
        note: "모든 ready warp가 shared-chain이어도 안정적",
      },
      {
        label: "all shared dependent-chain",
        value: "shared 296.755 / CV 0.0022",
        note: "shared dependent-chain workload 자체는 안정적",
      },
      {
        label: "all global stalled",
        value: "global 74.641 / CV 0.0258 / min 61",
        note: "ready warp가 없는 조건에서 초기 warm transition이 드러남",
      },
    ],

    interpretation:
      "이 결과는 transient가 shared_dependent_chain_ready의 단순 개수 증가로 설명되지 않음을 보여줍니다. 1 shared-chain 조건에서는 약한 transient가, 3 shared-chain 조건에서는 강한 transient가 나타났지만, 2 shared-chain과 4 shared-chain 조건은 안정적이었습니다. 따라서 global stalled variability는 ready source composition의 균형, role 비대칭성, run ordering 또는 scheduling phase가 결합되어 나타나는 composition-level transient로 보는 것이 적절합니다.",

    caveat:
      "condition 3의 낮은 global progress는 지속적인 steady-state 저하가 아니라 특정 run에서 발생한 transient입니다. 또한 pre-measurement global warmup을 넣었음에도 중간 run에서 transient가 발생했기 때문에 단순 초기 warmup artifact로만 설명하기 어렵습니다. 다만 단일 block synthetic workload 조건이므로, 일반적인 scheduler 정책으로 직접 일반화하기보다는 composition에 따른 warp-level progress signature 변형으로 해석해야 합니다.",
  },

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

  probingMeaning:
    "이 node는 shared dependent-chain ready source와 global stalled warp의 혼합 composition에서 발생하는 transient를 정량적으로 분해한 실험입니다. 결과적으로 latency hiding signature는 ready warp 수나 ready source 종류만으로 결정되지 않고, ready source composition의 비대칭성과 run-phase interaction에 의해 변형될 수 있음을 보여줍니다. codegen 관점에서는 shared-memory-based mixed-role kernel의 평균 비용뿐 아니라 composition-level tail risk를 평가해야 함을 보여주는 node입니다.",

  relatedNodes: [
    {
      id: "shared_memory_ready_interference_probe",
      reason:
        "이전 실험에서 shared_dependent_chain_ready와 dependent_global_stalled 조합에서 low-progress transient가 관찰되었고, 이를 shared-chain ready 개수별 composition으로 분해함",
    },
    {
      id: "ready_warp_supply_probe",
      reason:
        "ready source 종류가 global stalled steady-state에는 큰 영향을 주지 않았지만 shared_load 계열에서 transient가 관찰됨",
    },
    {
      id: "latency_hiding_warmup_stability_probe",
      reason:
        "pre-measurement warmup을 반영한 상태에서도 중간 run transient가 발생해 warmup artifact와 composition transient를 구분할 필요가 있음",
    },
    {
      id: "latency_hiding",
      reason:
        "ready source composition이 global memory stall hiding signature에 미치는 영향을 분석함",
    },
    {
      id: "shared_memory",
      reason:
        "shared dependent-chain workload를 ready source로 사용함",
    },
    {
      id: "global_memory",
      reason:
        "dependent global memory chain을 stalled workload로 사용함",
    },
    {
      id: "warp",
      reason:
        "warp별 progress, role assignment, run-to-run variability를 측정 단위로 사용함",
    },
  ],

  connectsTo: [
    {
      id: "composition_phase_repeatability_probe",
      type: "phase-repeatability-analysis",
      label: "composition transient → phase repeatability",
    },
    {
      id: "latency_hiding",
      type: "refines",
      label: "composition asymmetry → latency hiding signature",
    },
  ],
};

export default compositionTransientProbe;