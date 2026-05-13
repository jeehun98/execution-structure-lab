export const warpSignaturePermutationObservation = {
  id: "warp_signature_permutation",
  groupLabel: "Warp Scheduling",
  type: "Signature Attribution",
  label: "Warp signature permutation",
  title: "workload pattern assignment를 따라 이동하는 warp progress signature",

  summary:
    "Warp Signature Repeatability에서 안정적으로 재현된 progress signature가 특정 warp_id에 고정된 것인지, 아니면 workload pattern assignment를 따라 이동하는지 확인한 attribution probe입니다. workload pattern을 warp id에 회전 배치한 결과, 높은 progress와 낮은 progress의 위치가 warp_id에 고정되지 않고 pattern assignment를 따라 이동했습니다.",

  keyFindings: [
    {
      label: "Question",
      value: "pattern vs warp_id",
      desc: "signature의 귀속 대상 확인",
    },
    {
      label: "Ordering",
      value: "0 > 1 > 2 > 3",
      desc: "permutation 이후에도 pattern별 ordering 유지",
    },
    {
      label: "Top Pattern",
      value: "584.094",
      desc: "pattern 0 평균 progress",
    },
    {
      label: "Codegen Use",
      value: "role-based cost",
      desc: "warp_id가 아니라 workload role 기준으로 cost signal 추적",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 반복 실행에서 안정적으로 관찰된 warp progress signature가 특정 warp_id 또는 warp position의 효과인지, 아니면 workload pattern 자체의 효과인지 분리합니다. 이를 위해 workload pattern assignment를 warp_id에 회전 배치하고, 높은 progress와 낮은 progress가 warp_id에 고정되는지 pattern assignment를 따라 이동하는지 확인합니다.",
    question:
      "progress signature는 workload pattern을 따라가는가, 아니면 특정 warp_id 또는 warp position에 고정되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Warp role assignment",
        text:
          "같은 block 안의 warp들은 서로 다른 workload role을 부여받을 수 있습니다. codegen 관점에서는 warp_id 자체보다 해당 warp에 어떤 role과 execution pattern이 배정되었는지가 더 중요합니다.",
      },
      {
        label: "Permutation attribution",
        text:
          "workload pattern을 여러 warp_id 위치로 회전 배치하면, progress signature가 고정 warp_id를 따라가는지 workload pattern을 따라가는지 분리할 수 있습니다.",
      },
      {
        label: "Pattern aggregate",
        text:
          "각 pattern이 여러 warp_id에 배치되었을 때의 평균 progress를 모으면, signature가 pattern 자체에 귀속되는지 확인할 수 있습니다.",
      },
      {
        label: "Residual position effect",
        text:
          "같은 pattern 내부에서도 작은 progress 차이가 남을 수 있습니다. 이는 warp position, timing boundary, measurement noise, clock64 기록 시점 등의 잔여 효과로 남겨두는 것이 안전합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler의 내부 issue policy",
    "특정 warp_id가 항상 빠르거나 느리다는 주장",
    "모든 GPU와 모든 occupancy 조건에서 동일한 ordering이 성립한다는 주장",
    "progress ratio가 operation latency ratio와 동일하다는 주장",
    "multi-SM, multi-block 조건까지 일반화된 signature attribution",
  ],

  config: {
    numRunsPerPermutation: 16,
    numPermutations: 4,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
  },

  patternAggregateStats: [
    {
      patternId: 0,
      meanProgress: 584.094,
      variance: 1.05762,
      stddev: 1.02841,
      minProgress: 582,
      maxProgress: 585,
    },
    {
      patternId: 1,
      meanProgress: 558.82,
      variance: 0.854919,
      stddev: 0.924619,
      minProgress: 557,
      maxProgress: 560,
    },
    {
      patternId: 2,
      meanProgress: 476.594,
      variance: 0.245117,
      stddev: 0.495093,
      minProgress: 475,
      maxProgress: 477,
    },
    {
      patternId: 3,
      meanProgress: 467.719,
      variance: 0.174805,
      stddev: 0.418097,
      minProgress: 467,
      maxProgress: 468,
    },
  ],

  ordering: ["pattern_0", "pattern_1", "pattern_2", "pattern_3"],

  ratios: {
    pattern0VsPattern1: 1.05,
    pattern0VsPattern2: 1.23,
    pattern0VsPattern3: 1.25,
    pattern1VsPattern2: 1.17,
    pattern1VsPattern3: 1.19,
    pattern2VsPattern3: 1.02,
  },

  records: [
    {
      block: 0,
      warpId: 0,
      role: "perm0_pattern0",
      progress: 582,
      lastClock: null,
      sink: null,
      signature:
        "permutation 0에서 pattern 0이 warp 0에 배치되었을 때 높은 progress signature",
    },
    {
      block: 0,
      warpId: 3,
      role: "perm1_pattern0",
      progress: 584.875,
      lastClock: null,
      sink: null,
      signature:
        "permutation 1에서 pattern 0이 warp 3으로 이동했을 때 높은 progress도 함께 이동",
    },
    {
      block: 0,
      warpId: 2,
      role: "perm2_pattern0",
      progress: 584,
      lastClock: null,
      sink: null,
      signature:
        "permutation 2에서 pattern 0이 warp 2로 이동했을 때 높은 progress 유지",
    },
    {
      block: 0,
      warpId: 1,
      role: "perm3_pattern0",
      progress: 584,
      lastClock: null,
      sink: null,
      signature:
        "permutation 3에서 pattern 0이 warp 1로 이동했을 때 높은 progress 유지",
    },
    {
      block: 0,
      warpId: 3,
      role: "perm0_pattern3",
      progress: 468,
      lastClock: null,
      sink: null,
      signature:
        "permutation 0에서 pattern 3이 warp 3에 배치되었을 때 낮은 progress signature",
    },
    {
      block: 0,
      warpId: 2,
      role: "perm1_pattern3",
      progress: 467.875,
      lastClock: null,
      sink: null,
      signature:
        "permutation 1에서 pattern 3이 warp 2로 이동했을 때 낮은 progress도 함께 이동",
    },
    {
      block: 0,
      warpId: 1,
      role: "perm2_pattern3",
      progress: 468,
      lastClock: null,
      sink: null,
      signature:
        "permutation 2에서 pattern 3이 warp 1로 이동했을 때 낮은 progress 유지",
    },
    {
      block: 0,
      warpId: 0,
      role: "perm3_pattern3",
      progress: 467,
      lastClock: null,
      sink: null,
      signature:
        "permutation 3에서 pattern 3이 warp 0으로 이동했을 때 낮은 progress 유지",
    },
  ],

  warpPermutationStats: [
    {
      permutationId: 0,
      blockId: 0,
      warpId: 0,
      patternId: 0,
      meanProgress: 582,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 582,
      maxProgress: 582,
    },
    {
      permutationId: 0,
      blockId: 0,
      warpId: 1,
      patternId: 1,
      meanProgress: 560,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 560,
      maxProgress: 560,
    },
    {
      permutationId: 0,
      blockId: 0,
      warpId: 2,
      patternId: 2,
      meanProgress: 476,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 476,
      maxProgress: 476,
    },
    {
      permutationId: 0,
      blockId: 0,
      warpId: 3,
      patternId: 3,
      meanProgress: 468,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 468,
      maxProgress: 468,
    },
    {
      permutationId: 1,
      blockId: 0,
      warpId: 3,
      patternId: 0,
      meanProgress: 584.875,
      variance: 0.234375,
      stddev: 0.484123,
      coefficientOfVariation: 0.000827737,
      minProgress: 583,
      maxProgress: 585,
    },
    {
      permutationId: 1,
      blockId: 0,
      warpId: 0,
      patternId: 1,
      meanProgress: 558.75,
      variance: 0.9375,
      stddev: 0.968246,
      coefficientOfVariation: 0.00173288,
      minProgress: 555,
      maxProgress: 559,
    },
    {
      permutationId: 1,
      blockId: 0,
      warpId: 1,
      patternId: 2,
      meanProgress: 475.875,
      variance: 0.234375,
      stddev: 0.484123,
      coefficientOfVariation: 0.00101733,
      minProgress: 474,
      maxProgress: 476,
    },
    {
      permutationId: 1,
      blockId: 0,
      warpId: 2,
      patternId: 3,
      meanProgress: 467.875,
      variance: 0.234375,
      stddev: 0.484123,
      coefficientOfVariation: 0.00103473,
      minProgress: 466,
      maxProgress: 468,
    },
    {
      permutationId: 2,
      blockId: 0,
      warpId: 2,
      patternId: 0,
      meanProgress: 584,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 584,
      maxProgress: 584,
    },
    {
      permutationId: 2,
      blockId: 0,
      warpId: 3,
      patternId: 1,
      meanProgress: 557,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 557,
      maxProgress: 557,
    },
    {
      permutationId: 2,
      blockId: 0,
      warpId: 0,
      patternId: 2,
      meanProgress: 477,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 477,
      maxProgress: 477,
    },
    {
      permutationId: 2,
      blockId: 0,
      warpId: 1,
      patternId: 3,
      meanProgress: 468,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 468,
      maxProgress: 468,
    },
    {
      permutationId: 3,
      blockId: 0,
      warpId: 1,
      patternId: 0,
      meanProgress: 584,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 584,
      maxProgress: 584,
    },
    {
      permutationId: 3,
      blockId: 0,
      warpId: 2,
      patternId: 1,
      meanProgress: 559,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 559,
      maxProgress: 559,
    },
    {
      permutationId: 3,
      blockId: 0,
      warpId: 3,
      patternId: 2,
      meanProgress: 477,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 477,
      maxProgress: 477,
    },
    {
      permutationId: 3,
      blockId: 0,
      warpId: 0,
      patternId: 3,
      meanProgress: 467,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 467,
      maxProgress: 467,
    },
  ],

  interpretation: [
    "workload pattern을 warp_id에 회전 배치했을 때, 높은 progress와 낮은 progress가 특정 warp_id에 고정되지 않고 pattern assignment를 따라 이동했습니다.",
    "pattern 0은 permutation 0에서 warp 0과 4에 배치되었고, permutation 1에서는 warp 3과 7, permutation 2에서는 warp 2와 6, permutation 3에서는 warp 1과 5로 이동했습니다. 높은 progress도 이 이동을 따라갔습니다.",
    "pattern 3 역시 permutation이 바뀌어도 낮은 progress signature를 유지했습니다.",
    "따라서 현재 조건에서 progress signature는 warp_id 자체보다 workload pattern에 더 강하게 귀속된다고 해석할 수 있습니다.",
    "codegen 관점에서는 특정 warp_id를 빠르거나 느린 실행 단위로 취급하기보다, warp에 배정된 role과 workload structure를 기준으로 cost signal을 추적해야 합니다.",
  ],

  caveats: [
    "같은 pattern 내부에서도 1~3 progress 정도의 작은 차이가 남아 있습니다.",
    "warp position, timing boundary, clock64 기록 시점, measurement noise 가능성이 완전히 제거된 것은 아닙니다.",
    "실험은 단일 block, 8 warps/block, 동일 launch shape 조건에서 수행되었습니다.",
    "SM 배치, block scheduling, occupancy 변화까지 일반화해서 해석하면 안 됩니다.",
    "progress ratio는 operation latency ratio가 아니라 workload pattern별 실행 서명입니다.",
  ],

  codegenImpact: {
    targetPattern:
      "warp_role_assignment / multi_role_block_kernel / dependency_aware_cost_model",

    affectedDecision:
      "workload_to_warp_mapping / role_based_cost_tracking / kernel_variant_validation",

    costSignal:
      "permutation 이후에도 progress ordering이 warp_id가 아니라 workload pattern assignment를 따라 이동했습니다. 따라서 probe-derived cost signal은 고정 warp_id가 아니라 warp role과 assigned execution pattern을 기준으로 추적해야 합니다.",

    ruleCandidate:
      "kernel codegen은 특정 warp_id에 성능 의미를 부여하지 말고, 각 warp에 배정된 role과 workload structure를 기준으로 cost를 추정합니다. role rotation 이후에도 유지되는 signature만 cost model signal로 승격합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium-high",
    },

    reminder:
      "warp_id가 아니라 warp role을 보라. codegen cost model은 'warp 0이 빠르다'가 아니라 '이 workload role이 이런 signature를 남긴다'로 기록해야 합니다.",
  },

  costModelRole: {
    role: "signature_attribution_validation",

    description:
      "이 probe는 v0와 repeatability에서 관찰된 progress signature의 귀속 대상을 검증합니다. signature가 특정 warp_id에 고정되지 않고 workload pattern assignment를 따라 이동함을 보여주므로, 후속 cost model은 warp_id 기반이 아니라 role/workload-pattern 기반으로 작성될 수 있습니다.",

    usedBy: [
      "mixed_workload_probe",
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
      "ready_warp_supply_probe",
    ],
  },

  measurementReliability: {
    status: "validated_attribution",

    issue:
      "실험은 1 block, 8 warps/block, 동일 launch shape 조건에서 수행되었습니다. 따라서 block scheduling, multi-SM placement, occupancy 변화까지 일반화할 수는 없습니다.",

    impact:
      "현재 조건에서는 progress signature가 warp_id보다 workload pattern에 강하게 귀속된다고 해석할 수 있습니다. 이 덕분에 후속 mixed workload 실험에서 role별 progress signature를 의미 있는 cost signal로 다룰 수 있습니다.",

    mitigation:
      "다른 block 수, 다른 occupancy 조건, 다른 SM 배치 조건에서도 동일한 attribution이 유지되는지 확인하면 일반성이 강화됩니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "특정 warp_id에 성능 의미를 부여하지 말고, warp role과 workload assignment를 기준으로 해석합니다.",
      "role rotation을 통과한 signature만 cost model signal로 승격합니다.",
      "warp-level codegen에서는 role assignment와 workload structure가 비용 추정의 기본 단위입니다.",
      "같은 pattern 내부의 작은 차이는 measurement noise, position effect, timing boundary 가능성으로 남겨둡니다.",
      "이 실험은 hard scheduling policy를 밝힌 것이 아니라, signature attribution을 검증한 것입니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 attribution probe는 workload signature가 warp_id에 고정된 artifact가 아니라는 점을 확인합니다. 따라서 이후 mixed workload, global memory contention, latency hiding 계열 실험에서는 role별 progress 차이를 workload-pattern 기반 cost signal로 해석할 수 있습니다.",
    examples: [
      "mixed workload probe에서는 서로 다른 workload가 같은 block 안에서 공존할 때 role별 signature ordering이 유지되는지 확인합니다.",
      "global memory contention amplification에서는 global-load warp 수와 ready warp supply가 pattern별 signature를 어떻게 변형하는지 확인합니다.",
      "latency hiding ratio probe에서는 memory-stalled warp가 있을 때 ready warp role이 빈 issue 기회를 어떻게 채우는지 확인합니다.",
      "ready warp supply probe에서는 ready warp의 수뿐 아니라 ready source의 종류가 signature를 어떻게 바꾸는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Mixed Workload Probe",
    desc:
      "signature가 workload pattern에 귀속됨을 확인했으므로, 다음 단계에서는 서로 다른 workload가 같은 block 안에서 공존할 때 role별 signature ordering이 유지되는지 확인합니다.",
    configText:
      "roles = [light_alu, dependent_alu, shared_load, dependent_global_load]\ncomposition = mixed roles in same block",
    metrics: [
      "role별 평균 progress",
      "role별 ordering 유지 여부",
      "dependent_global_load variability",
      "mixed composition에서 signature 보존 여부",
    ],
  },

  previousObservationId: "warp_signature_repeatability",
  nextObservationId: "mixed_workload_probe",
};