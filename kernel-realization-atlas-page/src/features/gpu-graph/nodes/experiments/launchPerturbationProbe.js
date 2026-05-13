const launchPerturbationProbe = {
  id: "launch_perturbation_probe",
  label: "Launch Perturbation Probe",
  title: "dummy perturbation 원인 분해 probe",
  description:
    "Normalized Window Probe에서 no-dummy window 조건은 안정적이었지만 dummy_before 조건에서 global stalled normalized progress가 낮아지고 low-progress event가 나타난 이후, dummy kernel의 launch boundary, ALU work, global read/write, duration, block 수 요인을 분해한 후속 probe입니다.",

  status: "observed",
  kind: "experiment",

  layer: "launch-perturbation-analysis",
  order: 15,

  detailPath: "/hardware-evidence/launch_perturbation_probe",

  graphSummary: {
    intro:
      "dummy_before 조건에서 나타난 global stalled progress drop이 launch boundary 자체 때문인지, compute perturbation 때문인지, global memory perturbation 때문인지 분해한 실험입니다.",

    buildUp: [
      {
        id: "scheduler_phase_probe",
        label: "Scheduler Phase Probe",
        summary:
          "dummy kernel 삽입이 transient event 위치와 빈도를 바꾸며 launch-phase perturbation에 민감한 신호를 만든다는 점을 확인했습니다.",
      },
      {
        id: "normalized_window_probe",
        label: "Normalized Window Probe",
        summary:
          "no-dummy window 길이 변화만으로는 transient가 거의 없고, dummy_before 조건에서 global stalled normalized progress가 낮아지는 신호를 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 rare transient event의 원인을 dummy perturbation 내부 요소로 분해하는 단계입니다. launch boundary, ALU-only dummy, short global traffic, long global read, block 수 요인을 나눠 어떤 perturbation이 실제 low-progress event를 만드는지 확인합니다.",

    keyTakeaway:
      "핵심은 launch boundary 자체가 충분조건이 아니라는 점입니다. empty dummy launch와 ALU dummy는 global progress를 낮췄지만 event를 만들지는 않았고, long global read dummy에서만 global stalled warp 전체가 크게 떨어지는 event가 발생했습니다.",

    nextQuestion:
      "long global read 조건은 duration과 total memory traffic이 함께 증가합니다. 다음 단계에서는 global read duration, 총 memory traffic, 동일 buffer 접근 여부를 분리해 event의 직접 원인을 확인해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "dummy perturbation에 의한 dependent_global_stalled progress drop은 단순 launch boundary만으로 설명되지 않았습니다. empty dummy launch와 light ALU dummy는 no-dummy 대비 global progress를 낮췄지만 transient event를 만들지는 않았습니다. short global read/write dummy 역시 global progress를 더 낮췄지만 threshold 아래 event는 없었습니다. 반면 long global read dummy에서만 global stalled warp 전체가 81~84 수준으로 떨어지는 명확한 low-progress event가 발생했습니다. 따라서 현재 transient의 핵심 후보는 launch boundary 자체가 아니라, 충분히 긴 global memory read perturbation이 만든 memory hierarchy 또는 phase state 변화로 해석하는 것이 적절합니다.",

    metrics: [
      {
        label: "no dummy",
        value: "global 151.578 / norm 0.000758 / transient 0",
        note: "기준선. 200k window에서 안정적",
      },
      {
        label: "empty dummy launch",
        value: "global 146.719 / norm 0.000734 / transient 0",
        note: "빈 launch만으로 global progress는 낮아지지만 event는 없음",
      },
      {
        label: "light ALU dummy",
        value: "global 146.069 / norm 0.000730 / transient 0",
        note: "compute-only perturbation도 event를 만들지 않음",
      },
      {
        label: "short global read dummy",
        value: "global 144.255 / min 138 / transient 0",
        note: "global read traffic은 steady progress를 낮추지만 threshold event는 없음",
      },
      {
        label: "short global write dummy",
        value: "global 144.200 / min 138 / transient 0",
        note: "write perturbation도 short duration에서는 event를 만들지 않음",
      },
      {
        label: "long global read dummy",
        value: "global 144.117 / min 81 / transient 4",
        note: "유일하게 명확한 low-progress event 발생",
      },
      {
        label: "many-block global read dummy",
        value: "global 144.259 / min 138 / transient 0",
        note: "dummy block 수 증가만으로는 event가 발생하지 않음",
      },
      {
        label: "same-block-count global read dummy",
        value: "global 145.097 / min 144 / transient 0",
        note: "measurement와 같은 block 수의 짧은 read perturbation은 안정적",
      },
    ],

    interpretation:
      "이 결과는 dummy_before 효과가 launch boundary 하나로 설명되지 않음을 보여줍니다. 빈 launch와 ALU-only dummy는 dependent_global_stalled의 steady progress를 낮췄지만, 강한 transient event는 만들지 않았습니다. global memory traffic은 steady drop을 더 키웠고, 특히 duration이 긴 global read dummy에서만 threshold 아래 low-progress event가 발생했습니다. 따라서 transient는 long-duration global memory read perturbation이 measurement kernel의 dependent global chain과 결합하면서 나타나는 memory hierarchy / phase-sensitive event로 보는 것이 가장 적절합니다.",

    caveat:
      "long global read 조건은 dummy duration이 길고 total global memory read traffic도 많기 때문에, 이번 실험만으로 duration 효과와 total memory traffic 효과를 완전히 분리할 수는 없습니다. 또한 global write dummy는 buffer 내용을 바꿀 수 있으므로 read perturbation과 직접 동일하게 해석하면 안 됩니다. 다음 실험에서는 duration과 total memory traffic, buffer reuse 여부를 분리해야 합니다.",
  },

  probingMeaning:
    "이 node는 rare transient event의 원인을 dummy perturbation 내부 요소로 분해합니다. 결과적으로 launch boundary, compute-only perturbation, short memory perturbation은 충분조건이 아니며, long-duration global memory read perturbation이 dependent_global_stalled drop을 유도하는 핵심 후보임을 보여줍니다.",

  relatedNodes: [
    {
      id: "normalized_window_probe",
      reason:
        "no-dummy window 조건은 안정적이었지만 dummy_before 조건에서 global stalled normalized progress drop과 event가 나타났기 때문에, dummy 요인을 분해함",
    },
    {
      id: "scheduler_phase_probe",
      reason:
        "dummy kernel 삽입이 transient event 위치와 빈도를 바꿨던 선행 실험",
    },
    {
      id: "global_memory",
      reason:
        "long global read dummy와 dependent_global_stalled workload의 상호작용을 분석함",
    },
    {
      id: "latency_hiding",
      reason:
        "latency hiding signature가 launch/memory phase perturbation에 의해 변형되는지 확인함",
    },
    {
      id: "observation_window",
      reason:
        "cycle budget과 threshold를 정규화한 상태에서 perturbation 원인을 분해함",
    },
  ],

  connectsTo: [
    {
      id: "memory_perturbation_duration_probe",
      type: "memory-duration-analysis",
      label: "long global read → duration/traffic split",
    },
  ],
};

export default launchPerturbationProbe;