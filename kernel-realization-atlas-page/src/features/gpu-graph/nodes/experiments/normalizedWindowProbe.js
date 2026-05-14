const normalizedWindowProbe = {
  id: "normalized_window_probe",
  label: "Normalized Window Probe",
  title: "cycle budget 정규화에 따른 transient event 검증",
  description:
    "Scheduler Phase Probe에서 cycle budget을 50k/100k/200k로 바꿨지만 transient threshold를 고정해 비교가 깨진 이후, cycle budget에 비례한 scaled threshold와 normalized progress를 사용해 관측 window 길이에 따른 global stalled transient를 다시 검증한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "window-normalization",
  order: 14,

  detailPath: "/hardware-evidence/normalized_window_probe",

  graphSummary: {
    intro:
      "cycle budget에 비례한 scaled threshold와 normalized progress를 사용해, 이전 Scheduler Phase Probe의 fixed threshold artifact를 제거하고 관측 window 길이에 따른 transient 여부를 다시 확인한 실험입니다.",

    buildUp: [
      {
        id: "scheduler_phase_probe",
        label: "Scheduler Phase Probe",
        summary:
          "block 수와 dummy kernel 삽입에 따라 transient가 증폭되거나 이동하는 grid-level phase event 신호를 확인했지만, cycle budget 조건에서는 fixed threshold 문제가 남았습니다.",
      },
      {
        id: "composition_phase_repeatability_probe",
        label: "Composition Phase Repeatability",
        summary:
          "3 shared-chain + 1 light + 4 global composition의 low-progress transient가 단발성 artifact가 아니라 희박하게 반복되는 placement-sensitive event임을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 transient event 분석에서 observation window와 threshold artifact를 분리하는 normalization 단계입니다. raw progress 절대값이 아니라 cycle budget 대비 normalized progress와 budget-scaled threshold로 비교합니다.",

    keyTakeaway:
      "핵심은 no-dummy 조건에서는 window 길이 변화만으로 transient가 생기지 않았고, 이전 cycle50k transient_rate=1은 fixed threshold artifact였다는 점입니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 낮아지고, 200k window에서 scaled threshold 아래로 떨어지는 명확한 low-progress event가 관찰되었습니다.",

    nextQuestion:
      "이제 dummy perturbation의 무엇이 global stalled progress를 낮추는지 분리해야 합니다. 다음 단계에서는 empty dummy, ALU dummy, global read/write dummy, long global read dummy, many-block dummy 등을 비교해 launch boundary 효과와 memory hierarchy perturbation을 분리하는 것이 적절합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "cycle budget에 비례해 transient threshold를 정규화하자, no-dummy 조건에서는 50k, 100k, 200k, 400k 모두 dependent_global_stalled transient가 검출되지 않았습니다. global progress는 cycle budget에 거의 선형으로 scaling했고 normalized progress도 대체로 안정적이었습니다. 따라서 이전 Scheduler Phase Probe에서 cycle50k 조건이 모두 transient로 잡힌 것은 fixed threshold artifact였음이 확인되었습니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 no-dummy 대비 낮아졌고, cycle200k dummy 조건에서 global progress가 85~86까지 떨어지는 명확한 low-progress event가 관찰되었습니다.",

    metrics: [
      {
        label: "cycle 50k no dummy",
        value: "global 38 / norm 0.000760 / transient 0",
        note: "scaled threshold 30 적용 후 fixed threshold artifact 제거",
      },
      {
        label: "cycle 100k no dummy",
        value: "global 75.997 / norm 0.000760 / transient 0",
        note: "기준 window에서 안정적",
      },
      {
        label: "cycle 200k no dummy",
        value: "global 151.771 / norm 0.000759 / transient 0",
        note: "긴 window에서도 no-dummy 조건은 안정적",
      },
      {
        label: "cycle 400k no dummy",
        value: "global 296.075 / norm 0.000740 / transient 0",
        note: "normalized progress는 약간 낮아졌지만 scaled threshold event는 없음",
      },
      {
        label: "dummy 100k",
        value: "global 72.215 / norm 0.000722 / transient 0",
        note: "dummy perturbation 이후 global normalized progress가 낮아짐",
      },
      {
        label: "dummy 200k",
        value: "global 144.322 / norm 0.000722 / min 85 / transient 4",
        note: "scaled threshold 120 기준 low-progress event 발생",
      },
    ],

    interpretation:
      "이 결과는 observation window 길이 자체가 transient를 만든다는 가설을 약화시킵니다. threshold를 cycle budget에 맞춰 정규화하면 no-dummy 조건에서는 rare transient가 사라지고, progress는 거의 선형적으로 scaling합니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 지속적으로 낮아지고, 200k window에서 global stalled warp 전체가 85~86 수준으로 떨어지는 event가 나타났습니다. 따라서 현재 transient는 window length 자체보다 launch/memory phase perturbation과 dependent_global_stalled workload가 결합될 때 드러나는 phase-sensitive event로 보는 것이 적절합니다.",

    caveat:
      "scaled threshold는 100k 기준 threshold 60을 선형 확장한 경험적 기준입니다. 또한 이번 실험은 blocks=1 조건이므로 Scheduler Phase Probe에서 관찰된 multi-block grid-level event와 직접 동일하게 비교하기는 어렵습니다. no-dummy single-block window에서는 안정적이지만, multi-block 또는 dummy perturbation 조건에서는 event가 다시 나타날 수 있습니다.",
  },

  codegenImpact: {
    targetPattern:
      "benchmark_protocol / memory_latency_bound_kernel / shared_memory_tiled_kernel / graph_level_kernel_sequence / rare_tail_risk_kernel",

    affectedDecision:
      "observation_window_normalization / transient_threshold_policy / benchmark_protocol / predecessor_kernel_sensitivity / kernel_variant_tail_risk_validation",

    costSignal:
      "no-dummy 조건에서는 cycle budget을 50k, 100k, 200k, 400k로 바꾸어도 normalized global stalled progress가 대체로 안정적이었고 transient_count는 0이었습니다. 따라서 fixed threshold로 인한 false positive를 제거할 수 있었습니다. 반면 dummy_before 조건에서는 normalized global progress가 약 0.000722 수준으로 낮아졌고, cycle200k dummy 조건에서 min_normalized_progress 0.000425, transient_count 4가 관찰되었습니다.",

    ruleCandidate:
      "cycle budget이 다른 probe 결과는 raw progress나 fixed threshold로 비교하지 않습니다. codegen cost calibration에서는 progress / cycle_budget, scaled threshold, median-ratio threshold를 함께 사용합니다. no-dummy window에서 안정적인 variant라도 predecessor kernel 또는 dummy perturbation 이후 normalized progress가 낮아지거나 transient event가 발생하면 launch-context tail-risk penalty를 부여합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium-high",
    },

    reminder:
      "transient 판정은 observation window에 의존합니다. cycle budget이 바뀌면 threshold도 함께 scaling해야 하며, dummy/predecessor kernel이 들어가면 normalized progress와 tail event를 다시 확인해야 합니다.",
  },

  costModelRole: {
    role: "observation_window_normalization",

    description:
      "이 probe는 rare transient event 분석에서 cycle budget과 threshold artifact를 분리합니다. 결과적으로 probe-derived cost model에는 raw progress뿐 아니라 normalized progress, scaled threshold, transient rate, predecessor perturbation sensitivity가 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "launch_perturbation_probe",
      "multi_block_normalized_probe",
      "graph_level_kernel_sequence_model",
      "kernel_variant_tail_risk_model",
      "benchmark_protocol",
    ],
  },

  measurementReliability: {
    status: "window_normalization_validated",

    issue:
      "scaled threshold는 선형 scaling 기준입니다. 실제 transient threshold가 cycle budget에 완전히 선형적으로 대응한다고 증명한 것은 아닙니다. 또한 blocks=1 조건이므로 multi-block co-occurrence 현상은 아직 재검증되지 않았습니다.",

    impact:
      "이 결과는 이전 Scheduler Phase Probe의 cycle50k transient_rate=1이 fixed threshold artifact였음을 정리합니다. no-dummy single-block 조건에서는 observation window 길이만으로 transient가 생기지 않았습니다. 반면 dummy_before 조건에서는 normalized progress drop과 low-progress event가 남아 launch/memory perturbation 분석 필요성을 강화합니다.",

    mitigation:
      "후속 launch_perturbation_probe에서 dummy 종류를 분해하고, multi-block normalized 조건에서 scaled threshold를 다시 적용합니다. 필요하면 median-ratio threshold 또는 MAD-based threshold를 추가합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "cycle budget이 다르면 raw progress를 직접 비교하지 않습니다.",
      "fixed threshold는 false positive와 false negative를 만들 수 있습니다.",
      "progress / cycle_budget 형태의 normalized progress를 함께 기록합니다.",
      "no-dummy에서 안정적이어도 predecessor kernel 이후에는 다시 검증합니다.",
      "dummy_before 조건의 normalized drop은 launch/memory perturbation 후보 신호입니다.",
    ],
  },

  probingMeaning:
    "이 node는 rare transient event 분석에서 observation window와 threshold artifact를 분리합니다. fixed threshold로 인해 잘못 검출되던 cycle50k 문제를 제거했고, no-dummy 조건에서는 window 길이 변화만으로 transient가 생기지 않음을 확인했습니다. 동시에 dummy perturbation이 global stalled normalized progress를 낮추고 드문 low-progress event를 유도할 수 있음을 보여주어, 다음 단계의 launch perturbation 및 multi-block normalized 분석으로 이어집니다.",

  relatedNodes: [
    {
      id: "scheduler_phase_probe",
      reason:
        "cycle 50k/200k 조건에서 fixed threshold 문제가 드러났기 때문에 normalized threshold로 후속 검증함",
    },
    {
      id: "composition_phase_repeatability_probe",
      reason:
        "3 shared-chain + 1 light + 4 global composition의 rare transient 반복성을 window 길이 관점에서 재검증함",
    },
    {
      id: "latency_hiding",
      reason:
        "latency hiding signature를 raw progress가 아니라 normalized progress와 rare event rate로 분석함",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_stalled의 normalized progress drop을 transient event로 검출함",
    },
    {
      id: "shared_memory",
      reason:
        "shared dependent-chain ready source와 global stalled workload 조합을 유지함",
    },
    {
      id: "observation_window",
      reason:
        "cycle budget과 transient threshold를 함께 scaling해 관측 window artifact를 분리함",
    },
    {
      id: "launch_perturbation",
      reason:
        "dummy_before 조건에서 normalized global progress drop과 low-progress event가 남아 후속 perturbation 분해가 필요함",
    },
  ],

  connectsTo: [
    {
      id: "launch_perturbation_probe",
      type: "launch-perturbation-analysis",
      label: "dummy effect → launch perturbation",
    },
    {
      id: "observation_window",
      type: "normalization",
      label: "scaled threshold → observation window",
    },
  ],
};

export default normalizedWindowProbe;