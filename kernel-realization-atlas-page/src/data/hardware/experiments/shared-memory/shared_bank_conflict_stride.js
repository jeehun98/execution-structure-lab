const sharedBankConflictStride = {
  id: "shared-bank-conflict-stride",
  category: "Shared Memory",
  label: "Shared Bank Conflict Stride Sweep",
  summary:
    "Shared memory에서 stride를 바꾸며 warp 단위 bank conflict 패턴이 latency curve에 어떻게 드러나는지 관찰합니다. 이 실험은 shared memory가 빠르다는 일반론보다, 어떤 access pattern이 실제 충돌과 병목을 만드는지 읽기 위한 probe입니다.",

  question:
    "같은 shared memory 접근이라도 stride가 달라질 때, warp 내부 bank mapping은 어느 구간에서 충돌을 만들고 어느 구간에서 비교적 매끄러운 접근으로 유지되는가?",

  whyItMatters:
    "Shared memory 최적화는 단순히 on-chip 저장소를 쓴다는 사실만으로 끝나지 않습니다. 실제 성능은 warp 단위 bank mapping과 address distribution에 크게 좌우됩니다. 따라서 이 실험은 특정 stride에서 latency spike가 나타나는지, 그리고 그 spike가 padding이나 layout transformation으로 완화될 수 있는지를 해석하는 기준점이 됩니다.",

  method: [
    "Warp 단위 thread들이 shared array를 stride 기반으로 접근하도록 구성합니다.",
    "stride를 1에서 32 또는 그 이상까지 sweep하며 avg_ms를 기록합니다.",
    "초기 버전에서는 총 access 수와 launched thread 수를 고정해 stride에 따른 bank response만 최대한 비교 가능하게 유지합니다.",
    "향후 padding on/off 버전, read/write 분리 버전, broadcast 비교 버전과 함께 해석할 수 있도록 설계합니다.",
    "다른 하드웨어와 비교할 때는 절대 시간보다 특정 stride에서 spike가 생기는 위치와 곡선 형태를 함께 비교합니다.",
  ],

  kernelShape: {
    accessPattern: "shared load/store stride sweep",
    comparedAxis: [
      "bank conflict sensitivity",
      "warp-local address distribution",
      "shared access latency response",
      "padding-ready comparison baseline",
    ],
    launchedThreads: "placeholder",
    accessesPerThread: "placeholder",
    actualTotalAccesses: "constant across strides (planned)",
    totalBytesActual: "constant across strides (planned)",
  },

  codeSnippet: `// simplified shared bank-conflict stride shape
extern __shared__ float smem[];

int tid = threadIdx.x;
float acc = 0.0f;

for (int j = 0; j < accesses_per_thread; ++j) {
  int idx = (tid * stride + j) % shared_span;
  float x = smem[idx];
  acc += x * 1.000001f;
}

output[tid] = acc;`,

  observe: [
    "stride 변화에 따라 avg_ms가 어느 구간에서 급격히 증가하는가",
    "특정 stride에서 반복적으로 spike가 나타나는가",
    "같은 총 work 조건에서도 shared bank mapping 때문에 실행 시간이 흔들리는가",
    "향후 padding 적용 시 spike가 완화되는가",
    "다른 GPU에서 같은 stride sweep를 했을 때 spike 위치나 강도가 달라지는가",
  ],

  outputs: [
    "shared stride timing curve",
    "bank conflict candidate points",
    "padding comparison baseline",
    "cross-hardware interpretation guide for shared-memory response",
  ],

  chartData: [
    { stride: 1, avg_ms: 0.120, conflict_score_hint: 1 },
    { stride: 2, avg_ms: 0.140, conflict_score_hint: 2 },
    { stride: 4, avg_ms: 0.210, conflict_score_hint: 4 },
    { stride: 8, avg_ms: 0.360, conflict_score_hint: 8 },
    { stride: 16, avg_ms: 0.540, conflict_score_hint: 16 },
    { stride: 32, avg_ms: 0.300, conflict_score_hint: 1 },
  ],

  charts: [
    {
      title: "Stride vs Avg Time",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "Shared memory stride 변화에 따라 latency curve가 어떻게 출렁이는지 보고, 특정 stride에서의 spike를 bank conflict 후보 지점으로 읽습니다.",
    },
    {
      title: "Stride vs Conflict Hint",
      xKey: "stride",
      yKeys: ["conflict_score_hint"],
      summary:
        "실제 측정 지표가 아니라 해석 보조용 힌트입니다. 추후 실제 padding 비교나 read/write 분리 결과로 대체할 수 있습니다.",
    },
  ],

  resultHighlights: [
    "현재 값은 Shared Memory 분류를 실제 실험 구조로 확장하기 위한 초기 뼈대입니다.",
    "이 실험의 핵심은 절대 시간보다 stride별 spike 위치와 곡선 형태를 읽는 것입니다.",
    "향후 padding 버전과 함께 비교하면 layout transformation의 효과를 직접 해석할 수 있습니다.",
  ],

  interpretation: [
    "특정 stride에서 시간이 급격히 증가한다면, warp 내부 thread들이 같은 bank 집합으로 몰리는 패턴을 의심할 수 있습니다.",
    "반대로 어떤 stride에서 시간이 다시 낮아진다면, bank mapping이 상대적으로 덜 충돌하는 구조일 수 있습니다.",
    "이 실험 단독으로는 broadcast와 conflict를 완전히 분리하기 어렵기 때문에, 이후 broadcast 비교 probe와 함께 읽는 편이 정확합니다.",
    "padding 적용 후 spike가 줄어들면, 해당 병목이 단순 instruction overhead보다 bank mapping 문제였을 가능성이 커집니다.",
    "다른 하드웨어와 비교할 때는 절대 avg_ms보다 spike 위치, spike 크기, padding 민감도를 중심으로 보는 편이 더 안전합니다.",
  ],

  caveats: [
    "현재 chartData는 구조용 초기값이며 실제 실측 결과로 대체되어야 합니다.",
    "이 실험만으로는 shared read와 shared write의 민감도를 분리할 수 없습니다.",
    "instruction mix, loop overhead, compiler unrolling 영향이 일부 섞일 수 있습니다.",
    "bank conflict를 정확히 분리하려면 padding comparison, broadcast comparison, possibly Nsight Compute 지표가 함께 필요합니다.",
  ],

  nextProbes: [
    "shared_pad_effect",
    "shared_broadcast_vs_conflict",
    "shared_read_vs_write_stride",
    "Nsight Compute capture for shared transaction clues",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default sharedBankConflictStride;