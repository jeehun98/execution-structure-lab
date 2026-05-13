export const warpExecutionSignatureV0Observation = {
  id: "warp_execution_signature_v0",
  groupLabel: "Warp Scheduling",
  type: "Execution Signature",
  label: "Warp execution signature v0",
  title: "서로 다른 execution pattern이 남기는 warp progress signature",

  summary:
    "동일한 cycle budget 안에서 서로 다른 warp execution pattern이 어떤 progress signature를 남기는지 관찰한 v0 결과입니다. 목적은 단순히 서로 다른 작업의 속도 차이를 확인하는 것이 아니라, dependency structure와 memory hierarchy가 warp-level progress에 어떤 상대적 흔적을 남기는지 해석하는 것입니다.",

  keyFindings: [
    {
      label: "Ordering",
      value: "ALU > Shared > Dep ALU > Global",
      desc: "관찰된 상대 progress ordering",
    },
    {
      label: "Top Progress",
      value: "462,823",
      desc: "fast_independent_alu",
    },
    {
      label: "Lowest Progress",
      value: "10,646",
      desc: "dependent_global_load",
    },
    {
      label: "Codegen Use",
      value: "dependency-aware cost",
      desc: "instruction count만으로는 부족함",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 서로 다른 workload가 단순히 빠르거나 느리다는 사실을 확인하려는 것이 아닙니다. 동일한 cycle budget 안에서 dependency structure, memory hierarchy, address dependency가 warp-level progress에 어떤 상대적 실행 흔적을 남기는지 관찰합니다.",
    question:
      "동일한 cycle budget 안에서 서로 다른 warp execution pattern은 구분 가능한 progress signature를 남기는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 GPU 실행 모델",
    items: [
      {
        label: "Warp-level issue",
        text:
          "GPU scheduler는 개별 thread가 아니라 ready 상태의 warp instruction을 issue합니다. 따라서 progress 차이는 thread-level 속도가 아니라 warp-level execution pattern의 결과로 해석해야 합니다.",
      },
      {
        label: "Dependency chain",
        text:
          "memory access가 없어도 긴 dependent ALU chain은 다음 instruction이 이전 결과를 기다리게 만들 수 있습니다. 이 경우 instruction count가 적어 보여도 progress가 크게 제한될 수 있습니다.",
      },
      {
        label: "Shared memory path",
        text:
          "shared memory 접근은 on-chip memory access 비용을 갖지만, dependency structure가 짧거나 access pattern이 안정적이면 dependent ALU chain보다 높은 progress를 보일 수 있습니다.",
      },
      {
        label: "Global memory dependency",
        text:
          "dependent global load는 global memory latency와 address dependency가 결합되어 다음 access가 이전 load 결과에 의존하는 형태입니다. 이 구조는 latency hiding이 어려운 memory-latency-dominated path를 만들 수 있습니다.",
      },
      {
        label: "Progress signature",
        text:
          "이 실험의 progress 값은 절대적인 operation speed ratio가 아니라, 같은 측정 조건에서 workload class가 남긴 상대적 실행 서명으로 읽어야 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "ALU 연산과 memory 연산의 절대 속도비",
    "모든 GPU에서 동일하게 성립하는 일반 법칙",
    "scheduler의 내부 issue policy",
    "각 workload의 progress ratio가 곧바로 operation latency ratio라는 주장",
    "이 단일 run 결과만으로 확정적인 codegen rule을 만들 수 있다는 주장",
  ],

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
    "각 workload는 iter 1회당 instruction mix가 다르므로, 이 비율은 절대적인 operation speed ratio가 아니라 workload별 상대적 실행 서명으로 해석해야 합니다.",
    "codegen 관점에서는 instruction count만으로 kernel cost를 추정하기 어렵고, dependency depth와 independent instruction availability를 cost model에 포함해야 함을 시사합니다.",
  ],

  caveats: [
    "현재 결과는 단일 run에서 얻은 v0 observation입니다.",
    "role이 warp_id에 고정되어 있으므로 warp_id bias를 완전히 배제하려면 role rotation이 필요합니다.",
    "각 workload는 iter 1회당 instruction mix가 다르므로 progress 값은 절대 속도비가 아니라 실행 서명으로 해석해야 합니다.",
    "fast_independent_alu의 sink 값이 0이므로 result-cancellation 또는 compiler optimization 가능성을 낮추기 위한 보강이 필요합니다.",
    "현재 output은 final progress만 보존하므로 시간에 따른 progress curve를 보려면 sample history buffer가 필요합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "generic_kernel_body / elementwise_chain / reduction_body / memory_dependent_kernel",

    affectedDecision:
      "dependency_aware_cost_model / instruction_interleaving / kernel_variant_selection",

    costSignal:
      "동일한 cycle budget 안에서 independent ALU, dependent ALU chain, shared load, dependent global load는 구분 가능한 warp progress signature를 남겼습니다. 특히 shared_load가 dependent_alu_chain보다 높은 progress를 보였으므로, cost model은 단순 ALU vs memory 분류가 아니라 dependency depth와 independent instruction availability를 함께 고려해야 합니다.",

    ruleCandidate:
      "kernel body의 비용을 instruction count만으로 추정하지 말고, dependency chain 길이, memory dependency 여부, 독립 instruction 공급 가능성을 별도 cost signal로 반영합니다. dependent chain이 긴 kernel은 단순 unroll보다 multiple elements per thread, load/compute interleaving, independent work scheduling을 우선 고려합니다.",

    confidence: {
      observation: "medium-high",
      interpretation: "medium",
      codegen: "medium",
    },

    reminder:
      "이 실험의 핵심은 'ALU가 빠르고 memory가 느리다'가 아닙니다. memory access가 있어도 dependency chain보다 높은 progress를 보일 수 있으므로, codegen cost model은 dependency-aware 해야 합니다.",
  },

  costModelRole: {
    role: "execution_signature_seed",

    description:
      "후속 probe-driven cost model의 첫 번째 workload signature seed입니다. 이 probe는 각 workload class가 동일 cycle budget 안에서 남기는 상대 progress ordering을 제공하며, 이후 repeatability, permutation, mixed workload 검증을 통해 cost signal로 승격될 후보입니다.",

    usedBy: [
      "warp_signature_repeatability",
      "warp_signature_permutation",
      "mixed_workload_probe",
      "ready_warp_supply_probe",
      "latency_hiding_ratio_probe",
    ],
  },

  measurementReliability: {
    status: "needs_validation",

    issue:
      "현재 결과는 단일 run의 v0 observation이며, role이 warp_id에 고정되어 있습니다. 따라서 단일 run noise와 warp_id placement bias를 완전히 배제하려면 반복 실행과 role rotation이 필요합니다.",

    impact:
      "현재 ordering은 execution signature 후보로 사용할 수 있지만, hard codegen rule로 바로 고정하기에는 이릅니다. repeatability와 permutation 검증 이후 cost model signal로 신뢰도를 높일 수 있습니다.",

    mitigation:
      "반복 실행으로 ordering 안정성을 확인하고, role rotation으로 workload signature가 warp_id가 아니라 role assignment를 따라가는지 확인합니다. 또한 progress history sampling을 추가하면 최종 progress뿐 아니라 시간에 따른 slope와 plateau를 확인할 수 있습니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "operation cost는 단순 instruction count가 아닙니다.",
      "ALU vs memory 분류보다 dependency structure가 더 중요한 설명 축이 될 수 있습니다.",
      "dependent chain이 긴 kernel은 단순 unroll보다 independent work interleaving을 먼저 고려합니다.",
      "global memory dependent path는 load count뿐 아니라 address dependency와 latency hiding 가능성을 함께 봐야 합니다.",
      "이 v0 결과는 hard rule이 아니라 repeatability와 permutation 검증 전의 signature seed입니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 v0 observation은 workload별 progress signature의 첫 기준입니다. 후속 repeatability, permutation, mixed workload probe는 이 ordering이 단일 run noise인지, warp_id bias인지, 또는 workload assignment를 따라가는 실행 서명인지 검증합니다.",
    examples: [
      "repeatability probe에서는 동일 config를 반복했을 때 progress ordering이 유지되는지 확인합니다.",
      "permutation probe에서는 role을 warp_id에 회전 배치해 signature가 warp_id가 아니라 workload assignment를 따라가는지 확인합니다.",
      "mixed workload probe에서는 isolated signature가 mixed block composition에서도 유지되는지 확인합니다.",
      "latency hiding 계열 probe에서는 dependent_global_load의 낮은 progress가 ready warp supply에 의해 어떻게 변형되는지 확인합니다.",
    ],
  },

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
  nextObservationId: "warp_signature_repeatability",
};