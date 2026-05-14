export const mixedWorkloadProbeObservation = {
  id: "mixed_workload_probe",
  groupLabel: "Warp Scheduling",
  type: "Composition Probe",
  label: "Mixed workload probe",
  title: "mixed workload composition에서 유지되는 warp progress signature",

  summary:
    "Warp Signature v0, Repeatability, Permutation 검증 이후, 서로 다른 workload가 같은 block 안에서 공존할 때 role별 warp progress signature가 어떻게 유지되거나 변형되는지 관찰한 probe입니다. 이 실험은 isolated workload signature가 mixed composition에서도 유지되는지, 그리고 memory-dependent workload가 run-to-run variability를 증가시키는지 확인합니다.",

  keyFindings: [
    {
      label: "Mixed Ordering",
      value: "light > dep ALU > shared > global",
      desc: "mixed_all_roles에서 role별 ordering 유지",
    },
    {
      label: "Light Baseline",
      value: "593",
      desc: "all_light_alu_baseline 평균 progress",
    },
    {
      label: "Global Mean",
      value: "103.219",
      desc: "mixed_all_roles dependent_global_load 평균 progress",
    },
    {
      label: "Global CV",
      value: "≈ 0.10",
      desc: "memory-dependent role의 높은 run-to-run variability",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 validated and attributed workload signature가 isolated condition에서만 보이는지, 아니면 서로 다른 workload가 같은 block 안에 공존하는 heterogeneous composition에서도 유지되는지 확인합니다. 또한 dependent_global_load role이 낮은 progress뿐 아니라 run-to-run variability까지 남기는지 관찰합니다.",
    question:
      "서로 다른 workload가 같은 block 안에서 공존할 때, role별 warp progress signature는 유지되는가? 그리고 memory-dependent workload는 variability를 키우는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Mixed warp composition",
        text:
          "한 block 안의 warp들이 서로 다른 workload role을 가질 수 있습니다. 이 경우 각 role은 자신의 dependency structure와 memory behavior에 따라 서로 다른 progress signature를 남길 수 있습니다.",
      },
      {
        label: "Ready warp supply",
        text:
          "어떤 warp가 memory wait나 dependency chain에 묶이면 scheduler는 다른 ready warp를 issue할 수 있습니다. 따라서 mixed composition에서는 ready role의 존재가 stalled role의 관찰 signature를 변형할 수 있습니다.",
      },
      {
        label: "Memory-dependent variability",
        text:
          "dependent_global_load는 global memory latency와 address dependency의 영향을 받기 때문에 평균 progress뿐 아니라 run-to-run variability도 커질 수 있습니다.",
      },
      {
        label: "Role-based cost signal",
        text:
          "mixed workload에서는 전체 평균 하나보다 role별 mean, variance, CV, min/max를 분리해서 보는 것이 중요합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler의 내부 issue policy",
    "모든 GPU와 모든 occupancy 조건에서 동일한 mixed ordering이 성립한다는 주장",
    "progress ratio가 operation latency ratio와 동일하다는 주장",
    "global memory bandwidth를 직접 측정했다는 주장",
    "multi-block 또는 multi-SM 조건까지 일반화된 composition behavior",
  ],

  config: {
    numRunsPerScenario: 16,
    numScenarios: 5,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    globalBufferSize: 1_048_576,
  },

  scenarioMap: {
    0: "all_light_alu_baseline",
    1: "light_vs_dependent_alu",
    2: "light_vs_shared_load",
    3: "light_vs_dependent_global_load",
    4: "mixed_all_roles",
  },

  roleMap: {
    0: "light_alu",
    1: "dependent_alu",
    2: "shared_load",
    3: "dependent_global_load",
  },

  roleAggregateStats: [
    {
      scenarioId: 0,
      scenarioName: "all_light_alu_baseline",
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 593,
      variance: 0,
      stddev: 0,
      minProgress: 593,
      maxProgress: 593,
    },
    {
      scenarioId: 1,
      scenarioName: "light_vs_dependent_alu",
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 582.25,
      variance: 0.1875,
      stddev: 0.433013,
      minProgress: 582,
      maxProgress: 583,
    },
    {
      scenarioId: 1,
      scenarioName: "light_vs_dependent_alu",
      roleId: 1,
      roleName: "dependent_alu",
      meanProgress: 536,
      variance: 0,
      stddev: 0,
      minProgress: 536,
      maxProgress: 536,
    },
    {
      scenarioId: 2,
      scenarioName: "light_vs_shared_load",
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 583.891,
      variance: 0.00854492,
      stddev: 0.0924387,
      minProgress: 583,
      maxProgress: 584,
    },
    {
      scenarioId: 2,
      scenarioName: "light_vs_shared_load",
      roleId: 2,
      roleName: "shared_load",
      meanProgress: 325.312,
      variance: 0.00390625,
      stddev: 0.0625,
      minProgress: 325,
      maxProgress: 325,
    },
    {
      scenarioId: 3,
      scenarioName: "light_vs_dependent_global_load",
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 588.188,
      variance: 0.0117188,
      stddev: 0.108253,
      minProgress: 588,
      maxProgress: 588,
    },
    {
      scenarioId: 3,
      scenarioName: "light_vs_dependent_global_load",
      roleId: 3,
      roleName: "dependent_global_load",
      meanProgress: 106.375,
      variance: 0.160156,
      stddev: 0.400195,
      minProgress: 105,
      maxProgress: 106,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 590.812,
      variance: 0.00390625,
      stddev: 0.0625,
      minProgress: 590,
      maxProgress: 590,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      roleId: 1,
      roleName: "dependent_alu",
      meanProgress: 539.688,
      variance: 0,
      stddev: 0,
      minProgress: 539,
      maxProgress: 539,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      roleId: 2,
      roleName: "shared_load",
      meanProgress: 325.625,
      variance: 0.0351562,
      stddev: 0.1875,
      minProgress: 325,
      maxProgress: 325,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      roleId: 3,
      roleName: "dependent_global_load",
      meanProgress: 103.219,
      variance: 0.0244141,
      stddev: 0.15625,
      minProgress: 103,
      maxProgress: 103,
    },
  ],

  ordering: [
    "light_alu",
    "dependent_alu",
    "shared_load",
    "dependent_global_load",
  ],

  ratios: {
    mixedLightVsDependentAlu: 1.09,
    mixedLightVsSharedLoad: 1.81,
    mixedLightVsDependentGlobalLoad: 5.72,
    mixedDependentAluVsSharedLoad: 1.66,
    mixedSharedLoadVsDependentGlobalLoad: 3.15,
  },

  records: [
    {
      block: 0,
      warpId: 0,
      role: "mixed_light_alu",
      progress: 590.812,
      lastClock: null,
      sink: null,
      signature:
        "mixed_all_roles 조건에서 높은 progress를 유지한 light_alu role signature",
    },
    {
      block: 0,
      warpId: 1,
      role: "mixed_dependent_alu",
      progress: 539.688,
      lastClock: null,
      sink: null,
      signature:
        "mixed_all_roles 조건에서 light_alu보다 낮지만 안정적으로 유지된 dependent_alu role signature",
    },
    {
      block: 0,
      warpId: 2,
      role: "mixed_shared_load",
      progress: 325.625,
      lastClock: null,
      sink: null,
      signature:
        "mixed_all_roles 조건에서 dependent_alu보다 낮고 global load보다 안정적인 shared_load role signature",
    },
    {
      block: 0,
      warpId: 3,
      role: "mixed_dependent_global_load",
      progress: 103.219,
      lastClock: null,
      sink: null,
      signature:
        "mixed_all_roles 조건에서 가장 낮은 평균 progress와 높은 variability를 보인 global-memory-dependent role signature",
    },
  ],

  warpScenarioStats: [
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 0,
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 590.875,
      variance: 0.234375,
      stddev: 0.484123,
      coefficientOfVariation: 0.000819332,
      minProgress: 589,
      maxProgress: 591,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 1,
      roleId: 1,
      roleName: "dependent_alu",
      meanProgress: 539.688,
      variance: 0.214844,
      stddev: 0.463512,
      coefficientOfVariation: 0.000858853,
      minProgress: 539,
      maxProgress: 540,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 2,
      roleId: 2,
      roleName: "shared_load",
      meanProgress: 325.438,
      variance: 0.246094,
      stddev: 0.496078,
      coefficientOfVariation: 0.00152434,
      minProgress: 325,
      maxProgress: 326,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 3,
      roleId: 3,
      roleName: "dependent_global_load",
      meanProgress: 103.062,
      variance: 106.684,
      stddev: 10.3288,
      coefficientOfVariation: 0.100219,
      minProgress: 91,
      maxProgress: 117,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 4,
      roleId: 0,
      roleName: "light_alu",
      meanProgress: 590.75,
      variance: 0.3125,
      stddev: 0.559017,
      coefficientOfVariation: 0.000946284,
      minProgress: 589,
      maxProgress: 591,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 5,
      roleId: 1,
      roleName: "dependent_alu",
      meanProgress: 539.688,
      variance: 0.214844,
      stddev: 0.463512,
      coefficientOfVariation: 0.000858853,
      minProgress: 539,
      maxProgress: 540,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 6,
      roleId: 2,
      roleName: "shared_load",
      meanProgress: 325.812,
      variance: 0.277344,
      stddev: 0.526634,
      coefficientOfVariation: 0.00161637,
      minProgress: 325,
      maxProgress: 327,
    },
    {
      scenarioId: 4,
      scenarioName: "mixed_all_roles",
      blockId: 0,
      warpId: 7,
      roleId: 3,
      roleName: "dependent_global_load",
      meanProgress: 103.375,
      variance: 103.234,
      stddev: 10.1604,
      coefficientOfVariation: 0.0982871,
      minProgress: 92,
      maxProgress: 116,
    },
  ],

  interpretation: [
    "혼합 workload 조건에서도 role별 progress ordering은 안정적으로 유지되었습니다.",
    "mixed_all_roles 조건에서 평균 progress ordering은 light_alu > dependent_alu > shared_load > dependent_global_load였습니다.",
    "light_alu는 dependent_global_load와 공존할 때도 baseline에 가깝게 높은 progress를 유지했습니다.",
    "dependent_global_load는 평균 progress가 가장 낮을 뿐 아니라 run-to-run variability가 가장 크게 나타났습니다.",
    "따라서 global memory dependency는 낮은 progress signature와 높은 temporal variability signature를 동시에 남긴다고 해석할 수 있습니다.",
    "codegen 관점에서는 mixed-role kernel의 전체 평균만 보는 것이 아니라 role별 mean, CV, min/max, tail behavior를 분리해서 봐야 합니다.",
  ],

  caveats: [
    "단일 block, 8 warps/block, 고정 launch shape 조건에서의 결과입니다.",
    "synthetic workload 기반 progress signature이므로 절대 처리량이나 일반 scheduler 정책으로 해석하면 안 됩니다.",
    "global memory variability의 원인이 contention인지, ready warp supply인지, address locality인지 아직 분리되지 않았습니다.",
    "mixed composition에서의 ordering은 관찰된 실행 서명이지 operation latency ratio가 아닙니다.",
    "multi-block, multi-SM, 다른 occupancy 조건에서는 재검증이 필요합니다.",
  ],

  codegenImpact: {
    targetPattern:
      "multi_role_block_kernel / mixed_compute_memory_kernel / memory_dependent_kernel",

    affectedDecision:
      "warp_role_composition / role_based_cost_tracking / memory_latency_risk_model / kernel_variant_validation",

    costSignal:
      "mixed workload composition에서도 role별 progress ordering이 유지되었습니다. light_alu는 높은 progress를 유지했고, dependent_global_load는 가장 낮은 평균 progress와 가장 큰 run-to-run variability를 보였습니다. 따라서 mixed-role kernel의 cost model은 role별 평균 progress뿐 아니라 memory-dependent role의 variance와 tail behavior까지 추적해야 합니다.",

    ruleCandidate:
      "heterogeneous warp-role kernel을 생성할 때 각 warp role을 하나의 평균 비용으로 합치지 말고, role별 cost signal을 분리합니다. memory-dependent role이 포함된 variant는 평균 progress뿐 아니라 CV, min/max, tail drop 가능성을 함께 평가합니다. global-load role의 낮은 progress와 높은 variability가 관찰되면 ready warp supply, address locality, latency hiding capacity를 후속 cost factor로 분리합니다.",

    confidence: {
      observation: "high",
      interpretation: "medium-high",
      codegen: "medium-high",
    },

    reminder:
      "mixed kernel에서는 평균 progress만 보면 안 됩니다. global memory dependent role은 낮은 평균과 높은 variability를 동시에 만들 수 있으므로, role별 mean/CV/tail을 분리해서 봐야 합니다.",
  },

  costModelRole: {
    role: "mixed_composition_validation",

    description:
      "이 probe는 v0, repeatability, permutation을 통과한 workload signature가 heterogeneous composition에서도 유지되는지 검증합니다. isolated signature가 mixed condition에서도 완전히 사라지지 않음을 보여주며, memory-dependent role의 variability를 별도 cost signal로 분리해야 한다는 근거를 제공합니다.",

    usedBy: [
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
      "ready_warp_supply_probe",
      "shared_memory_ready_interference_probe",
    ],
  },

  measurementReliability: {
    status: "composition_observed",

    issue:
      "실험은 단일 block, 8 warps/block, 고정 launch shape, synthetic workload 조건에서 수행되었습니다. 따라서 multi-block scheduling, SM placement, occupancy 변화까지 일반화할 수는 없습니다.",

    impact:
      "현재 조건에서는 role별 signature ordering이 mixed composition에서도 유지된다고 해석할 수 있습니다. 또한 dependent_global_load의 variability가 두드러지므로, 이후 global memory 계열 probe를 설계할 근거가 됩니다.",

    mitigation:
      "block 수, role 비율, global buffer size, address locality, ready warp supply를 변화시키는 후속 probe로 global memory variability의 원인을 분리합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "mixed workload에서도 role별 signature ordering은 사라지지 않을 수 있습니다.",
      "heterogeneous kernel은 role별 cost를 분리해서 추적해야 합니다.",
      "dependent_global_load는 평균 progress뿐 아니라 variability signal도 남깁니다.",
      "memory-dependent role이 있는 kernel variant는 mean만 보지 말고 CV, min/max, tail event를 함께 봅니다.",
      "이 결과는 global memory contention, ready warp supply, latency hiding probe로 이어지는 근거입니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 composition probe는 validated workload signature가 mixed condition에서도 유지되는지 확인합니다. dependent_global_load가 낮은 progress와 높은 variability를 보였으므로, 후속 global memory 계열 probe에서는 이 variability의 원인을 contention, ready warp supply, address locality, memory warm state로 분리합니다.",
    examples: [
      "global_memory_contention_amplification_probe에서는 global-load warp 수와 address locality가 global memory signature를 어떻게 바꾸는지 확인합니다.",
      "latency_hiding_ratio_probe에서는 stalled global warp가 있을 때 ready warp가 progress를 얼마나 유지하는지 확인합니다.",
      "ready_warp_supply_probe에서는 ready warp의 수와 종류가 global stalled progress를 어떻게 바꾸는지 확인합니다.",
      "shared_memory_ready_interference_probe에서는 shared-memory ready source가 global stalled role의 variability에 어떤 영향을 주는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Global Memory Contention Amplification",
    desc:
      "mixed workload에서 dependent_global_load가 낮은 평균 progress와 높은 variability를 보였으므로, 다음 단계에서는 global-load warp 수, ready warp supply, address locality가 global memory signature를 어떻게 변형하는지 분리합니다.",
    configText:
      "vary global_load_warp_count\ncompare overlap vs dispersed address pattern\ntrack ready warp supply and global progress variability",
    metrics: [
      "global-load warp 수별 평균 progress",
      "global-load warp 수별 CV",
      "address locality에 따른 progress 차이",
      "ready warp supply 유무에 따른 latency hiding 가능성",
    ],
  },

  previousObservationId: "warp_signature_permutation",
  nextObservationId: "global_memory_contention_amplification_probe",
};