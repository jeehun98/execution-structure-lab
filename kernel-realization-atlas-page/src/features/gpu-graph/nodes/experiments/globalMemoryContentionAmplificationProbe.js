const globalMemoryContentionAmplificationProbe = {
  id: "global_memory_contention_amplification_probe",
  label: "Global Memory Contention Amplification",
  title: "global memory contention 조건에 따른 warp progress signature 변형",
  description:
    "Mixed Workload Probe에서 dependent_global_load가 낮은 progress와 높은 run-to-run variability를 보인 이후, global memory dependent workload의 수와 address access mode를 바꿔 progress signature가 어떻게 변형되는지 관찰한 후속 probe입니다. 이 실험은 단순히 contention이 커지면 progress가 감소하는지 확인하는 것이 아니라, ready warp supply, address locality, latency hiding 조건이 global memory signature에 어떤 영향을 주는지 확인합니다.",

  status: "observed",
  kind: "experiment",

  layer: "memory-signature-result",
  order: 6,

  detailPath: "/hardware-evidence/global_memory_contention_amplification_probe",

  graphSummary: {
    intro:
      "Mixed Workload Probe에서 드러난 dependent global memory workload의 낮은 progress와 높은 variability를 더 깊게 파고들어, global-load warp 수와 address access mode가 progress signature를 어떻게 변형하는지 확인한 실험입니다.",

    buildUp: [
      {
        id: "same_workload_baseline",
        label: "Same Workload Baseline",
        summary:
          "동일 workload 조건에서 강한 warp_id progress 편향이 나타나는지 확인해 후속 signature 해석의 기준선을 만들었습니다.",
      },
      {
        id: "warp_execution_signature_v0",
        label: "Warp Signature v0",
        summary:
          "서로 다른 execution pattern이 동일한 cycle budget 안에서 구분 가능한 progress signature를 남긴다는 최초 observation을 만들었습니다.",
      },
      {
        id: "warp_signature_repeatability",
        label: "Warp Signature Repeatability",
        summary:
          "v0에서 관찰된 progress signature가 단일 run의 우연이 아니라 동일 조건 반복 실행에서도 유지되는지 검증했습니다.",
      },
      {
        id: "warp_signature_permutation",
        label: "Warp Signature Permutation",
        summary:
          "반복 가능한 signature가 특정 warp_id에 고정된 것이 아니라 workload pattern assignment를 따라 이동하는지 확인했습니다.",
      },
      {
        id: "mixed_workload_probe",
        label: "Mixed Workload Probe",
        summary:
          "검증된 workload signature가 mixed composition에서도 유지되며, dependent_global_load가 낮은 progress와 높은 variability를 남긴다는 신호를 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 mixed workload에서 관찰된 dependent_global_load의 variability signal을 memory-specific 조건으로 확장한 memory signature modulation 단계입니다. global-load warp 수와 address locality를 바꿔, global memory signature가 어떤 조건에서 완화되거나 증폭되는지 확인합니다.",

    keyTakeaway:
      "핵심은 global-load warp 수가 늘면 progress가 단순히 감소한다는 결론이 아닙니다. global memory progress signature는 ready warp supply가 남아 있는지, 그리고 address locality나 cache reuse 가능성이 있는지에 따라 크게 달라집니다.",

    nextQuestion:
      "ready warp supply가 global memory signature를 바꾸는 신호가 관찰되었으므로, 다음 단계에서는 memory-stalled warp가 있는 동안 ready warp가 latency를 얼마나 숨기는지 latency hiding ratio로 직접 분리해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "dependent_global_load signature는 global-load warp 수에 단순 비례해 악화되지 않았습니다. 1~4개의 global-load warp가 light_alu warp와 공존할 때는 global progress가 오히려 증가했지만, 모든 warp가 global-load로 채워진 all_global_chain 조건에서는 progress가 크게 하락했습니다. 또한 overlap address 조건은 높은 progress와 낮은 variability를 보인 반면, dispersed address 조건은 낮은 progress와 초기 run의 큰 변동성을 보였습니다. 따라서 global memory progress signature는 단순 contention보다 ready warp supply, address locality, latency hiding 조건에 의해 강하게 변형됩니다.",

    metrics: [
      {
        label: "all light ALU baseline",
        value: "1086",
        note: "모든 warp가 light_alu일 때의 기준 progress",
      },
      {
        label: "1 global + 7 light",
        value: "158.792",
        note: "dependent_global_load 평균 progress. 단일 global warp이지만 run-to-run variability가 큼",
      },
      {
        label: "2 global + 6 light",
        value: "182.521",
        note: "global-load warp 수가 2개일 때 오히려 progress 증가",
      },
      {
        label: "4 global + 4 light",
        value: "198.104",
        note: "mixed_default 조건에서 global-load progress가 1~2 global보다 더 높게 관찰됨",
      },
      {
        label: "8 global",
        value: "97.370",
        note: "모든 warp가 global memory dependency에 묶이면 progress가 크게 하락",
      },
      {
        label: "4 global overlap address",
        value: "274.250",
        note: "주소 영역 중첩 조건. 높은 progress와 낮은 variability를 보임",
      },
      {
        label: "4 global dispersed address",
        value: "95.667",
        note: "주소 영역 분산 조건. 낮은 progress와 초기 run의 큰 variability를 보임",
      },
      {
        label: "dispersed global variability",
        value: "CV ≈ 0.08",
        note: "warp별 dependent_global_load에서 높은 run-to-run variability 관찰",
      },
    ],

    interpretation:
      "이 결과는 global memory signature가 단순히 global-load warp 수 증가만으로 설명되지 않음을 보여줍니다. light_alu warp가 함께 존재하는 조건에서는 memory-stalled warp 사이에 ready warp가 공급되면서 progress 구조가 유지되거나 일부 global progress가 증가할 수 있습니다. 반대로 all_global_chain처럼 모든 warp가 memory dependency에 묶이면 ready warp supply가 부족해지고 progress가 크게 낮아집니다. address overlap 조건에서는 cache locality나 reuse 효과로 progress가 높고 안정적인 반면, dispersed address 조건에서는 locality가 약해져 낮은 progress와 높은 초기 variability가 나타납니다.",

    caveat:
      "이 실험은 synthetic dependent global memory chain을 사용한 단일 block, 고정 launch shape 조건의 관찰입니다. 또한 role_aggregate_stats의 variance는 role 내부 warp mean 간 차이를 반영하므로, run-to-run variability는 warp_scenario_stats의 coefficient_of_variation을 함께 봐야 합니다. 따라서 결과를 절대적인 memory bandwidth나 일반적인 scheduler 정책으로 해석하기보다는, address locality와 ready warp supply가 warp-level progress signature를 어떻게 변형하는지에 대한 관찰로 읽어야 합니다.",
  },

  probingMeaning:
    "이 node는 Mixed Workload Probe에서 드러난 dependent_global_load의 낮은 progress와 높은 variability를 확장해, global memory signature가 어떤 조건에서 증폭되거나 완화되는지 확인한 실험입니다. 결과적으로 단순 contention보다 address locality와 ready warp supply가 더 강한 변형 요인으로 나타났으며, 다음 단계로 latency hiding ratio를 직접 분리해 분석해야 한다는 근거를 제공합니다.",

  relatedNodes: [
    {
      id: "mixed_workload_probe",
      reason:
        "mixed workload 조건에서 dependent_global_load가 가장 낮은 progress와 높은 variability를 보였기 때문에, 그 변형 요인을 global warp 수와 address mode 변화로 확장 검증함",
    },
    {
      id: "global_memory",
      reason:
        "dependent global memory access의 progress mean과 run-to-run variability를 직접 관찰함",
    },
    {
      id: "latency_hiding",
      reason:
        "global-load warp가 stall되는 동안 ready light_alu warp가 존재할 때 progress 구조가 달라지는 신호가 관찰됨",
    },
    {
      id: "ready_warp_supply",
      reason:
        "global-load warp가 stall되는 동안 scheduler가 선택할 수 있는 ready warp 공급량이 progress signature 변형에 영향을 주는 것으로 해석됨",
    },
    {
      id: "warp",
      reason:
        "warp별 progress, coefficient of variation, role assignment를 측정 단위로 사용함",
    },
    {
      id: "cache_locality",
      reason:
        "overlap address 조건에서 높은 progress와 낮은 variability가 나타나 address locality 또는 cache reuse 가능성을 시사함",
    },
  ],

  connectsTo: [
    {
      id: "latency_hiding_ratio_probe",
      type: "latency-hiding-analysis",
      label: "ready warp supply → latency hiding ratio",
    },
    {
      id: "cache_locality",
      type: "memory-locality-signal",
      label: "address mode → cache locality",
    },
  ],
};

export default globalMemoryContentionAmplificationProbe;