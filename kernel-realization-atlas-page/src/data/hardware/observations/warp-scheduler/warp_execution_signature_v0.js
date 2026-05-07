export const warpExecutionSignatureV0Observation = {
  id: "warp_execution_signature_v0",
  groupLabel: "Warp Scheduling",
  type: "Execution Signature",
  label: "Warp execution signature v0",
  title: "서로 다른 execution pattern이 남기는 warp progress signature",

  summary:
    "동일한 cycle budget 안에서 서로 다른 warp execution pattern이 어떤 progress signature를 남기는지 관찰한 v0 결과입니다. 목적은 단순히 서로 다른 작업의 속도 차이를 확인하는 것이 아니라, dependency structure와 memory hierarchy가 warp-level progress에 어떤 상대적 흔적을 남기는지 해석하는 것입니다.",

  config: {
    blocks: 1,
    cycleBudget: 200_000_000,
    samplePeriod: 256,
    globalElements: 16_777_216,
  },

  records: [
    {
      block: 0,
      warpId: 0,
      role: "fast_independent_alu",
      progress: 462_823,
      lastClock: 159_499_133_611,
      sink: 0,
      signature:
        "독립 ALU 연산이 많아 dependency pressure가 낮고 instruction-level parallelism이 높은 compute-ready path",
    },
    {
      block: 0,
      warpId: 1,
      role: "dependent_alu_chain",
      progress: 90_648,
      lastClock: 159_499_133_486,
      sink: 860_966_725,
      signature:
        "memory access가 없어도 긴 dependency chain만으로 progress rate가 낮아질 수 있음을 보여주는 ALU latency path",
    },
    {
      block: 0,
      warpId: 2,
      role: "shared_load",
      progress: 129_754,
      lastClock: 159_499_134_096,
      sink: 3_832_225_372,
      signature:
        "on-chip memory 접근 비용은 존재하지만 dependent ALU chain보다 높은 progress를 보인 shared-memory path",
    },
    {
      block: 0,
      warpId: 3,
      role: "dependent_global_load",
      progress: 10_646,
      lastClock: 159_499_142_006,
      sink: 3_854_218_683,
      signature:
        "global memory latency와 address dependency가 결합될 때 progress가 급격히 낮아지는 memory-latency-dominated path",
    },
  ],

  ordering: [
    "fast_independent_alu",
    "shared_load",
    "dependent_alu_chain",
    "dependent_global_load",
  ],

  ratios: {
    independentAluVsDependentAlu: 5.11,
    independentAluVsSharedLoad: 3.57,
    independentAluVsDependentGlobalLoad: 43.47,
    sharedLoadVsDependentAlu: 1.43,
    dependentAluVsDependentGlobalLoad: 8.51,
    sharedLoadVsDependentGlobalLoad: 12.19,
  },

  interpretation: [
    "이 결과는 warp별로 다른 작업을 주었을 때 속도가 다르다는 자명한 사실을 확인하는 것이 아니라, execution pattern별 progress signature를 읽기 위한 v0 observation입니다.",
    "shared_load가 dependent_alu_chain보다 높은 progress를 보였다는 점은, 성능 병목을 단순한 ALU vs memory 구분으로 설명하기 어렵다는 것을 보여줍니다.",
    "progress 차이는 dependency structure, memory hierarchy, address dependency, latency hiding 가능성이 결합된 결과로 해석하는 것이 적절합니다.",
    "다만 각 workload는 iter 1회당 instruction mix가 다르므로, 이 비율은 절대적인 operation speed ratio가 아니라 workload별 상대적 실행 서명으로 해석해야 합니다.",
  ],

  caveats: [
    "현재 결과는 단일 run에서 얻은 v0 observation입니다.",
    "role이 warp_id에 고정되어 있으므로 warp_id bias를 완전히 배제하려면 role rotation이 필요합니다.",
    "각 workload는 iter 1회당 instruction mix가 다르므로 progress 값은 절대 속도비가 아니라 실행 서명으로 해석해야 합니다.",
    "fast_independent_alu의 sink 값이 0이므로 result-cancellation 또는 compiler optimization 가능성을 낮추기 위한 보강이 필요합니다.",
    "현재 output은 final progress만 보존하므로 시간에 따른 progress curve를 보려면 sample history buffer가 필요합니다.",
  ],

  refinementPlan: {
    title: "보강 실험 방향",
    summary:
      "v0 결과는 관찰 노드로 보존할 수 있지만, 더 일반적인 GPU probing evidence로 강화하려면 role rotation, repeated trials, progress history sampling, normalized micro-work variants가 필요합니다.",
    items: [
      {
        version: "v1",
        title: "Role rotation",
        goal: "role과 warp_id를 분리해 warp_id 편향 가능성을 줄입니다.",
        question:
          "fast, dependent ALU, shared load, dependent global load의 상대적 ordering이 warp_id 배치가 바뀌어도 유지되는가?",
      },
      {
        version: "v2",
        title: "Repeated trials",
        goal: "동일 config를 여러 번 반복해 ordering과 ratio의 안정성을 확인합니다.",
        question:
          "단일 run이 아니라 여러 run에서도 workload class별 progress signature가 유지되는가?",
      },
      {
        version: "v3",
        title: "Progress history sampling",
        goal: "최종 progress가 아니라 시간에 따른 progress slope를 관찰합니다.",
        question:
          "각 workload class는 초반부터 다른 기울기를 보이는가, 아니면 중간 stall이나 plateau를 만드는가?",
      },
      {
        version: "v4",
        title: "Normalized micro-work variants",
        goal:
          "iter당 work 양 차이를 줄인 변형 실험으로 dependency와 memory hierarchy의 영향을 더 분리합니다.",
        question:
          "유사한 loop body 규모에서도 dependency chain과 memory hierarchy 차이가 progress signature로 드러나는가?",
      },
    ],
  },

  nextExperiments: [
    {
      version: "v1",
      title: "Role rotation",
      goal: "role과 warp_id를 분리해 warp_id 편향 가능성을 줄입니다.",
      question:
        "fast, dependent ALU, shared load, dependent global load의 상대적 ordering이 warp_id 배치가 바뀌어도 유지되는가?",
    },
    {
      version: "v2",
      title: "Repeated trials",
      goal: "동일 config를 여러 번 반복해 ordering과 ratio의 안정성을 확인합니다.",
      question:
        "단일 run이 아니라 여러 run에서도 workload class별 progress signature가 유지되는가?",
    },
    {
      version: "v3",
      title: "Progress history sampling",
      goal: "최종 progress가 아니라 시간에 따른 progress slope를 관찰합니다.",
      question:
        "각 workload class는 초반부터 다른 기울기를 보이는가, 아니면 중간 stall이나 plateau를 만드는가?",
    },
    {
      version: "v4",
      title: "Normalized micro-work variants",
      goal:
        "iter당 work 양 차이를 줄인 변형 실험으로 dependency와 memory hierarchy의 영향을 더 분리합니다.",
      question:
        "유사한 loop body 규모에서도 dependency chain과 memory hierarchy 차이가 progress signature로 드러나는가?",
    },
  ],

  previousObservationId: "same_workload_baseline",
};