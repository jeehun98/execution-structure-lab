const compositionPhaseRepeatabilityProbe = {
  id: "composition_phase_repeatability_probe",
  label: "Composition Phase Repeatability",
  title: "composition transient의 반복성 및 귀속성 검증",
  description:
    "Composition Transient Probe에서 3 shared-chain + 1 light + 4 global 조건에서 강한 dependent_global_stalled transient가 나타난 이후, 해당 transient가 단발성 artifact인지, prewarm 횟수, light warp placement, seed 방식에 따라 반복되는 phase signature인지 확인한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "phase-repeatability-analysis",
  order: 12,

  detailPath: "/hardware-evidence/composition_phase_repeatability_probe",

  graphSummary: {
    intro:
      "3 shared-chain + 1 light + 4 global 조건에서 관찰된 low-progress transient가 단발성 우연인지, 여러 조건에서 반복되는 composition-sensitive phase event인지 확인한 실험입니다.",

    buildUp: [
      {
        id: "shared_memory_ready_interference_probe",
        label: "Shared Memory Ready Interference",
        summary:
          "shared dependent-chain ready source와 dependent_global_stalled 조합에서 global low-progress transient가 발생한다는 신호를 확인했습니다.",
      },
      {
        id: "composition_transient_probe",
        label: "Composition Transient Probe",
        summary:
          "transient가 shared-chain ready warp 수에 단조적으로 비례하지 않고, 3 shared-chain + 1 light + 4 global이라는 비대칭 composition에서 가장 강하게 나타남을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 composition-level transient가 우연한 단발인지, 반복 가능한 phase-sensitive event인지 검증하는 단계입니다. prewarm 횟수, light warp placement, seed 방식을 바꿔 transient의 귀속 조건을 좁힙니다.",

    keyTakeaway:
      "핵심은 transient가 모든 조건에서 0이 아니었다는 점입니다. prewarm을 늘려도, seed 방식을 hash로 바꿔도 transient는 사라지지 않았고, light warp placement에 따라 강도와 빈도가 달라졌습니다.",

    nextQuestion:
      "이제 transient가 어떤 scheduler phase, warp placement, block launch phase와 연결되는지 확인해야 합니다. 다음 단계는 block 수, launch phase, dummy kernel 삽입, cycle budget 변화를 통한 rare transient event localization입니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "3 shared-chain + 1 light + 4 global composition에서 발생한 low-progress transient는 단발성 artifact가 아니었습니다. prewarm 0, 1, 3 조건과 hashed seed 조건에서도 dependent_global_stalled transient가 반복적으로 관찰되었습니다. 다만 특정 run index에 고정된 deterministic phase라기보다는, role placement와 seed 방식에 따라 빈도와 강도가 달라지는 composition-sensitive transient event로 해석하는 것이 적절합니다.",

    metrics: [
      {
        label: "baseline",
        value: "global min 46 / transient 1",
        note: "fixed light warp3, prewarm1, linear seed 조건에서 transient 재현",
      },
      {
        label: "prewarm0",
        value: "global min 43 / transient 1",
        note: "prewarm을 제거해도 transient가 사라지지 않음",
      },
      {
        label: "prewarm3",
        value: "global min 49 / transient 2",
        note: "prewarm을 늘려도 transient가 제거되지 않음",
      },
      {
        label: "light warp0",
        value: "global min 49 / transient 2",
        note: "light warp 위치를 바꿔도 transient 발생",
      },
      {
        label: "light warp1",
        value: "global min 36 / transient 2",
        note: "더 강한 low-progress transient 발생",
      },
      {
        label: "light warp2",
        value: "global min 33 / transient 3",
        note: "가장 강한 placement-sensitive transient",
      },
      {
        label: "hashed seed",
        value: "global min 35 / transient 2",
        note: "linear run_id seed가 아니어도 transient 발생",
      },
    ],

    interpretation:
      "이 결과는 composition transient가 단순한 초기 warmup artifact나 특정 run_id seed에 고정된 현상이 아님을 보여줍니다. prewarm 횟수를 바꿔도, seed 방식을 hash로 바꿔도 low-progress transient가 사라지지 않았습니다. 또한 light warp placement에 따라 transient의 강도와 빈도가 달라졌기 때문에, ready-source composition과 role placement가 scheduler/memory phase와 결합해 dependent_global_stalled progress를 희박하게 흔드는 것으로 해석할 수 있습니다.",

    caveat:
      "transient event는 전체 384 run당 1~3회 수준으로 희박하게 발생했습니다. 따라서 평균 progress만 보면 현상이 잘 드러나지 않고, min_progress, transient_count, batch_condition_summaries를 함께 봐야 합니다. 또한 이 결과는 단일 block synthetic workload 조건이므로 일반적인 GPU scheduler 정책으로 직접 일반화하기보다는, 특정 composition에서 나타나는 warp-level progress signature로 해석해야 합니다.",
  },

  probingMeaning:
    "이 node는 composition-level transient가 우연한 단발 현상이 아니라, 특정 ready/stalled composition에서 희박하게 반복되는 placement-sensitive phase event임을 보여줍니다. 이를 통해 latency hiding 분석을 평균 progress 중심에서 transient event structure와 role placement sensitivity 분석으로 확장합니다.",

  relatedNodes: [
    {
      id: "composition_transient_probe",
      reason:
        "3 shared-chain + 1 light + 4 global 조건에서 강한 global stalled transient가 관찰되었고, 이를 batch 반복, prewarm 변화, placement permutation, seed 변화로 검증함",
    },
    {
      id: "shared_memory_ready_interference_probe",
      reason:
        "shared dependent-chain ready source와 global stalled warp 조합에서 transient가 관찰된 선행 실험",
    },
    {
      id: "latency_hiding_warmup_stability_probe",
      reason:
        "prewarm 횟수 변화에도 transient가 제거되지 않아 단순 warmup artifact와 구분됨",
    },
    {
      id: "ready_warp_supply_probe",
      reason:
        "ready source 종류 자체보다 composition과 placement가 transient를 만든다는 해석으로 확장됨",
    },
    {
      id: "latency_hiding",
      reason:
        "latency hiding signature를 steady-state mean이 아니라 transient event 구조로 확장함",
    },
    {
      id: "warp",
      reason:
        "light warp placement 변화에 따라 transient 강도와 빈도가 달라짐",
    },
    {
      id: "global_memory",
      reason:
        "dependent_global_stalled role에서만 low-progress transient가 강하게 나타남",
    },
    {
      id: "shared_memory",
      reason:
        "shared dependent-chain ready source와 global stalled workload의 조합을 분석함",
    },
  ],

  connectsTo: [
    {
      id: "scheduler_phase_probe",
      type: "scheduler-phase-analysis",
      label: "placement-sensitive transient → scheduler phase",
    },
    {
      id: "transient_event_localization",
      type: "rare-event-localization",
      label: "rare transient → event localization",
    },
  ],
};

export default compositionPhaseRepeatabilityProbe;