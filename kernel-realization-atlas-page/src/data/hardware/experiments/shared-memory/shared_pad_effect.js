const sharedPadEffect = {
  id: "shared-pad-effect",
  category: "Shared Memory",
  label: "Shared Padding Effect",
  summary:
    "Shared memory layout에 padding을 삽입했을 때 stride별 latency spike가 어떻게 변하는지 비교합니다. 이 실험은 기존 stride sweep에서 보인 병목이 실제 bank mapping 문제였는지 더 직접적으로 확인하기 위한 probe입니다.",

  question:
    "기존 shared stride sweep에서 관찰된 latency spike는 padding 적용 후 완화되는가, 아니면 여전히 유사한 위치와 강도로 유지되는가?",

  whyItMatters:
    "Padding은 shared bank conflict를 줄이기 위한 대표적인 layout transformation입니다. 따라서 이 실험은 baseline curve에서 보인 spike가 단순 loop overhead나 instruction mix가 아니라 실제 bank alignment 문제였는지를 확인하는 직접적인 기준점이 됩니다. padding 전후 곡선을 함께 보면 어떤 stride가 layout intervention에 민감한지도 더 분명하게 드러납니다.",

  method: [
    "기존 shared bank conflict stride sweep와 동일한 launched thread 수와 thread당 access 수를 유지합니다.",
    "차이는 shared index mapping에서 logical address마다 padding slot을 삽입하는 점입니다.",
    "stride를 같은 범위에서 sweep하며 avg_ms를 기록하고, baseline(no pad) 결과와 같은 축에서 비교합니다.",
    "특히 baseline에서 spike가 컸던 stride 16, 32, 48, 64 부근이 padding 후 어떻게 바뀌는지 우선적으로 관찰합니다.",
    "다른 하드웨어와 비교할 때도 절대 시간보다 spike 감소 여부와 곡선 재형성 패턴을 중심으로 해석합니다.",
  ],

  kernelShape: {
    accessPattern: "shared load stride sweep (wrapped fixed-work, padded)",
    comparedAxis: [
      "padding effect on latency spikes",
      "bank conflict mitigation",
      "layout transformation sensitivity",
      "baseline vs padded comparison",
    ],
    launchedThreads: "256 x 256 = 65536",
    accessesPerThread: "1024 (fixed)",
    actualTotalAccesses: "65536 x 1024 = 67,108,864",
    totalBytesActual:
      "approximately constant across strides, with padded shared layout",
  },

  codeSnippet: `extern __shared__ float smem[];

int tid = threadIdx.x;
float acc = 0.0f;

for (int j = 0; j < accesses_per_thread; ++j) {
  int logical = tid * stride + j;
  logical = logical % shared_span_floats;

  // insert one padding slot every 32 logical elements
  int physical = logical + (logical / 32);

  float x = smem[physical];
  acc += x * 1.000001f;
}

output[blockIdx.x * blockDim.x + tid] = acc;`,

  observe: [
    "baseline에서 컸던 stride 16, 32, 48, 64 spike가 padding 후 줄어드는가",
    "padding 적용 후에도 여전히 남는 spike가 있는가",
    "padding이 모든 stride를 균일하게 개선하는가, 아니면 특정 stride에만 강하게 작용하는가",
    "곡선 전체가 매끄러워지는가, 혹은 일부 stride에서만 재배열되는가",
    "다른 GPU에서 같은 padded sweep를 했을 때 감소폭이나 민감한 stride가 달라지는가",
  ],

  outputs: [
    "padded shared stride timing curve",
    "baseline vs padded comparison curve",
    "bank conflict mitigation evidence",
    "layout transformation interpretation guide",
  ],

  chartData: [
    { stride: 1, avg_ms: null },
    { stride: 2, avg_ms: null },
    { stride: 4, avg_ms: null },
    { stride: 8, avg_ms: null },
    { stride: 16, avg_ms: null },
    { stride: 32, avg_ms: null },
    { stride: 48, avg_ms: null },
    { stride: 64, avg_ms: null },
  ],

  comparisonChartData: [
    { stride: 1, avg_ms_base: 0.229619, avg_ms_padded: null },
    { stride: 2, avg_ms_base: 0.227039, avg_ms_padded: null },
    { stride: 4, avg_ms_base: 0.231423, avg_ms_padded: null },
    { stride: 8, avg_ms_base: 0.259334, avg_ms_padded: null },
    { stride: 16, avg_ms_base: 0.558526, avg_ms_padded: null },
    { stride: 32, avg_ms_base: 0.822556, avg_ms_padded: null },
    { stride: 48, avg_ms_base: 0.397251, avg_ms_padded: null },
    { stride: 64, avg_ms_base: 0.76726, avg_ms_padded: null },
  ],

  charts: [
    {
      title: "Stride vs Avg Time (Padded)",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "Padding 적용 후 shared stride curve가 어떻게 바뀌는지 봅니다. baseline spike가 줄어들면 padding이 bank conflict를 완화했을 가능성이 커집니다.",
    },
    {
      title: "Baseline vs Padded",
      xKey: "stride",
      yKeys: ["avg_ms_base", "avg_ms_padded"],
      summary:
        "Padding 전후 latency spike를 같은 stride 축에서 직접 비교합니다. 특히 baseline에서 크게 튀었던 stride 16, 32, 48, 64의 감소 여부가 핵심 관찰 지점입니다.",
    },
  ],

  resultHighlights: [
    "이 실험은 baseline stride sweep에서 관찰된 spike가 padding으로 완화되는지 확인하기 위한 직접 비교 probe입니다.",
    "특히 stride 32 같은 큰 spike가 padding 후 줄어든다면 bank conflict 해석의 신뢰도가 크게 올라갑니다.",
    "padding 적용 효과가 stride마다 다르게 나타날 수 있으므로, 전체 평균보다 특정 spike 구간의 변화가 더 중요합니다.",
  ],

  interpretation: [
    "padding 적용 후 특정 stride spike가 줄어들면, 해당 병목은 shared bank mapping과 layout alignment에 더 직접적으로 연결되어 있었다고 해석할 수 있습니다.",
    "반대로 padding 후에도 spike가 거의 그대로 남는다면, 현재 병목에는 bank conflict 외에 instruction mix, loop overhead, or other access effects가 더 강하게 섞였을 가능성이 있습니다.",
    "padding이 모든 stride를 동일하게 개선하지 않고 일부 구간에만 강하게 작용한다면, 이는 conflict 패턴이 stride와 bank periodicity의 특정 결합에서만 심해진다는 신호일 수 있습니다.",
    "baseline vs padded 비교는 shared optimization이 단순 on-chip residency 문제가 아니라 layout transformation 문제이기도 하다는 점을 보여주는 좋은 예가 됩니다.",
  ],

  caveats: [
    "현재 chartData와 comparisonChartData의 padded 값은 placeholder이며 실제 측정 결과로 교체되어야 합니다.",
    "padding은 shared memory footprint를 늘리므로, conflict 완화와 shared usage 증가 효과가 함께 섞일 수 있습니다.",
    "이 실험만으로는 read path와 write path의 민감도를 완전히 분리할 수 없습니다.",
    "wrapped modulo access 구조이므로 pure bounded no-wrap shared response와는 일부 해석 차이가 있을 수 있습니다.",
    "padding 후에도 spike가 남는다면 bank conflict가 전부는 아닐 수 있으며, Nsight Compute 지표와 함께 보는 편이 더 안전합니다.",
  ],

  nextProbes: [
    "shared_broadcast_vs_conflict",
    "shared_read_vs_write_stride",
    "Nsight Compute capture for shared transaction clues",
  ],

  nextLinks: [
    { label: "기본 shared stride probe 보기", href: "/hardware-evidence/shared-bank-conflict-stride" },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default sharedPadEffect;