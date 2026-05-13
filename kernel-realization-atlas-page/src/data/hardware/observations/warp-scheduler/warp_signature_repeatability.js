export const warpSignatureRepeatabilityObservation = {
  id: "warp_signature_repeatability",
  groupLabel: "Warp Scheduling",
  type: "Signature Validation",
  label: "Warp signature repeatability",
  title: "workload별 warp progress signature 반복성 검증",

  summary:
    "Warp Signature v0에서 관찰된 workload별 progress signature가 단일 run의 우연한 흔들림인지, 동일 조건에서 반복 실행해도 유지되는 안정적인 실행 서명인지 검증한 probe입니다. 새로운 workload class를 추가하는 실험이 아니라, 기존 signature observation의 재현성을 확인하기 위한 validation 단계입니다.",

  keyFindings: [
    {
      label: "Runs",
      value: "64",
      desc: "동일 조건 반복 실행 횟수",
    },
    {
      label: "Signature",
      value: "[588, 560, 478, 466, 588, 561, 479, 466]",
      desc: "64회 run 전체에서 동일하게 재현",
    },
    {
      label: "CV",
      value: "0",
      desc: "모든 warp에서 run-to-run 변동 없음",
    },
    {
      label: "Codegen Use",
      value: "signal validation",
      desc: "v0 signature를 cost signal 후보로 승격",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 새로운 workload class를 추가하는 것이 아니라, Warp Signature v0에서 관찰된 progress signature가 단일 launch의 우연한 흔들림인지 동일 조건에서 반복 가능한 구조적 관찰값인지 검증합니다.",
    question:
      "workload-specific warp progress signature는 동일 조건 반복 실행에서도 유지되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Repeatability gate",
        text:
          "단일 run에서 관찰된 signature는 바로 cost model signal로 쓰기 어렵습니다. 동일 조건 반복 실행에서 유지되는지 확인해야 empirical signal 후보로 승격할 수 있습니다.",
      },
      {
        label: "Run-to-run variation",
        text:
          "GPU 실행은 launch timing, memory state, scheduling phase 등에 따라 흔들릴 수 있습니다. 반복성 검증은 이런 변동이 현재 signature를 설명하는지 확인합니다.",
      },
      {
        label: "Coefficient of variation",
        text:
          "각 warp의 progress 변동을 평균 대비 표준편차로 보는 지표입니다. 이 실험에서는 모든 warp에서 CV가 0으로 관찰되었습니다.",
      },
      {
        label: "Pattern repetition",
        text:
          "warp 0과 4, 1과 5, 2와 6, 3과 7이 유사한 progress를 보인 것은 local_warp_id & 3 기반 workload pattern 반복이 progress signature에 반영되었음을 시사합니다.",
      },
    ],
  },

  notTryingToProve: [
    "GPU scheduler의 내부 issue policy",
    "모든 GPU와 모든 occupancy 조건에서 동일한 signature가 반복된다는 주장",
    "progress ratio가 operation latency ratio와 동일하다는 주장",
    "warp_id 자체에 progress signature가 귀속된다는 주장",
    "이 결과만으로 hard codegen rule을 만들 수 있다는 주장",
  ],

  config: {
    numRuns: 64,
    warmupRuns: 4,
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
  },

  records: [
    {
      block: 0,
      warpId: 0,
      role: "pattern_0_repeat",
      progress: 588,
      lastClock: null,
      sink: null,
      signature:
        "64회 반복 실행 전체에서 동일하게 유지된 pattern 0 계열 높은 progress signature",
    },
    {
      block: 0,
      warpId: 1,
      role: "pattern_1_repeat",
      progress: 560,
      lastClock: null,
      sink: null,
      signature:
        "64회 반복 실행 전체에서 동일하게 유지된 pattern 1 계열 progress signature",
    },
    {
      block: 0,
      warpId: 2,
      role: "pattern_2_repeat",
      progress: 478,
      lastClock: null,
      sink: null,
      signature:
        "64회 반복 실행 전체에서 동일하게 유지된 pattern 2 계열 progress signature",
    },
    {
      block: 0,
      warpId: 3,
      role: "pattern_3_repeat",
      progress: 466,
      lastClock: null,
      sink: null,
      signature:
        "64회 반복 실행 전체에서 동일하게 유지된 pattern 3 계열 낮은 progress signature",
    },
    {
      block: 0,
      warpId: 4,
      role: "pattern_0_repeat",
      progress: 588,
      lastClock: null,
      sink: null,
      signature:
        "warp 0과 같은 pattern 계열로 유사한 높은 progress signature를 반복",
    },
    {
      block: 0,
      warpId: 5,
      role: "pattern_1_repeat",
      progress: 561,
      lastClock: null,
      sink: null,
      signature:
        "warp 1과 같은 pattern 계열로 유사한 progress signature를 반복",
    },
    {
      block: 0,
      warpId: 6,
      role: "pattern_2_repeat",
      progress: 479,
      lastClock: null,
      sink: null,
      signature:
        "warp 2와 같은 pattern 계열로 유사한 progress signature를 반복",
    },
    {
      block: 0,
      warpId: 7,
      role: "pattern_3_repeat",
      progress: 466,
      lastClock: null,
      sink: null,
      signature:
        "warp 3과 같은 pattern 계열로 유사한 낮은 progress signature를 반복",
    },
  ],

  ordering: [
    "pattern_0_repeat",
    "pattern_1_repeat",
    "pattern_2_repeat",
    "pattern_3_repeat",
  ],

  ratios: {
    pattern0VsPattern1: 1.05,
    pattern0VsPattern2: 1.23,
    pattern0VsPattern3: 1.26,
    pattern1VsPattern2: 1.17,
    pattern1VsPattern3: 1.2,
    pattern2VsPattern3: 1.03,
  },

  stats: [
    {
      blockId: 0,
      warpId: 0,
      meanProgress: 588,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 588,
      maxProgress: 588,
    },
    {
      blockId: 0,
      warpId: 1,
      meanProgress: 560,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 560,
      maxProgress: 560,
    },
    {
      blockId: 0,
      warpId: 2,
      meanProgress: 478,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 478,
      maxProgress: 478,
    },
    {
      blockId: 0,
      warpId: 3,
      meanProgress: 466,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 466,
      maxProgress: 466,
    },
    {
      blockId: 0,
      warpId: 4,
      meanProgress: 588,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 588,
      maxProgress: 588,
    },
    {
      blockId: 0,
      warpId: 5,
      meanProgress: 561,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 561,
      maxProgress: 561,
    },
    {
      blockId: 0,
      warpId: 6,
      meanProgress: 479,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 479,
      maxProgress: 479,
    },
    {
      blockId: 0,
      warpId: 7,
      meanProgress: 466,
      variance: 0,
      stddev: 0,
      coefficientOfVariation: 0,
      minProgress: 466,
      maxProgress: 466,
    },
  ],

  interpretation: [
    "동일한 launch shape, 동일한 cycle budget, 동일한 workload pattern 조건에서 64회 반복 실행한 결과, warp별 progress signature가 모든 run에서 동일하게 재현되었습니다.",
    "모든 warp의 coefficient of variation이 0이므로, 현재 조건에서는 run-to-run 변동이 관찰되지 않았습니다.",
    "warp 0과 4, 1과 5, 2와 6, 3과 7이 유사한 progress를 보인 것은 local_warp_id & 3 기반 workload pattern이 progress signature에 반영되었음을 시사합니다.",
    "따라서 v0에서 관찰된 progress 차이는 단일 run noise가 아니라 동일 조건에서 반복 가능한 workload execution signature 후보로 볼 수 있습니다.",
    "codegen 관점에서는 반복성을 통과한 signature만 empirical cost model 후보로 승격할 수 있습니다.",
  ],

  caveats: [
    "단일 block, 동일 launch shape, 동일 cycle budget 조건에서의 반복성 검증입니다.",
    "SM 배치 차이, block scheduling, occupancy 변화까지 일반화하면 안 됩니다.",
    "role과 warp_id가 아직 고정되어 있으므로 signature의 귀속 대상은 permutation probe에서 추가로 분리해야 합니다.",
    "progress ratio는 operation latency ratio가 아니라 workload pattern별 실행 서명입니다.",
    "반복성이 확인되었다고 해서 곧바로 hard codegen rule이 되는 것은 아닙니다.",
  ],

  codegenImpact: {
    targetPattern:
      "probe_cost_model / dependency_aware_cost_model / workload_signature_validation",

    affectedDecision:
      "cost_signal_promotion / kernel_variant_validation / benchmark_repeatability_policy",

    costSignal:
      "동일 조건에서 64회 반복 실행했을 때 workload별 progress signature가 완전히 동일하게 재현되었습니다. 따라서 v0의 progress ordering은 단일 run noise가 아니라 반복 가능한 workload execution signature 후보로 볼 수 있습니다.",

    ruleCandidate:
      "codegen cost model에는 단일 run에서만 관찰된 signature를 바로 넣지 않고, 반복 실행에서 안정적으로 유지되는 signature만 empirical cost signal 후보로 승격합니다. 반복성 검증을 통과한 workload pattern은 후속 permutation과 mixed workload 실험에서 role-based cost signal로 추적합니다.",

    confidence: {
      observation: "high",
      interpretation: "high",
      codegen: "medium",
    },

    reminder:
      "반복성은 codegen rule 자체가 아니라 cost signal 승격 조건입니다. 같은 조건에서 재현되는 signature만 compiler cost model의 후보 신호로 다룹니다.",
  },

  costModelRole: {
    role: "repeatability_validation",

    description:
      "이 probe는 Warp Signature v0에서 얻은 execution signature가 단일 run noise가 아니라 동일 조건에서 반복 가능한 관찰값인지 검증합니다. 반복성이 확인된 signature는 후속 permutation attribution과 mixed composition 실험에서 cost model signal 후보로 사용할 수 있습니다.",

    usedBy: [
      "warp_signature_permutation",
      "mixed_workload_probe",
      "global_memory_contention_amplification_probe",
      "latency_hiding_ratio_probe",
    ],
  },

  measurementReliability: {
    status: "repeatability_validated",

    issue:
      "반복성은 강하게 확인되었지만, 아직 role과 warp_id가 고정된 조건입니다. 따라서 이 signature가 workload pattern을 따라가는지, 아니면 특정 warp_id 또는 position에 고정되는지는 별도 permutation 검증이 필요합니다.",

    impact:
      "현재 조건에서는 run-to-run noise가 사실상 관찰되지 않았으므로, v0 signature를 안정적인 workload execution signature 후보로 다룰 수 있습니다. 다만 hard codegen rule로 고정하려면 attribution과 composition 검증이 추가로 필요합니다.",

    mitigation:
      "다음 단계에서 workload role을 warp_id에 회전 배치하는 permutation probe를 수행해, signature가 warp_id가 아니라 workload pattern assignment를 따라가는지 확인합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "반복성 검증은 cost signal을 신뢰하기 위한 최소 조건입니다.",
      "단일 run observation은 바로 codegen rule이 될 수 없습니다.",
      "반복 실행에서 유지되는 progress signature만 empirical cost model 후보로 승격합니다.",
      "반복성이 확인되어도 warp_id attribution은 아직 별도 검증이 필요합니다.",
      "이 실험은 새로운 workload rule을 만드는 실험이 아니라 v0 signature의 신뢰도를 높이는 validation입니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 repeatability probe는 v0 signature가 단일 run noise가 아님을 확인합니다. 다음 permutation probe에서는 이 반복 가능한 signature가 특정 warp_id에 고정된 것인지, workload pattern assignment를 따라가는 것인지 분리합니다.",
    examples: [
      "permutation probe에서는 workload role을 warp_id에 회전 배치해 signature의 귀속 대상을 확인합니다.",
      "mixed workload probe에서는 반복성과 attribution을 통과한 signature가 mixed composition에서도 유지되는지 확인합니다.",
      "global memory 계열 probe에서는 반복 가능한 dependent_global signature가 ready warp supply와 memory state에 의해 어떻게 변형되는지 확인합니다.",
    ],
  },

  nextStep: {
    label: "Warp Signature Permutation",
    desc:
      "반복 가능한 signature가 확인되었으므로, 다음 단계에서는 해당 signature가 특정 warp_id에 고정된 것인지 workload pattern assignment를 따라가는 것인지 분리합니다.",
    configText:
      "num_permutations = 4\nnum_runs_per_permutation = 16\npattern_assignment = rotated across warp_id",
    metrics: [
      "pattern별 평균 progress",
      "warp_id 이동에 따른 signature 이동 여부",
      "pattern ordering 유지 여부",
      "same-pattern 내부 residual difference",
    ],
  },

  previousObservationId: "warp_execution_signature_v0",
  nextObservationId: "warp_signature_permutation",
};