const schedulerPhaseProbe = {
  id: "scheduler_phase_probe",
  label: "Scheduler Phase Probe",
  title: "composition transient의 scheduler/grid phase localization 분석",
  description:
    "Composition Phase Repeatability Probe에서 3 shared-chain + 1 light + 4 global 조건의 low-progress transient가 희박하게 반복됨을 확인한 이후, block 수, dummy kernel 삽입, cycle budget을 바꿔 transient event가 특정 block, launch phase, 관측 window에 귀속되는지 확인한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "scheduler-phase-analysis",
  order: 13,

  detailPath: "/hardware-evidence/scheduler_phase_probe",

  graphSummary: {
    intro:
      "3 shared-chain + 1 light + 4 global composition에서 발생하는 low-progress transient가 특정 warp나 block에 국한되는지, 아니면 block 수와 launch phase 조건에 따라 증폭되는 grid-level event인지 확인한 실험입니다.",

    buildUp: [
      {
        id: "composition_transient_probe",
        label: "Composition Transient Probe",
        summary:
          "3 shared-chain + 1 light + 4 global이라는 비대칭 ready-source composition에서 가장 강한 low-progress transient가 발생함을 확인했습니다.",
      },
      {
        id: "composition_phase_repeatability_probe",
        label: "Composition Phase Repeatability",
        summary:
          "해당 transient가 단발성 artifact가 아니라, placement와 seed 조건에 따라 희박하게 반복되는 composition-sensitive event임을 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 composition-level transient 분석을 scheduler/grid phase localization 단계로 확장합니다. block 수, dummy kernel 삽입, cycle budget을 바꿔 event가 block-local 현상인지 grid-level phase event인지 좁혀갑니다.",

    keyTakeaway:
      "핵심은 block 수가 늘어날수록 transient가 더 자주 관찰되고, 여러 block이 같은 run에서 동시에 low-progress 상태로 들어갔다는 점입니다. dummy kernel은 transient를 제거하지 않고 event 위치와 빈도를 바꾸었습니다.",

    nextQuestion:
      "cycle budget 변화 조건은 fixed threshold 때문에 직접 비교가 어렵습니다. 다음 단계에서는 progress를 cycle budget으로 정규화하거나 threshold를 budget에 비례시켜 관측 window 길이에 따른 transient signature를 다시 검증해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "low-progress transient는 특정 block 하나에 고정된 현상이라기보다, block 수와 launch phase 조건에 따라 증폭되는 grid-level phase event에 가까웠습니다. blocks=1~4에서는 dependent_global_stalled transient rate가 약 0.004~0.005 수준이었지만, blocks=8에서는 약 0.00885로 증가했습니다. 또한 transient_events를 보면 여러 run에서 모든 block 또는 다수 block이 동시에 low-progress 상태로 들어갔습니다. dummy kernel 삽입은 transient를 제거하지 않았고, 오히려 event 위치와 빈도를 바꾸어 launch-phase perturbation에 민감한 현상임을 시사했습니다.",

    metrics: [
      {
        label: "blocks=1, 100k",
        value: "global min 46 / transient 8 / rate 0.0039",
        note: "single-block 기준선에서도 rare transient 재현",
      },
      {
        label: "blocks=2, 100k",
        value: "global min 45 / transient 20 / rate 0.0049",
        note: "block 수 증가에 따라 total event 증가",
      },
      {
        label: "blocks=4, 100k",
        value: "global min 45 / transient 40 / rate 0.0049",
        note: "여러 block이 같은 run에서 동시에 transient를 보임",
      },
      {
        label: "blocks=8, 100k",
        value: "global min 34 / transient 145 / rate 0.00885",
        note: "event rate 자체가 증가하며 grid-level phase 신호가 강해짐",
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
        note: "fixed threshold 60 때문에 직접 비교 불가. normalized threshold 필요",
      },
      {
        label: "cycle 200k",
        value: "global mean 144.625 / transient 0",
        note: "fixed threshold 60이 너무 낮아 event 검출 기준으로 부적절",
      },
    ],

    interpretation:
      "이 결과는 composition transient가 block-local 현상이라기보다 launch/run phase에서 여러 block이 동시에 영향을 받는 grid-level event일 가능성을 보여줍니다. 특히 blocks=4와 blocks=8 조건에서 동일 batch/run에서 여러 block이 동시에 low-progress 상태로 들어가는 패턴이 반복되었습니다. dummy kernel 삽입은 transient를 제거하지 않았고, 오히려 event 빈도와 위치를 바꾸었기 때문에, 이 현상은 launch phase perturbation에 민감한 scheduler/memory phase signature로 해석할 수 있습니다.",

    caveat:
      "block_id는 SM id를 직접 의미하지 않습니다. 따라서 block별 transient를 곧바로 SM locality로 해석하면 안 됩니다. 또한 cycle budget 50k와 200k 조건은 transient_threshold를 60으로 고정했기 때문에 100k 조건과 직접 비교하기 어렵습니다. cycle budget을 바꾸는 후속 실험에서는 progress를 cycle_budget으로 정규화하거나 threshold를 budget 비례값으로 설정해야 합니다.",
  },

  probingMeaning:
    "이 node는 composition-level transient 분석을 block/grid phase localization 단계로 확장합니다. 이전 실험들이 transient의 존재와 반복성을 확인했다면, 이 실험은 event가 block 수와 launch phase perturbation에 의해 어떻게 증폭되거나 이동하는지 보여줍니다. 결과적으로 latency hiding signature는 warp composition뿐 아니라 grid-level scheduling phase와 관측 window 설계에 의해서도 변형될 수 있음을 시사합니다.",

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