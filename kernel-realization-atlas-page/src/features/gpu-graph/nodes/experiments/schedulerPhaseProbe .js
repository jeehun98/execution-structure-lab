const schedulerPhaseProbe = {
  id: "scheduler_phase_probe",
  label: "Scheduler Phase Probe",
  title: "composition transient의 scheduler/grid phase localization 분석",
  description:
    "Composition Phase Repeatability Probe에서 3 shared-chain + 1 light + 4 global 조건의 low-progress transient가 희박하게 반복됨을 확인한 이후, block 수, dummy kernel 삽입, cycle budget을 바꿔 transient event가 특정 block, launch phase, grid-level execution phase, 관측 window에 어떻게 민감하게 반응하는지 확인한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "scheduler-phase-analysis",
  order: 13,

  detailPath: "/hardware-evidence/scheduler_phase_probe",

  graphSummary: {
    intro:
      "3 shared-chain + 1 light + 4 global composition에서 발생하는 low-progress transient가 특정 warp나 단일 block에 국한되는지, 아니면 block 수와 launch phase 조건에 따라 증폭되거나 이동하는 grid-level signature인지 확인한 실험입니다.",

    buildUp: [
      {
        id: "composition_transient_probe",
        label: "Composition Transient Probe",
        summary:
          "3 shared-chain + 1 light라는 비대칭 ready-source composition에서 dependent_global_stalled의 강한 low-progress transient가 발생함을 확인했습니다.",
      },
      {
        id: "composition_phase_repeatability_probe",
        label: "Composition Phase Repeatability",
        summary:
          "해당 transient가 단발성 artifact가 아니라, placement와 seed 조건에 따라 희박하게 반복되는 composition-sensitive rare event임을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 composition-level transient 분석을 scheduler/grid phase localization 단계로 확장합니다. block 수, dummy kernel 삽입, cycle budget을 바꿔 event가 block-local 현상인지, launch/run phase에 민감한 grid-level event signature인지 좁혀갑니다.",

    keyTakeaway:
      "핵심은 transient가 단일 block 내부 noise로만 보기 어렵다는 점입니다. block 수가 증가하면 transient exposure가 커졌고, 특히 blocks=8 조건에서는 transient rate와 severity가 함께 증가했습니다. 또한 여러 block이 같은 run에서 동시에 low-progress 상태로 들어가는 패턴이 관찰되었습니다. dummy kernel은 transient를 제거하지 않았고, event 위치와 강도를 바꾸는 phase perturbation처럼 작동했습니다.",

    nextQuestion:
      "cycle budget 50k/200k 조건은 fixed threshold 60 때문에 100k 조건과 직접 비교하기 어렵습니다. 다음 단계에서는 progress를 cycle budget으로 정규화하거나, threshold를 condition별 median progress 비율로 바꿔 normalized observation window를 구성해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "low-progress transient는 특정 block 하나에 고정된 현상이라기보다, block 수와 launch phase 조건에 따라 증폭되거나 이동하는 grid-level phase signature에 가까웠습니다. blocks=1~4에서는 dependent_global_stalled transient rate가 약 0.0039~0.0049 수준이었지만, blocks=8에서는 약 0.00885로 증가했고 min progress도 34까지 낮아졌습니다. 또한 transient_events를 보면 여러 run에서 다수 block이 같은 run에 동시에 low-progress 상태로 들어갔습니다. dummy kernel 삽입은 transient를 제거하지 않았고, 오히려 event 위치와 빈도, severity를 바꾸어 launch-phase perturbation에 민감한 현상임을 시사했습니다. 다만 cycle budget 50k/200k 조건은 fixed threshold 때문에 직접 비교하지 말고 normalized window 실험으로 재검증해야 합니다.",

    metrics: [
      {
        label: "blocks=1, 100k",
        value: "global min 46 / transient 8 / rate 0.0039",
        note: "single-block 기준선에서도 rare transient 재현",
      },
      {
        label: "blocks=2, 100k",
        value: "global min 45 / transient 20 / rate 0.0049",
        note: "block 수 증가에 따라 total event 증가. 일부 run에서 두 block 동시 transient 관찰",
      },
      {
        label: "blocks=4, 100k",
        value: "global min 45 / transient 40 / rate 0.0049",
        note: "여러 block이 같은 run에서 동시에 transient를 보임",
      },
      {
        label: "blocks=8, 100k",
        value: "global min 34 / transient 145 / rate 0.00885",
        note: "event rate와 severity가 함께 증가하며 grid-level phase 신호가 강해짐",
      },
      {
        label: "dummy before, blocks=1",
        value: "global min 34 / transient 12 / rate 0.0059",
        note: "dummy kernel은 transient를 제거하지 않고 phase를 이동 또는 증폭",
      },
      {
        label: "dummy before, blocks=4",
        value: "global min 35 / transient 48 / rate 0.0059",
        note: "dummy perturbation 이후에도 multi-block transient 유지",
      },
      {
        label: "cycle 50k",
        value: "global mean 36.19 / transient_rate 1",
        note: "fixed threshold 60 때문에 직접 비교 불가. 정상 plateau도 60보다 낮아짐",
      },
      {
        label: "cycle 200k",
        value: "global mean 144.625 / transient 0",
        note: "fixed threshold 60이 너무 낮아 event 검출 기준으로 부적절",
      },
    ],

    interpretation:
      "이 결과는 composition transient가 block-local noise라기보다 launch/run phase에서 여러 block이 동시에 영향을 받는 grid-level event signature일 가능성을 보여줍니다. 특히 blocks=4와 blocks=8 조건에서 동일 batch/run의 여러 block이 동시에 low-progress 상태로 들어가는 패턴이 반복되었습니다. dummy kernel 삽입은 transient를 제거하지 않았고, 오히려 event 빈도와 위치를 바꾸었기 때문에, 이 현상은 launch phase perturbation에 민감한 scheduler/memory phase signature로 해석할 수 있습니다. 다만 block_id는 SM id가 아니므로 SM-local event라고 단정하면 안 됩니다.",

    caveat:
      "block_id는 SM id를 직접 의미하지 않습니다. 따라서 block별 transient를 곧바로 SM locality로 해석하면 안 됩니다. 또한 cycle budget 50k와 200k 조건은 transient_threshold를 60으로 고정했기 때문에 100k 조건과 직접 비교하기 어렵습니다. 50k에서는 정상 global progress 자체가 36~37 수준이므로 모든 run이 threshold 60 아래로 들어가고, 200k에서는 정상 progress가 140대라 threshold 60이 너무 낮아집니다. cycle budget을 바꾸는 후속 실험에서는 progress를 cycle_budget으로 정규화하거나 threshold를 condition별 median progress에 비례시켜야 합니다.",
  },

  codegenImpact: {
    targetPattern:
      "shared_memory_tiled_kernel / mixed_compute_memory_kernel / memory_latency_bound_kernel / graph_level_kernel_sequence / rare_tail_risk_kernel",

    affectedDecision:
      "kernel_variant_validation / grid_size_selection / predecessor_kernel_sensitivity / benchmark_protocol / normalized_window_metric / tail_risk_model",

    costSignal:
      "3 shared-chain + 1 light + 4 global composition의 transient는 block 수와 launch phase 조건에 민감했습니다. blocks=8에서는 transient rate가 약 0.00885로 증가했고 min progress가 34까지 낮아졌습니다. dummy kernel 삽입도 transient를 제거하지 않고 min progress와 event 위치를 바꾸었습니다. 따라서 kernel 내부 warp composition뿐 아니라 grid size, predecessor kernel, launch context, observation window가 tail risk에 영향을 줄 수 있습니다.",

    ruleCandidate:
      "shared-memory mixed-role fused kernel은 단일 block microbenchmark 평균만으로 선택하지 않습니다. block count sweep, predecessor-kernel perturbation, multi-block co-occurrence, min progress, transient rate를 포함한 tail-risk validation을 통과해야 합니다. cycle budget이 다른 probe 결과는 fixed threshold로 비교하지 말고 normalized progress 또는 median-ratio threshold로 재평가합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "kernel variant의 안정성은 내부 warp composition만으로 결정되지 않습니다. grid size, preceding kernel, launch phase, observation window가 rare tail event를 바꿀 수 있습니다.",
  },

  costModelRole: {
    role: "grid_phase_tail_risk_localization",

    description:
      "이 probe는 composition transient가 block-local event인지, grid size와 launch phase에 민감한 event인지 확인합니다. 결과적으로 cost model에는 평균 progress뿐 아니라 blockCountSensitivity, dummyLaunchSensitivity, multiBlockCoOccurrence, minProgress, transientRate, normalizedWindowMetric이 별도 신호로 들어가야 함을 보여줍니다.",

    usedBy: [
      "normalized_window_probe",
      "transient_event_localization",
      "graph_level_kernel_sequence_model",
      "kernel_variant_tail_risk_model",
    ],
  },

  measurementReliability: {
    status: "grid_phase_sensitivity_observed",

    issue:
      "block 수와 dummy kernel 삽입에 따른 transient 변화는 관찰되었지만, scheduler 내부 phase나 SM locality를 직접 측정한 것은 아닙니다. 또한 cycle budget 조건은 fixed threshold 60 때문에 직접 비교가 불가능합니다.",

    impact:
      "현재 결과는 composition transient가 단순 block-local noise가 아니라 grid size와 launch phase에 민감한 rare event signature일 가능성을 높입니다. 다만 cycle budget 효과는 normalized threshold 기반 후속 실험으로 분리해야 합니다.",

    mitigation:
      "후속 normalized_window_probe에서 progress/cycle_budget, median-ratio threshold, MAD-based threshold를 사용합니다. 이후 transient_event_localization에서 condition order shuffle, dummy kernel 종류, block count sweep, role placement rotation을 더 세분화합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "단일 block 평균 progress만 보고 kernel variant를 선택하지 않습니다.",
      "block count가 증가하면 tail event exposure와 severity가 달라질 수 있습니다.",
      "preceding kernel 또는 dummy launch가 rare transient의 phase를 바꿀 수 있습니다.",
      "여러 block이 같은 run에서 동시에 low-progress 상태로 들어가는지 확인합니다.",
      "cycle budget이 다르면 fixed threshold가 아니라 normalized threshold로 비교합니다.",
    ],
  },

  probingMeaning:
    "이 node는 composition-level transient 분석을 block/grid phase localization 단계로 확장합니다. 이전 실험들이 transient의 존재와 반복성을 확인했다면, 이 실험은 event가 block 수와 launch phase perturbation에 의해 어떻게 증폭되거나 이동하는지 보여줍니다. 결과적으로 latency hiding signature는 warp composition뿐 아니라 grid-level scheduling phase, predecessor kernel, observation window 설계에 의해서도 변형될 수 있음을 시사합니다. codegen 관점에서는 fused kernel variant의 평균 cost뿐 아니라 graph-level launch context와 tail-risk sensitivity를 함께 검증해야 함을 보여주는 node입니다.",

  relatedNodes: [
    {
      id: "composition_phase_repeatability_probe",
      reason:
        "3 shared-chain + 1 light + 4 global composition에서 low-progress transient가 희박하게 반복됨을 확인했고, 그 event의 block/grid phase 민감도를 분석함",
    },
    {
      id: "composition_transient_probe",
      reason:
        "3 shared-chain + 1 light 조건에서 강한 transient가 처음 관찰됨",
    },
    {
      id: "latency_hiding_warmup_stability_probe",
      reason:
        "단순 warmup artifact가 아닌 phase-sensitive event임을 이전 흐름과 구분함",
    },
    {
      id: "latency_hiding",
      reason:
        "latency hiding signature를 steady mean이 아니라 rare transient event localization으로 확장함",
    },
    {
      id: "warp",
      reason:
        "warp role placement와 block-local progress를 측정 단위로 사용함",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_stalled role에서 transient event를 검출함",
    },
    {
      id: "shared_memory",
      reason:
        "shared dependent-chain ready source와 global stalled workload의 조합을 유지함",
    },
    {
      id: "grid_launch_phase",
      reason:
        "multi-block co-occurrence와 dummy kernel perturbation이 transient event 위치와 강도를 바꾸는 신호를 제공함",
    },
  ],

  connectsTo: [
    {
      id: "normalized_window_probe",
      type: "window-normalization",
      label: "fixed threshold issue → normalized window",
    },
    {
      id: "transient_event_localization",
      type: "rare-event-localization",
      label: "grid phase event → event localization",
    },
  ],
};

export default schedulerPhaseProbe;