export const sameWorkloadBaselineObservation = {
  id: "same_workload_baseline",
  groupLabel: "Warp Scheduling",
  type: "Baseline",
  label: "Same workload baseline",
  title: "동일 workload 조건에서 warp progress 기준선 설정",

  summary:
    "동일한 independent ALU workload를 여러 warp에 부여해, workload 차이가 없는 조건에서 warp progress가 어떤 기준 형태로 정렬되는지 관찰합니다. 이 baseline은 후속 execution signature probe에서 나타나는 progress 차이를 warp_id 자체의 편향이 아니라 workload structure, dependency, memory access pattern의 차이로 해석하기 위한 기준선입니다.",

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 warp가 독립적인 실행 단위로 존재한다는 사실을 새로 증명하려는 것이 아닙니다. 이미 알려진 warp execution model을 전제로 두고, workload 차이가 없는 대칭 조건에서 progress가 어떻게 정렬되는지를 먼저 확인합니다. 이를 통해 후속 execution signature probe에서 나타나는 차이를 warp_id 자체의 편향이 아니라 execution pattern 차이로 해석할 수 있는 기준을 마련합니다.",
    question:
      "모든 warp가 같은 independent ALU workload를 수행할 때, 장기 실행에서 warp 간 progress는 의미 있게 갈라지는가, 아니면 비교 가능한 기준선으로 정렬되는가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 GPU 실행 모델",
    items: [
      {
        label: "Warp execution",
        text:
          "CUDA thread는 보통 32개 단위의 warp로 묶여 실행됩니다. 이 실험은 128 threads per block을 사용하므로 단일 block 안에 네 개 warp가 존재합니다.",
      },
      {
        label: "Warp-level progress",
        text:
          "Scheduler는 개별 thread가 아니라 실행 가능한 warp의 instruction을 issue합니다. 따라서 이 실험의 progress는 thread-level 속도가 아니라 warp-level workload completion progress로 읽어야 합니다.",
      },
      {
        label: "Ready warp issue",
        text:
          "특정 warp가 dependency나 memory wait로 stall되면 scheduler는 다른 ready warp를 issue할 수 있습니다. 하지만 이 baseline은 네 warp가 모두 동일한 independent ALU workload를 수행하므로, workload class 차이에서 오는 progress divergence를 의도적으로 제거한 조건입니다.",
      },
      {
        label: "Workload symmetry",
        text:
          "이 baseline의 핵심은 모든 warp에 같은 execution pattern을 부여하는 것입니다. 이 대칭 조건에서 progress가 크게 갈라지지 않는다면, 후속 실험의 차이는 warp_id보다 workload type 차이와 연결해 해석할 수 있습니다.",
      },
      {
        label: "Control baseline",
        text:
          "이 실험은 결론 자체보다 비교 기준으로서 중요합니다. dependent ALU, shared load, global load를 섞은 후속 probe의 progress 분포를 해석하기 위한 zero-difference reference 역할을 합니다.",
      },
    ],
  },

  notTryingToProve: [
    "warp가 독립적인 실행 단위로 존재한다는 CUDA 실행 모델 자체",
    "scheduler가 정확히 round-robin이라는 주장",
    "scheduler가 항상 warp_id 순서로 issue한다는 주장",
    "단일 block 결과가 모든 GPU와 모든 occupancy 조건에 그대로 일반화된다는 주장",
    "progress 차이가 오직 scheduler policy 하나만으로 결정된다는 주장",
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
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_019,
      sink: 0,
    },
    {
      block: 0,
      warpId: 1,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_023,
      sink: 0,
    },
    {
      block: 0,
      warpId: 2,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_027,
      sink: 0,
    },
    {
      block: 0,
      warpId: 3,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_031,
      sink: 0,
    },
  ],

  interpretation: [
    "이 결과는 warp들이 독립 실행 단위라는 사실을 확인하기 위한 것이 아니라, 동일 workload class 조건에서 warp progress가 어떤 기준 형태로 정렬되는지 확인하기 위한 baseline입니다.",
    "warp_id 0, 1, 2, 3 사이에서 장기 progress 차이가 관찰되지 않았으므로, 후속 probe에서 나타나는 progress divergence는 warp_id 자체보다 workload type, dependency structure, memory access pattern의 차이와 연결해 해석할 수 있습니다.",
    "따라서 이 baseline은 dependent ALU, shared load, global load warp를 섞은 후속 실험에서 operation class별 실행 반응을 정규화하고 비교하기 위한 기준선으로 사용됩니다.",
  ],

  clockObservation: {
    summary:
      "마지막으로 기록된 clock 값은 warp_id 증가 방향으로 4 cycle 간격을 보였습니다.",
    values: [
      "warp 0 → 731,843,361,019",
      "warp 1 → 731,843,361,023",
      "warp 2 → 731,843,361,027",
      "warp 3 → 731,843,361,031",
    ],
    caveat:
      "이 간격은 최종 기록 시점에서 warp별 lane 0 store가 거의 연속적으로 발생했음을 보여주는 관찰값입니다. 하지만 이 결과만으로 scheduler가 warp_id 순서로 issue한다고 해석해서는 안 됩니다.",
  },

  caveats: [
    "모든 warp가 동일한 independent ALU workload를 수행하는 대칭 조건이므로, scheduler의 세부 issue policy를 판별하기에는 정보량이 제한적입니다.",
    "이 결과만으로 scheduler가 round-robin이라고 말할 수 없습니다.",
    "이 결과만으로 scheduler가 항상 warp_id 순서로 issue한다고 말할 수 없습니다.",
    "sink 값이 모두 0이므로 anti-optimization 및 result-cancellation 확인을 위해 ALU result reduction을 강화할 필요가 있습니다.",
    "현재 sample_period는 중간 sample history를 보존하지 않고 같은 output slot을 덮어쓰므로, 시간에 따른 progress curve를 보려면 별도 sample buffer가 필요합니다.",
  ],

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 baseline은 동일 independent ALU warp들의 progress 기준선입니다. 후속 execution signature probe에서는 각 warp의 progress를 이 기준과 비교해 workload class별 실행 반응을 읽습니다. 핵심은 특정 GPU의 단일 수치를 일반화하는 것이 아니라, 같은 측정 틀 안에서 execution pattern별 상대적 progress signature를 비교하는 것입니다.",
    examples: [
      "dependent ALU warp의 progress가 baseline보다 낮아지면, dependency chain이 warp-level progress를 얼마나 제한하는지 읽을 수 있습니다.",
      "shared load warp가 dependent ALU보다 높은 progress를 보이면, 단순한 ALU vs memory 구분보다 dependency structure와 memory hierarchy가 더 중요한 설명 축이 될 수 있습니다.",
      "global load warp의 progress가 크게 낮아지고 independent ALU warp들이 유지된다면, memory-stalled warp를 scheduler가 ready ALU warp로 우회했을 가능성을 해석할 수 있습니다.",
      "mixed workload 조건에서는 independent ALU, dependent ALU, shared load, global load가 남기는 progress 분포를 baseline 기준으로 정규화할 수 있습니다.",
    ],
  },

  nextObservationId: "warp_execution_signature_v0",

  suggestedPatch: {
    title: "sink cancellation 완화",
    desc:
      "현재 baseline 결과에서 sink가 모두 0으로 기록되므로, result-cancellation 가능성을 낮추기 위해 reduction 식을 비대칭적으로 바꿉니다.",
    before: `return a0 ^ a1 ^ a2 ^ a3;`,
    after: `return (a0 * 3u) ^ (a1 * 5u) ^ (a2 * 7u) ^ (a3 * 11u) ^ x;`,
  },
};