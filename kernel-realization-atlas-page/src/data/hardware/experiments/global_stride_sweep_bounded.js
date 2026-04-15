const globalStrideSweepBoundedNoWrap = {
  id: "global-stride-sweep-bounded-no-wrap",
  category: "Memory Response",
  label: "Global Stride Sweep (Bounded No-Wrap)",
  summary:
    "주소를 wrap-around 하지 않는 조건에서 stride를 키우며, usable work envelope와 actual work가 어떻게 빠르게 붕괴하는지 관찰합니다. 이 실험은 pure stride penalty를 측정하기보다, bounded address range 안에서 실제 수행량 감소가 시간 곡선을 어떻게 바꾸는지 읽기 위한 probe입니다.",

  question:
    "주소를 배열 범위 밖으로 넘기지 않는 조건에서 stride가 커질 때, 실행 시간 곡선은 address dispersion penalty보다 actual work collapse와 active work envelope reduction의 영향을 얼마나 강하게 받는가?",

  whyItMatters:
    "이 실험의 목적은 stride 자체의 순수 penalty를 직접 측정하는 데 있지 않습니다. 오히려 no-wrap 조건에서 stride 증가가 실제 유효 access 수, total bytes actual, active thread 수를 얼마나 빠르게 줄이는지 관찰함으로써, 시간 하락을 단순 efficiency improvement로 오해하지 않게 하고, wrapped 결과에서 보이는 시간 변화가 reuse 때문인지 usable work collapse 때문인지 분리해서 읽을 수 있게 해줍니다. 또한 같은 probe를 다른 하드웨어에서 실행했을 때, 시간 곡선과 actual work 감소가 어떤 관계를 보이는지 비교 해석하는 기준점 역할도 합니다.",

  method: [
    "stride를 1에서 1024까지 증가시키되, 주소가 배열 범위를 벗어나면 더 이상 유효 access를 수행하지 않도록 구성합니다.",
    "requested_total_accesses와 accesses_per_thread는 동일하게 유지하지만, actual_total_accesses와 total_bytes_actual는 stride에 따라 감소합니다.",
    "stride별로 avg_ms, actual_total_accesses, total_bytes_actual, active_threads, warp_address_span_bytes를 함께 기록합니다.",
    "결과는 pure memory efficiency curve가 아니라, bounded no-wrap 조건에서 usable work envelope가 어떻게 무너지는지 보여주는 곡선으로 해석합니다.",
    "다른 하드웨어와 비교할 때는 절대 시간보다 actual work 감소 속도, active thread 감소 시점, 시간 곡선의 형태를 함께 비교합니다.",
  ],

  kernelShape: {
    accessPattern: "global load only, bounded no-wrap stride sweep",
    comparedAxis: [
      "usable access envelope",
      "actual work collapse",
      "bounded footprint reduction",
      "active thread decay",
    ],
    launchedThreads: "65536",
    requestedTotalAccesses: "16777216 across all strides",
    accessesPerThread: "256 requested across all strides",
    actualTotalAccesses: "decreases with stride",
    totalBytesActual: "decreases with stride",
  },

  codeSnippet: `// simplified bounded no-wrap shape
int tid = blockIdx.x * blockDim.x + threadIdx.x;
float acc = 0.0f;

for (int j = 0; j < accesses_per_thread; ++j) {
  int logical_access_id = tid + j * launched_threads;
  long long idx = base_offset + (long long)logical_access_id * stride;
  if (idx >= n) break;
  float x = input[idx];
  acc += x * 1.000001f;
}

output[tid] = acc;`,

  observe: [
    "stride 증가에 따라 actual_total_accesses가 얼마나 빠르게 감소하는가",
    "시간 감소가 address efficiency improvement가 아니라 workload collapse를 얼마나 강하게 반영하는가",
    "큰 stride에서 active_threads 감소가 언제부터 나타나는가",
    "bounded no-wrap 조건에서 usable work surface가 어떤 구간부터 빠르게 사라지는가",
    "다른 하드웨어에서 같은 실험을 실행했을 때 time curve와 actual work curve의 결합 형태가 어떻게 달라지는가",
  ],

  outputs: [
    "stride timing curve under bounded no-wrap",
    "actual work collapse summary",
    "bounded footprint reduction notes",
    "active thread decay points",
    "comparison points against wrapped fixed-work",
    "cross-hardware interpretation guide for bounded results",
  ],

  chartData: [
    {
      stride: 1,
      avg_ms: 0.174602,
      actual_total_accesses: 16777216,
      total_bytes_actual: 67108864,
      active_threads: 65536,
      warp_address_span_bytes: 128,
      estimated_footprint_bytes: 67108864,
    },
    {
      stride: 2,
      avg_ms: 0.161333,
      actual_total_accesses: 8388608,
      total_bytes_actual: 33554432,
      active_threads: 65536,
      warp_address_span_bytes: 252,
      estimated_footprint_bytes: 33554432,
    },
    {
      stride: 4,
      avg_ms: 0.159622,
      actual_total_accesses: 4194304,
      total_bytes_actual: 16777216,
      active_threads: 65536,
      warp_address_span_bytes: 500,
      estimated_footprint_bytes: 16777216,
    },
    {
      stride: 8,
      avg_ms: 0.159566,
      actual_total_accesses: 2097152,
      total_bytes_actual: 8388608,
      active_threads: 65536,
      warp_address_span_bytes: 996,
      estimated_footprint_bytes: 8388608,
    },
    {
      stride: 16,
      avg_ms: 0.100845,
      actual_total_accesses: 1048576,
      total_bytes_actual: 4194304,
      active_threads: 65536,
      warp_address_span_bytes: 1988,
      estimated_footprint_bytes: 4194304,
    },
    {
      stride: 32,
      avg_ms: 0.045111,
      actual_total_accesses: 524288,
      total_bytes_actual: 2097152,
      active_threads: 65536,
      warp_address_span_bytes: 3972,
      estimated_footprint_bytes: 2097152,
    },
    {
      stride: 64,
      avg_ms: 0.028286,
      actual_total_accesses: 262144,
      total_bytes_actual: 1048576,
      active_threads: 65536,
      warp_address_span_bytes: 7940,
      estimated_footprint_bytes: 1048576,
    },
    {
      stride: 128,
      avg_ms: 0.020391,
      actual_total_accesses: 131072,
      total_bytes_actual: 524288,
      active_threads: 65536,
      warp_address_span_bytes: 15876,
      estimated_footprint_bytes: 524288,
    },
    {
      stride: 256,
      avg_ms: 0.023436,
      actual_total_accesses: 65536,
      total_bytes_actual: 262144,
      active_threads: 65536,
      warp_address_span_bytes: 31748,
      estimated_footprint_bytes: 262144,
    },
    {
      stride: 512,
      avg_ms: 0.014069,
      actual_total_accesses: 32768,
      total_bytes_actual: 131072,
      active_threads: 32768,
      warp_address_span_bytes: 63492,
      estimated_footprint_bytes: 131072,
    },
    {
      stride: 1024,
      avg_ms: 0.010814,
      actual_total_accesses: 16384,
      total_bytes_actual: 65536,
      active_threads: 16384,
      warp_address_span_bytes: 126980,
      estimated_footprint_bytes: 65536,
    },
  ],

  charts: [
    {
      title: "Stride vs Avg Time",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "시간은 전반적으로 감소하지만, 이 곡선은 efficiency gain보다 bounded work collapse와 active work reduction의 영향을 더 강하게 반영합니다.",
    },
    {
      title: "Stride vs Actual Work",
      xKey: "stride",
      yKeys: ["actual_total_accesses", "total_bytes_actual"],
      summary:
        "Stride 증가와 함께 실제 유효 access 수와 actual bytes가 얼마나 빠르게 줄어드는지 봅니다. 이 감소 속도는 시간 곡선을 해석하는 핵심 기준입니다.",
    },
    {
      title: "Stride vs Active Threads / Warp Span",
      xKey: "stride",
      yKeys: ["active_threads", "warp_address_span_bytes"],
      summary:
        "큰 stride에서는 active thread 수까지 줄어들어, 같은 시간 곡선이 전혀 다른 실행 조건 위에 놓여 있음을 보여줍니다.",
    },
  ],

  resultHighlights: [
    "Stride가 증가할수록 actual_total_accesses가 16777216에서 16384까지 급격히 감소합니다.",
    "total_bytes_actual도 64MB에서 64KB까지 줄어들어, 큰 stride 구간의 시간 감소가 실제 수행량 축소와 강하게 연결됩니다.",
    "Stride 1~8 구간은 warp span이 커지는데도 실행 시간이 거의 평평해, address dispersion 비용이 work 감소에 가려질 수 있음을 보여줍니다.",
    "Stride 512와 1024에서는 active_threads가 32768, 16384로 줄어들어, 큰 stride 구간은 더 이상 fixed-work 비교가 아닙니다.",
    "따라서 이 결과는 pure stride penalty 곡선이 아니라, no-wrap 조건에서 usable work envelope가 어떻게 무너지는지 보여주는 곡선으로 읽는 편이 맞습니다.",
  ],

  interpretation: [
    "이 결과는 stride 증가가 단순히 주소 분산만 키우는 것이 아니라, bounded address range 안에서 실제 유효 access 수 자체를 빠르게 줄인다는 점을 보여줍니다.",
    "따라서 실행 시간 하락은 memory transaction efficiency improvement보다는 workload collapse와 usable work reduction의 영향을 더 강하게 반영합니다.",
    "작은 stride 구간에서 time curve가 거의 평평한 것도 penalty가 없다는 뜻이 아니라, actual work 감소가 address dispersion 비용을 가리고 있다는 뜻에 가깝습니다.",
    "큰 stride에서는 active thread 수까지 줄어들기 때문에, 이 구간은 stride efficiency 비교보다 bounded execution envelope의 붕괴를 보는 구간으로 이해해야 합니다.",
    "즉 bounded no-wrap probe의 역할은 pure penalty 측정보다, stride가 no-wrap 조건에서 usable work surface를 어떻게 깎아내는지 관찰하는 데 있습니다.",
    "다른 하드웨어에서 같은 probe를 실행할 때는 절대 시간만 비교하지 말고, actual_total_accesses, total_bytes_actual, active_threads 감소 속도와 time curve의 상대적 형태를 함께 봐야 합니다.",
    "예를 들어 큰 stride에서도 시간이 충분히 떨어지지 않는다면, 해당 하드웨어에서는 bounded work collapse보다 per-access overhead나 memory-side latency cost가 더 오래 지배하고 있을 수 있습니다.",
    "반대로 시간 감소가 work collapse와 거의 같은 비율로 빠르게 일어난다면, 이 구간의 곡선은 stride penalty보다 usable work reduction을 더 직접적으로 반영하고 있을 가능성이 큽니다.",
    "Wrapped fixed-work 결과와 bounded no-wrap 결과를 함께 비교하면, 시간 회복이 reuse 때문인지 usable work collapse 때문인지 하드웨어별로 더 분리해서 읽을 수 있습니다.",
  ],

  caveats: [
    "actual_total_accesses와 total_bytes_actual가 stride에 따라 크게 달라지므로, avg_ms를 stride별 memory efficiency 비교로 직접 사용하면 오해가 생깁니다.",
    "Stride 512와 1024에서는 active_threads도 감소해, 큰 stride 구간은 더욱 비대칭적인 실행 조건이 됩니다.",
    "이 결과만으로는 coalescing penalty, cache response, TLB 효과를 분리해서 말할 수 없습니다.",
    "다른 하드웨어와 비교할 때도 절대 시간 수치만으로 결론 내리기보다, 동일 stride에서 actual work collapse와 time curve의 결합 형태를 함께 봐야 합니다.",
    "순수한 no-wrap fixed-work stride penalty를 보려면 stride별로 total_accesses를 재조정하거나 별도의 fixed-work no-wrap probe가 필요합니다.",
  ],

  nextProbes: [
    "no-wrap fixed-work redesign to keep actual_total_accesses constant across strides",
    "base_offset sweep in bounded mode to test alignment sensitivity before work collapse dominates",
    "Nsight Compute capture for sector count and memory throughput under bounded access reduction",
    "comparison against wrapped mode to separate reuse gain from workload collapse",
    "cross-device bounded sweep comparison with normalized work-collapse overlays",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default globalStrideSweepBoundedNoWrap;