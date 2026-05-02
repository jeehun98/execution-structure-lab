export const mode0BaselineObservation = {
  id: "warp_issue_policy_probe_mode0_baseline",
  groupLabel: "Warp Scheduling",
  type: "Baseline",
  label: "Mode 0 baseline",
  title:
    "동일 workload warp 집합에서 scheduler-visible progress 편향은 관찰되지 않음",

  summary:
    "mode 0은 warp_issue_policy_probe의 균등 workload baseline이다. 단일 block 안의 네 warp가 모두 동일한 independent ALU workload를 수행했으며, cycle_budget=200,000,000 조건에서 네 warp의 progress는 모두 459,715로 동일했다.",

  probeContext: {
    title: "이 probe가 실제로 묻는 질문",
    body:
      "이 실험은 warp가 독립적인 실행 단위로 존재한다는 사실을 새로 확인하려는 것이 아니다. 이미 알려진 warp execution model을 전제로 두고, 같은 block 안의 warp들에게 서로 다른 workload class를 부여했을 때 progress 분포가 어떻게 달라지는지를 관찰한다.",
    question:
      "scheduler 앞에 compute-ready, dependency-limited, shared-load, global-load warp가 함께 놓이면, 동일한 cycle budget 안에서 각 workload class의 completion progress는 어떻게 갈라지는가?",
  },

  knownMechanisms: {
    title: "실험 전에 알고 들어가는 GPU 실행 모델",
    items: [
      {
        label: "Warp execution",
        text:
          "CUDA thread는 보통 32개 단위의 warp로 묶여 실행된다. 이 실험은 128 threads per block을 사용하므로 단일 block 안에 네 개 warp가 존재한다.",
      },
      {
        label: "Ready warp issue",
        text:
          "Scheduler는 개별 thread가 아니라 실행 가능한 warp의 instruction을 issue한다. 따라서 이 실험의 progress는 thread-level 속도가 아니라 warp-level workload progress로 읽어야 한다.",
      },
      {
        label: "Latency hiding",
        text:
          "특정 warp가 dependency나 memory wait로 stall되면 scheduler는 다른 ready warp를 issue해 빈 시간을 메우려 한다. 이 실험은 그 반응이 progress 분포에 어떻게 드러나는지 본다.",
      },
      {
        label: "Workload class",
        text:
          "independent_alu, dependent_alu, shared_load, global_load는 단순히 다른 함수가 아니라 서로 다른 readiness, dependency, memory latency 특성을 대표한다.",
      },
      {
        label: "Control baseline",
        text:
          "mode 0은 네 warp가 모두 동일한 independent_alu workload를 수행하는 대칭 조건이다. 후속 mode에서 나타나는 차이를 workload type 차이로 읽기 위한 기준선이다.",
      },
    ],
  },

  notTryingToProve: [
    "warp가 독립적인 실행 단위로 존재한다는 CUDA 실행 모델 자체",
    "scheduler가 정확히 round-robin이라는 주장",
    "scheduler가 항상 warp_id 순서로 issue한다는 주장",
    "block=1 결과가 모든 GPU와 모든 occupancy 조건에 일반화된다는 주장",
    "progress 차이가 오직 scheduler policy 하나만으로 결정된다는 주장",
  ],

  config: {
    mode: 0,
    blocks: 1,
    cycleBudget: 200_000_000,
    samplePeriod: 256,
    globalElements: 16_777_216,
  },

  records: [
    {
      warpId: 0,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_019,
      sink: 0,
    },
    {
      warpId: 1,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_023,
      sink: 0,
    },
    {
      warpId: 2,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_027,
      sink: 0,
    },
    {
      warpId: 3,
      role: "independent_alu",
      progress: 459_715,
      lastClock: 731_843_361_031,
      sink: 0,
    },
  ],

  interpretation: [
    "이 결과는 warp들이 각자 독립적으로 실행된다는 자명한 사실을 확인하기 위한 것이 아니라, 동일 workload class를 가진 warp들 사이의 기본 progress 편향을 확인하기 위한 baseline이다.",
    "warp_id 0, 1, 2, 3 사이에서 장기 progress 차이가 관찰되지 않았으므로, 후속 mode에서 나타나는 progress 차이는 warp_id 자체보다 workload type 차이와 연결해 해석할 수 있다.",
    "따라서 mode 0은 dependent ALU, shared load, global load warp를 섞은 mode 1~4 결과를 비교하기 위한 기준선으로 사용할 수 있다.",
  ],

  clockObservation: {
    summary:
      "마지막으로 기록된 clock 값은 warp_id 증가 방향으로 4 cycle 간격을 보였다.",
    values: [
      "warp 0 → 731,843,361,019",
      "warp 1 → 731,843,361,023",
      "warp 2 → 731,843,361,027",
      "warp 3 → 731,843,361,031",
    ],
    caveat:
      "이 간격은 최종 기록 시점에서 warp별 lane 0 store가 거의 연속적으로 발생했음을 보여주는 단서에 가깝다. 이 결과만으로 scheduler가 warp_id 순서로 issue한다고 해석해서는 안 된다.",
  },

  caveats: [
    "mode 0은 모든 warp가 동일한 independent ALU workload를 수행하는 대칭 조건이므로, scheduler의 세부 issue policy를 판별하기에는 정보량이 제한적이다.",
    "이 결과만으로 scheduler가 round-robin이라고 말할 수 없다.",
    "이 결과만으로 scheduler가 항상 warp_id 순서로 issue한다고 말할 수 없다.",
    "sink 값이 모두 0이므로 anti-optimization 및 result-cancellation 확인을 위해 ALU result reduction을 강화할 필요가 있다.",
    "현재 sample_period는 중간 sample history를 보존하지 않고 같은 output slot을 덮어쓰므로, 시간에 따른 progress curve를 보려면 별도 sample buffer가 필요하다.",
  ],

  comparisonPurpose: {
    title: "mode 0을 후속 mode와 비교하는 방식",
    summary:
      "mode 0은 동일 independent_alu warp들의 progress baseline이다. mode 1~4에서는 각 warp의 progress를 이 기준과 비교해 workload class별 실행 반응을 읽는다.",
    examples: [
      "mode 1에서 dependent_alu warp의 progress가 낮아지면 dependency-limited workload의 영향을 mode 0 대비로 읽을 수 있다.",
      "mode 3에서 global_load warp의 progress만 낮고 independent_alu warp들이 유지된다면 memory-stalled warp를 scheduler가 ready ALU warp로 우회했을 가능성을 볼 수 있다.",
      "mode 4에서는 dependent_alu, independent_alu, shared_load, global_load가 함께 있을 때 workload class별 progress 분포를 mode 0 기준으로 정규화할 수 있다.",
    ],
  },

  nextStep: {
    label: "Mode 1 dependent vs independent 비교",
    desc:
      "mode 1에서는 warp 0만 dependent_alu로 바꾸고 나머지 warp는 independent_alu로 유지한다. 이를 통해 dependency chain을 가진 warp와 compute-ready warp 사이의 progress 차이를 본다.",
    configText: `mode=1
blocks=1
cycle_budget=200000000
sample_period=256
global_elements=16777216
output=results/raw/warp_issue_policy_probe_mode1.json`,
    metrics: [
      "dependent_alu progress / mode0 independent_alu baseline progress",
      "dependent_alu progress / mean(independent_alu progress)",
      "independent_alu warp들 사이의 progress spread",
      "last_clock order",
      "sink 값이 0으로 고정되는지 여부",
    ],
  },

  suggestedPatch: {
    title: "sink cancellation 완화",
    desc:
      "현재 mode 0 결과에서 sink가 모두 0으로 기록되므로, result-cancellation 가능성을 낮추기 위해 reduction 식을 비대칭적으로 바꾼다.",
    before: `return a0 ^ a1 ^ a2 ^ a3;`,
    after: `return (a0 * 3u) ^ (a1 * 5u) ^ (a2 * 7u) ^ (a3 * 11u) ^ x;`,
  },
};

export const hardwareObservations = [mode0BaselineObservation];

export function findHardwareObservationById(id) {
  return hardwareObservations.find((observation) => observation.id === id);
}