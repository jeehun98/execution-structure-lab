const globalStrideSweepFixedWork = {
  id: "global-stride-sweep-fixed-work",
  category: "Global Memory",
  label: "Global Stride Sweep (Wrapped Fixed Work)",
  summary:
    "같은 총 work를 유지한 채 stride만 바꾸어, warp address continuity 붕괴와 wrap-around reuse가 함께 만드는 memory response curve를 읽습니다. 이 실험은 workload 차이가 아닌 address layout 변화에 대한 하드웨어 반응을 보기 위한 probe입니다.",

  question:
    "같은 양의 global load를 유지한 상태에서 주소 간격이 달라질 때, GPU는 어느 구간에서 dispersion cost를 크게 드러내고, 어느 구간에서 wrap-around reuse 때문에 다시 다른 반응을 보이는가?",

  whyItMatters:
    "이 실험의 목적은 단순히 stride penalty를 확인하는 것이 아니라, fixed total work를 유지한 상태에서 주소 구조 변화가 어떤 비단조 cost curve를 만드는지 관찰하는 데 있습니다. 여기서 얻는 반응은 warp continuity 붕괴, transaction grouping 악화, footprint collapse, repeated reuse가 실제 곡선을 어떻게 함께 만드는지 판단하는 근거가 됩니다. 또한 bounded no-wrap 결과와 함께 보면, 시간 변화가 usable work collapse 때문인지 wrapped reuse 때문인지 더 분리해서 읽을 수 있습니다.",

  method: [
    "모든 stride에서 actual_total_accesses, active_threads, accesses_per_thread, total_bytes_actual를 동일하게 유지합니다.",
    "각 thread는 동일 횟수의 global load를 수행하되, logical access id에 stride를 곱한 뒤 배열 범위 안에서 wrap-around 하도록 구성합니다.",
    "stride를 1에서 1024까지 증가시키며 avg_ms, warp_address_span_bytes, unique_index_upper_bound, estimated_footprint_bytes를 함께 기록합니다.",
    "결과 곡선은 workload 차이가 아니라 wrapped address layout 변화에 대한 hardware response로 읽습니다.",
    "다른 하드웨어와 비교할 때는 절대 시간만이 아니라 peak 구간, 회복 시작 시점, footprint collapse 속도를 함께 비교합니다.",
  ],

  kernelShape: {
    accessPattern: "global load only, wrapped fixed-work stride sweep",
    comparedAxis: [
      "warp address continuity",
      "transaction grouping",
      "footprint collapse",
      "repeated reuse response",
    ],
    launchedThreads: "65536",
    activeThreads: "65536 across all strides",
    accessesPerThread: "256 across all strides",
    actualTotalAccesses: "16777216 across all strides",
    totalBytesActual: "67108864 bytes across all strides",
  },

  codeSnippet: `// simplified wrapped fixed-work shape
int tid = blockIdx.x * blockDim.x + threadIdx.x;
float acc = 0.0f;

for (int j = 0; j < accesses_per_thread; ++j) {
  int logical_access_id = tid + j * launched_threads;
  int idx = (base_offset + logical_access_id * stride) % n;
  float x = input[idx];
  acc += x * 1.000001f;
}

output[tid] = acc;`,

  observe: [
    "stride 증가에 따라 시간 곡선이 어떻게 변하는가",
    "연속 접근 붕괴가 급격한 비용 증가로 나타나는 구간이 어디인가",
    "큰 stride에서 footprint collapse와 reuse 증가가 언제부터 곡선을 다시 낮추는가",
    "warp span 증가와 unique footprint 감소가 어떤 전환점을 만드는가",
    "다른 하드웨어에서 같은 실험을 실행했을 때 peak 위치와 recovery shape가 어떻게 달라지는가",
  ],

  outputs: [
    "wrapped fixed-work stride timing curve",
    "warp span vs footprint summary",
    "dispersion-to-reuse transition notes",
    "comparison points against bounded no-wrap",
    "cross-hardware interpretation guide for wrapped results",
  ],

  chartData: [
    {
      stride: 1,
      avg_ms: 0.203141,
      warp_address_span_bytes: 128,
      unique_index_upper_bound: 16777216,
      estimated_footprint_bytes: 67108864,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 2,
      avg_ms: 0.31774,
      warp_address_span_bytes: 252,
      unique_index_upper_bound: 8388608,
      estimated_footprint_bytes: 33554432,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 4,
      avg_ms: 0.624588,
      warp_address_span_bytes: 500,
      unique_index_upper_bound: 4194304,
      estimated_footprint_bytes: 16777216,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 8,
      avg_ms: 1.265991,
      warp_address_span_bytes: 996,
      unique_index_upper_bound: 2097152,
      estimated_footprint_bytes: 8388608,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 16,
      avg_ms: 1.295482,
      warp_address_span_bytes: 1988,
      unique_index_upper_bound: 1048576,
      estimated_footprint_bytes: 4194304,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 32,
      avg_ms: 1.27313,
      warp_address_span_bytes: 3972,
      unique_index_upper_bound: 524288,
      estimated_footprint_bytes: 2097152,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 64,
      avg_ms: 1.724908,
      warp_address_span_bytes: 7940,
      unique_index_upper_bound: 262144,
      estimated_footprint_bytes: 1048576,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 128,
      avg_ms: 1.23719,
      warp_address_span_bytes: 15876,
      unique_index_upper_bound: 131072,
      estimated_footprint_bytes: 524288,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 256,
      avg_ms: 0.442724,
      warp_address_span_bytes: 31748,
      unique_index_upper_bound: 65536,
      estimated_footprint_bytes: 262144,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 512,
      avg_ms: 0.23378,
      warp_address_span_bytes: 63492,
      unique_index_upper_bound: 32768,
      estimated_footprint_bytes: 131072,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
    {
      stride: 1024,
      avg_ms: 0.266421,
      warp_address_span_bytes: 126980,
      unique_index_upper_bound: 16384,
      estimated_footprint_bytes: 65536,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
    },
  ],

  charts: [
    {
      title: "Stride vs Avg Time",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "Stride 64 부근에서 peak가 나타난 뒤, 큰 stride에서는 다시 회복하는 비단조 시간 곡선을 봅니다.",
    },
    {
      title: "Stride vs Warp Address Span",
      xKey: "stride",
      yKeys: ["warp_address_span_bytes"],
      summary:
        "stride가 커질수록 warp 내부 주소 분산이 얼마나 빠르게 커지는지 봅니다.",
    },
    {
      title: "Stride vs Footprint Collapse",
      xKey: "stride",
      yKeys: ["estimated_footprint_bytes", "unique_index_upper_bound"],
      summary:
        "큰 stride에서 unique footprint가 급격히 줄어들며 repeated reuse가 강해지는 구조를 봅니다.",
    },
  ],

  resultHighlights: [
    "모든 stride에서 actual_total_accesses, active_threads, accesses_per_thread, total_bytes_actual가 동일하게 유지되어 workload는 고정되어 있습니다.",
    "실행 시간은 stride 1의 0.203ms에서 stride 64의 1.725ms까지 증가한 뒤, stride 256에서는 0.443ms, stride 512에서는 0.234ms로 다시 감소합니다.",
    "warp_address_span_bytes는 stride와 함께 128B에서 126980B까지 계속 커져 warp 내부 주소 분산이 지속적으로 확대됩니다.",
    "반면 unique_index_upper_bound는 16777216에서 16384까지, estimated_footprint_bytes는 64MB에서 64KB까지 줄어들어 큰 stride에서 footprint collapse가 강하게 일어납니다.",
    "즉 이 곡선은 pure stride penalty가 아니라, dispersion cost와 wrap-around reuse가 함께 만드는 비단조 memory response curve입니다.",
  ],

  interpretation: [
    "이 probe는 전체 work를 고정했기 때문에, 시간 차이를 workload 감소가 아니라 주소 구조 변화에 대한 hardware response로 읽을 수 있습니다.",
    "stride 1에서 64까지의 시간 증가는 warp-level continuity 붕괴와 transaction grouping 악화가 실제 비용으로 드러나는 구간으로 볼 수 있습니다.",
    "하지만 stride 256 이후의 회복은 coalescing 개선이라기보다 modulo wrap-around로 인한 unique footprint 축소와 repeated reuse 증가의 영향으로 해석하는 편이 정확합니다.",
    "특히 stride 64 부근은 warp span은 충분히 커졌지만 reuse 이득은 아직 압도적이지 않은 중간 전환 구간으로, dispersion penalty가 가장 강하게 드러나는 지점에 가깝습니다.",
    "따라서 이 실험은 expanding-footprint stride penalty 측정보다, wrapped fixed-work 환경에서 GPU가 address dispersion과 repeated reuse에 어떻게 반응하는지 보는 probe로 이해하는 편이 맞습니다.",
    "bounded no-wrap 결과와 함께 보면, 시간 회복이 실제 memory-path 개선인지, 아니면 wrapped footprint collapse와 reuse 강화 때문인지 더 분리해서 해석할 수 있습니다.",
    "다른 하드웨어와 비교할 때는 절대 시간보다 peak 위치, recovery 시작 시점, footprint collapse 대비 시간 회복 속도를 함께 봐야 합니다.",
  ],

  caveats: [
    "주소가 idx %= n으로 wrap-around 되므로, stride 증가가 더 넓은 주소 공간 확장으로 직접 이어지지 않습니다.",
    "n과 stride가 모두 2의 거듭제곱이어서 gcd(stride, n)에 따른 aliasing과 footprint collapse가 강하게 나타납니다.",
    "따라서 큰 stride에서의 성능 회복을 단순한 memory-path 효율 향상으로 해석하면 오해가 생길 수 있습니다.",
    "page-scale locality, no-reuse stride penalty, pure expanding-footprint response를 더 직접 보려면 별도의 no-wrap fixed-work probe가 필요합니다.",
    "이 결과만으로는 cache hit, sector count, TLB, DRAM transaction 변화를 직접 분리해서 확정할 수 없습니다.",
  ],

  nextProbes: [
    "base_offset sweep to check alignment sensitivity in wrapped mode",
    "no-wrap fixed-work sweep to separate dispersion cost from reuse collapse",
    "Nsight Compute capture for sector count, L1/L2 hit, and DRAM throughput clues",
    "page-scale stride sweep to expose large-address locality breakdown without wrap-around",
    "cross-device comparison with normalized peak and recovery overlays",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default globalStrideSweepFixedWork;