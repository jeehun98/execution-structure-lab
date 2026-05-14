const readyWarpSupplyProbe = {
  id: "ready_warp_supply_probe",
  label: "Ready Warp Supply",
  title: "ready warp 종류에 따른 latency hiding signature 분석",
  description:
    "Latency Hiding Ratio Probe와 Warmup Stability Probe 이후, global memory stalled warp와 함께 존재하는 ready warp의 종류를 바꿔 latency hiding signature가 어떻게 달라지는지 관찰한 후속 probe입니다. 이 실험은 ready warp의 수가 아니라 ready source의 성질이 global memory stall 조건에서 어떤 progress signature를 남기는지 확인합니다.",

  status: "observed",
  kind: "experiment",

  layer: "ready-source-analysis",
  order: 9,

  detailPath: "/hardware-evidence/ready_warp_supply_probe",

  graphSummary: {
    intro:
      "global memory stalled warp와 함께 존재하는 ready warp의 종류를 바꿔, ready source의 성질이 latency hiding signature에 어떤 영향을 주는지 확인한 실험입니다.",

    buildUp: [
      {
        id: "latency_hiding_ratio_probe",
        label: "Latency Hiding Ratio",
        summary:
          "ready/stalled warp 비율을 바꿔 ready light_alu progress는 유지되고, dependent_global_stalled progress는 stalled warp 비율에 따라 다른 regime을 만든다는 점을 확인했습니다.",
      },
      {
        id: "latency_hiding_warmup_stability_probe",
        label: "Latency Hiding Warmup Stability",
        summary:
          "초기 low progress가 steady-state scheduler behavior라기보다 cache/TLB warm state 또는 cold/evicted memory state에 민감한 transient signature임을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 latency hiding 분석을 ready warp의 양에서 ready warp source의 성질로 확장한 단계입니다. 이전 실험들이 ready warp supply의 존재와 warmup control의 필요성을 확인했다면, 이 실험은 ready source가 light_alu, dependent_alu, shared_load일 때 global stalled signature가 어떻게 달라지는지 봅니다.",

    keyTakeaway:
      "핵심은 ready warp의 종류가 ready-side progress signature에는 강하게 반영되지만, dependent_global_stalled의 steady-state progress는 대부분 74~75 근처로 유지되었다는 점입니다. 다만 shared_load_ready 조건에서만 특정 run의 low-progress transient로 global variability가 증가했습니다. codegen 관점에서는 ready source를 단순히 같은 filler work로 보지 말고, ready-side cost와 global-stalled variability risk를 분리해야 합니다.",

    nextQuestion:
      "shared_load_ready 조건에서 global stalled variability가 왜 커졌는지 분리해야 합니다. 다음 단계에서는 shared memory ready source를 no-conflict, bank-conflict, dependent shared chain 등으로 나눠 관찰하는 것이 적절합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "ready warp source의 종류는 ready warp 자신의 progress signature에는 강하게 반영되었습니다. light_alu_ready는 약 548, dependent_alu_ready는 약 530, shared_load_ready는 약 327 progress를 보였습니다. 그러나 4 ready / 4 dependent_global_stalled 조건에서 global stalled warp의 steady-state progress는 대부분 74~75 근처로 유지되었습니다. 다만 shared_load_ready 조건에서는 특정 run에서 global progress가 45~47 수준까지 떨어지는 transient가 발생해 평균이 낮아지고 CV가 증가했습니다. codegen 관점에서는 ready work의 종류를 동일한 latency-hiding 자원으로 취급하지 말고, ready-side throughput과 stalled-side 안정성을 분리해 cost model에 반영해야 합니다.",

    metrics: [
      {
        label: "light ALU ready",
        value: "ready 548.086 / global 74.977",
        note: "가장 높은 ready-side progress와 안정적인 global stalled progress",
      },
      {
        label: "dependent ALU ready",
        value: "ready 529.945 / global 74.828",
        note: "ready-side progress는 light_alu보다 낮지만 global stalled progress는 거의 유지",
      },
      {
        label: "shared load ready",
        value: "ready 326.758 / global 72.984",
        note: "shared_load ready 조건에서 global stalled variability 증가",
      },
      {
        label: "mixed ready sources",
        value: "548.812 / 531.000 / 327.625 / global 74.383",
        note: "ready role별 signature가 동시에 유지되며 global progress도 안정적",
      },
      {
        label: "all global stalled",
        value: "global 72.750",
        note: "ready warp supply가 없는 조건에서 global progress가 더 낮고 초기 transition이 나타남",
      },
      {
        label: "shared-load transient",
        value: "global min 45~47",
        note: "shared_load_ready 조건에서 특정 run의 low-progress transient 발생",
      },
    ],

    interpretation:
      "이 결과는 latency hiding에서 ready warp의 종류가 주로 ready-side progress signature를 결정한다는 점을 보여줍니다. light_alu_ready, dependent_alu_ready, mixed_ready_sources 조건에서는 dependent_global_stalled progress가 거의 74~75 근처로 유지되어, ready source 종류만으로 global stalled steady-state가 크게 바뀌지는 않았습니다. 반면 shared_load_ready 조건에서는 특정 run에서 global progress가 크게 낮아지는 transient가 나타나, shared memory ready source와 global memory stalled workload의 조합이 variability를 키울 수 있음을 시사합니다.",

    caveat:
      "이 실험은 pre-measurement global warmup을 포함했지만, shared_load_ready와 all_global_stalled 조건에서 여전히 일부 transient가 나타났습니다. 따라서 global progress의 평균만 보면 steady-state와 transient가 섞일 수 있습니다. 특히 shared_load_ready 조건의 낮은 global 평균은 지속적인 저하라기보다 특정 low-progress run의 영향이 큽니다.",
  },

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

  probingMeaning:
    "이 node는 latency hiding 분석을 ready warp 수에서 ready warp source의 성질로 확장한 실험입니다. 결과적으로 ready source 종류는 ready-side execution signature를 선명하게 바꾸지만, global stalled warp의 steady-state progress는 대부분 유지되었습니다. 다만 shared_load_ready 조건에서 global variability가 증가해, on-chip memory workload와 global memory stall의 조합을 별도 후속 실험으로 분리할 필요를 제공합니다. codegen 관점에서는 ready source quality와 shared-memory ready interference risk를 cost model에 분리해 반영해야 함을 보여줍니다.",

  relatedNodes: [
    {
      id: "latency_hiding_warmup_stability_probe",
      reason:
        "global memory warm state를 보정한 뒤 ready warp source의 차이를 분석함",
    },
    {
      id: "latency_hiding_ratio_probe",
      reason:
        "ready/stalled warp 비율이 progress regime을 바꾼다는 결과를 ready source 종류로 확장함",
    },
    {
      id: "mixed_workload_probe",
      reason:
        "혼합 workload 조건에서 role별 progress ordering이 유지된다는 흐름을 ready source 종류 비교로 확장함",
    },
    {
      id: "shared_memory",
      reason:
        "shared_load_ready 조건에서 global stalled variability가 증가하는 현상이 관찰됨",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_stalled workload를 latency hiding 대상 stall source로 사용함",
    },
    {
      id: "latency_hiding",
      reason:
        "ready warp source가 memory stall을 숨기는 과정에서 어떤 signature를 남기는지 해석함",
    },
    {
      id: "warp",
      reason:
        "warp별 progress, role assignment, coefficient of variation을 측정 단위로 사용함",
    },
  ],

  connectsTo: [
    {
      id: "shared_memory_ready_interference_probe",
      type: "shared-ready-interference",
      label: "shared ready transient → interference analysis",
    },
  ],
};

export default readyWarpSupplyProbe;