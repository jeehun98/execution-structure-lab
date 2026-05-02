export const mode0BaselineObservation = {
  id: "warp_issue_policy_probe_mode0_baseline",
  label: "Mode 0 baseline",
  title:
    "동일 independent ALU warp 사이의 장기 progress 편향은 관찰되지 않음",

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

  summary:
    "mode 0에서는 단일 block 안의 네 개 warp가 모두 동일한 independent ALU workload를 수행했다. cycle_budget=200,000,000 조건에서 네 warp의 progress는 모두 459,715로 동일했다.",

  interpretation: [
    "동일 조건의 ready warp들 사이에서 관찰 가능한 장기 progress 불균형은 없었다.",
    "warp_id 0이 더 많이 진행되거나, 특정 warp_id가 밀리는 현상은 이 baseline에서는 관찰되지 않았다.",
    "따라서 mode 0은 후속 mode 비교를 위한 baseline으로 사용할 수 있다.",
  ],

  clockObservation: {
    summary:
      "마지막으로 기록된 clock 값은 warp_id 증가 방향으로 4 cycle 간격을 보였다.",
    caveat:
      "이 규칙적인 간격은 최종 기록 시점의 관찰 순서를 시사하지만, scheduler policy 자체를 단정하기에는 부족하다.",
  },

  caveats: [
    "이 결과만으로 scheduler가 round-robin이라고 말할 수 없다.",
    "이 결과만으로 scheduler가 항상 warp_id 순서로 issue한다고 말할 수 없다.",
    "sink 값이 모두 0이므로 anti-optimization 관점에서는 ALU result reduction을 강화할 필요가 있다.",
  ],

  nextStep: {
    label: "Mode 1 dependent vs independent 비교",
    configText: `mode=1
blocks=1
cycle_budget=200000000
sample_period=256
global_elements=16777216
output=results/raw/warp_issue_policy_probe_mode1.json`,
    metrics: [
      "dependent_alu progress / mean(independent_alu progress)",
      "independent_alu warp들 사이의 progress spread",
      "last_clock order",
      "sink 값이 0으로 고정되는지 여부",
    ],
  },

  suggestedPatch: {
    title: "sink cancellation 완화",
    before: `return a0 ^ a1 ^ a2 ^ a3;`,
    after: `return (a0 * 3u) ^ (a1 * 5u) ^ (a2 * 7u) ^ (a3 * 11u) ^ x;`,
  },
};