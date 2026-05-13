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
      "이 노드는 transient event 분석에서 observation window와 threshold artifact를 분리하는 normalization 단계입니다. raw progress가 아니라 cycle budget 대비 normalized progress로 비교합니다.",

    keyTakeaway:
      "핵심은 no-dummy 조건에서는 window 길이 변화만으로 transient가 생기지 않았고, 이전 cycle50k transient_rate=1은 fixed threshold artifact였다는 점입니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 낮아지고 200k window에서 명확한 drop event가 관찰되었습니다.",

    nextQuestion:
      "이제 dummy perturbation의 무엇이 global stalled progress를 낮추는지 분리해야 합니다. 다음 단계에서는 empty dummy, ALU dummy, global read/write dummy, many-block dummy 등을 비교해 launch boundary 효과와 memory hierarchy perturbation을 분리하는 것이 적절합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "cycle budget에 비례해 transient threshold를 정규화하자, no-dummy 조건에서는 50k, 100k, 200k, 400k 모두 dependent_global_stalled transient가 검출되지 않았습니다. global progress는 cycle budget에 거의 선형으로 scaling했고 normalized progress도 대체로 안정적이었습니다. 따라서 이전 Scheduler Phase Probe에서 cycle50k 조건이 모두 transient로 잡힌 것은 fixed threshold artifact였음이 확인되었습니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 no-dummy 대비 낮아졌고, cycle200k dummy 조건에서 global progress가 85~86까지 떨어지는 명확한 low-progress event가 1회 관찰되었습니다.",

    metrics: [
      {
        label: "cycle 50k",
        value: "global 38 / norm 0.00076 / transient 0",
        note: "threshold 30 적용 후 fixed threshold artifact 제거",
      },
      {
        label: "cycle 100k",
        value: "global 75.997 / norm 0.000760 / transient 0",
        note: "기존 baseline window에서 안정적",
      },
      {
        label: "cycle 200k",
        value: "global 151.771 / norm 0.000759 / transient 0",
        note: "긴 window에서도 no-dummy 조건은 안정적",
      },
      {
        label: "cycle 400k",
        value: "global 296.075 / norm 0.000740 / transient 0",
        note: "normalized progress는 약간 낮아졌지만 threshold event는 없음",
      },
      {
        label: "dummy 100k",
        value: "global 72.215 / norm 0.000722 / transient 0",
        note: "dummy perturbation 이후 global normalized progress가 낮아짐",
      },
      {
        label: "dummy 200k",
        value: "global 144.322 / norm 0.000722 / event min 85",
        note: "scaled threshold 120 기준 low-progress event 1회 발생",
      },
    ],

    interpretation:
      "이 결과는 observation window 길이 자체가 transient를 만든다는 가설을 약화시킵니다. threshold를 cycle budget에 맞춰 정규화하면 no-dummy 조건에서는 rare transient가 사라지고, progress는 거의 선형적으로 scaling합니다. 반면 dummy_before 조건에서는 global stalled normalized progress가 지속적으로 낮아지고, 200k window에서 global stalled warp 전체가 85~86 수준으로 떨어지는 event가 나타났습니다. 따라서 현재 transient는 window length보다는 launch/memory phase perturbation과 dependent_global_stalled workload가 결합될 때 드러나는 phase-sensitive event로 보는 것이 적절합니다.",

    caveat:
      "scaled threshold는 100k 기준 threshold 60을 선형 확장한 경험적 기준입니다. 또한 이번 실험은 blocks=1 조건이므로 Scheduler Phase Probe에서 관찰된 multi-block grid-level event와 직접 동일하게 비교하기는 어렵습니다. no-dummy single-block window에서는 안정적이지만, multi-block 또는 dummy perturbation 조건에서는 event가 다시 나타날 수 있습니다.",
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