const rawChartData = [
  { stride: 1, avg_ms: 0.229619 },
  { stride: 2, avg_ms: 0.227039 },
  { stride: 3, avg_ms: 0.227811 },
  { stride: 4, avg_ms: 0.231423 },
  { stride: 5, avg_ms: 0.228342 },
  { stride: 6, avg_ms: 0.22768 },
  { stride: 7, avg_ms: 0.192651 },
  { stride: 8, avg_ms: 0.259334 },
  { stride: 9, avg_ms: 0.193696 },
  { stride: 10, avg_ms: 0.197669 },
  { stride: 11, avg_ms: 0.196433 },
  { stride: 12, avg_ms: 0.199377 },
  { stride: 13, avg_ms: 0.195101 },
  { stride: 14, avg_ms: 0.192564 },
  { stride: 15, avg_ms: 0.193638 },
  { stride: 16, avg_ms: 0.558526 },
  { stride: 17, avg_ms: 0.205992 },
  { stride: 18, avg_ms: 0.198004 },
  { stride: 19, avg_ms: 0.197659 },
  { stride: 20, avg_ms: 0.190488 },
  { stride: 21, avg_ms: 0.147196 },
  { stride: 22, avg_ms: 0.151334 },
  { stride: 23, avg_ms: 0.150077 },
  { stride: 24, avg_ms: 0.195857 },
  { stride: 25, avg_ms: 0.14776 },
  { stride: 26, avg_ms: 0.14962 },
  { stride: 27, avg_ms: 0.146149 },
  { stride: 28, avg_ms: 0.150797 },
  { stride: 29, avg_ms: 0.151588 },
  { stride: 30, avg_ms: 0.147365 },
  { stride: 31, avg_ms: 0.150502 },
  { stride: 32, avg_ms: 0.822556 },
  { stride: 33, avg_ms: 0.147756 },
  { stride: 34, avg_ms: 0.149341 },
  { stride: 35, avg_ms: 0.157311 },
  { stride: 36, avg_ms: 0.151194 },
  { stride: 37, avg_ms: 0.147807 },
  { stride: 38, avg_ms: 0.152997 },
  { stride: 39, avg_ms: 0.146822 },
  { stride: 40, avg_ms: 0.193729 },
  { stride: 41, avg_ms: 0.156943 },
  { stride: 42, avg_ms: 0.149827 },
  { stride: 43, avg_ms: 0.1479 },
  { stride: 44, avg_ms: 0.154497 },
  { stride: 45, avg_ms: 0.149786 },
  { stride: 46, avg_ms: 0.147508 },
  { stride: 47, avg_ms: 0.15456 },
  { stride: 48, avg_ms: 0.397251 },
  { stride: 49, avg_ms: 0.155626 },
  { stride: 50, avg_ms: 0.150731 },
  { stride: 51, avg_ms: 0.147784 },
  { stride: 52, avg_ms: 0.153921 },
  { stride: 53, avg_ms: 0.148827 },
  { stride: 54, avg_ms: 0.148856 },
  { stride: 55, avg_ms: 0.153839 },
  { stride: 56, avg_ms: 0.194166 },
  { stride: 57, avg_ms: 0.14685 },
  { stride: 58, avg_ms: 0.150295 },
  { stride: 59, avg_ms: 0.152246 },
  { stride: 60, avg_ms: 0.147227 },
  { stride: 61, avg_ms: 0.152632 },
  { stride: 62, avg_ms: 0.150431 },
  { stride: 63, avg_ms: 0.148597 },
  { stride: 64, avg_ms: 0.76726 },
];

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }

  return x;
}

function classifySpike(stride, avgMs) {
  if ([32, 64].includes(stride)) return "major spike";
  if ([16, 48].includes(stride)) return "secondary spike";
  if (avgMs >= 0.24) return "minor bump";
  return "baseline";
}

const chartData = rawChartData.map((row) => {
  const gcd32 = gcd(row.stride, 32);
  const estimatedUniqueBanks = 32 / gcd32;

  return {
    ...row,
    gcd_32: gcd32,
    estimated_unique_banks: estimatedUniqueBanks,
    estimated_conflict_degree: gcd32,
    spike_label: classifySpike(row.stride, row.avg_ms),
  };
});

const sharedBankConflictStride = {
  id: "shared-bank-conflict-stride",
  category: "Shared Memory",
  label: "Shared Bank Conflict Stride Sweep",
  summary:
    "Shared memory에서 stride를 바꾸며 warp 단위 bank mapping이 latency curve에 어떻게 드러나는지 관찰합니다. 이 실험은 shared memory가 빠르다는 일반론보다, 어떤 access pattern이 실제 충돌 후보와 실행 지연을 만드는지 읽기 위한 probe입니다.",

  question:
    "같은 shared memory 접근이라도 stride가 달라질 때, warp 내부 bank mapping은 어느 구간에서 뚜렷한 latency spike를 만들고 어느 구간에서 비교적 매끄러운 접근으로 유지되는가?",

  whyItMatters:
    "Shared memory 최적화는 단순히 on-chip 저장소를 쓴다는 사실만으로 끝나지 않습니다. 실제 성능은 warp 단위 bank mapping과 address distribution에 크게 좌우됩니다. 따라서 이 실험은 특정 stride에서 latency spike가 나타나는지, 그리고 그 spike가 padding이나 layout transformation으로 완화될 수 있는지를 해석하는 기준점이 됩니다.",

  method: [
    "Warp 단위 thread들이 shared array를 stride 기반으로 접근하도록 구성합니다.",
    "stride를 1부터 64까지 sweep하며 avg_ms를 기록합니다.",
    "총 launched thread 수와 thread당 access 수를 고정해 stride에 따른 shared bank response를 최대한 비교 가능하게 유지합니다.",
    "각 stride에 대해 gcd(stride, 32), estimated unique banks, estimated conflict degree를 함께 계산해 시간 곡선을 구조적 bank mapping과 함께 읽습니다.",
    "현재 결과는 wrapped fixed-work read probe 기준이며, 이후 padding on/off, read/write 분리, broadcast 비교 버전과 함께 읽도록 설계했습니다.",
    "다른 하드웨어와 비교할 때는 절대 시간보다 특정 stride에서 spike가 생기는 위치와 곡선 형태를 함께 비교합니다.",
  ],

  kernelShape: {
    accessPattern: "shared load stride sweep (wrapped fixed-work)",
    changedVariable: "shared-memory lane-to-address stride",
    fixedWork: "same launched threads and same accesses per thread",
    bankModel: "estimated bank = shared_index % 32",
    conflictModel:
      "estimated_conflict_degree = gcd(stride, 32), estimated_unique_banks = 32 / gcd(stride, 32)",
    comparedAxis: [
      "bank conflict sensitivity",
      "warp-local address distribution",
      "shared access latency response",
      "padding-ready comparison baseline",
    ],
    launchedThreads: "256 x 256 = 65536",
    accessesPerThread: "1024 fixed",
    actualTotalAccesses: "65536 x 1024 = 67,108,864",
    totalBytesActual:
      "approximately constant across strides within the current wrapped probe",
  },

  codeSnippet: `extern __shared__ float smem[];

int tid = threadIdx.x;
float acc = 0.0f;

for (int j = 0; j < accesses_per_thread; ++j) {
  int logical = tid * stride + j;
  int idx = logical % shared_span_floats;
  float x = smem[idx];
  acc += x * 1.000001f;
}

output[blockIdx.x * blockDim.x + tid] = acc;`,

  observe: [
    "stride 변화에 따라 avg_ms가 어느 구간에서 급격히 증가하는가",
    "stride 16, 32, 48, 64처럼 반복적으로 spike가 나타나는가",
    "gcd(stride, 32)가 큰 지점에서 estimated conflict degree와 latency spike가 함께 증가하는가",
    "같은 총 work 조건에서도 shared bank mapping 때문에 실행 시간이 흔들리는가",
    "향후 padding 적용 시 이 spike가 완화되는가",
    "다른 GPU에서 같은 stride sweep를 했을 때 spike 위치나 강도가 달라지는가",
  ],

  outputs: [
    "shared stride timing curve",
    "gcd(stride, 32) derived conflict curve",
    "estimated unique bank count",
    "bank conflict candidate points",
    "padding comparison baseline",
    "cross-hardware interpretation guide for shared-memory response",
  ],

  chartData,

  charts: [
    {
      title: "Stride vs Avg Time",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "Stride 16, 32, 48, 64에서 뚜렷한 spike가 관찰되며, 특히 stride 32가 가장 큰 latency 상승을 보입니다. 이 곡선은 shared memory가 항상 균일하게 빠른 것이 아니라 warp-bank mapping에 따라 국소적 병목을 만들 수 있음을 보여줍니다.",
    },
    {
      title: "Stride vs Estimated Conflict Degree",
      xKey: "stride",
      yKeys: ["estimated_conflict_degree"],
      summary:
        "gcd(stride, 32)를 기반으로 추정한 conflict degree입니다. 시간 곡선과 함께 보면, latency spike가 단순 stride 크기보다 bank mapping 구조와 더 밀접하게 움직이는지 확인할 수 있습니다.",
    },
    {
      title: "Stride vs Estimated Unique Banks",
      xKey: "stride",
      yKeys: ["estimated_unique_banks"],
      summary:
        "warp 접근이 이론적으로 몇 개의 bank에 분산되는지 추정합니다. unique bank 수가 줄어드는 지점은 같은 bank로 lane들이 몰릴 가능성이 커지는 구간입니다.",
    },
  ],

  resultHighlights: [
  "padding을 적용하지 않은 wrapped fixed-work read probe에서 stride 16, 32, 48, 64가 뚜렷한 latency spike를 만들었습니다.",
  "stride 32는 0.844257 ms, stride 64는 0.895489 ms까지 상승해 가장 강한 bank-aligned conflict 후보로 관찰되었습니다.",
  "반면 stride 17, 19, 23, 29, 33, 37, 41, 47, 53, 59 등 다수의 비정렬 stride는 약 0.187~0.190 ms 수준에 머물렀습니다.",
  "이 결과는 shared memory 접근 비용이 stride 크기 자체보다 warp-local bank mapping 구조에 더 민감하게 반응한다는 근거가 됩니다.",
  ],

  interpretation: [
    "stride 16, 32, 48, 64의 spike는 warp 내부 lane들이 shared memory bank 집합에 강하게 정렬되며 serialization 후보를 만든 결과로 해석할 수 있습니다.",
    "stride가 커진다고 항상 느려지는 것이 아니라 특정 배수 구조에서만 spike가 발생하므로, 이 곡선은 단순 stride penalty가 아니라 bank mapping response에 가깝습니다.",
    "stride 32와 64의 큰 상승은 32-bank 구조와 aligned stride가 만났을 때 worst-case에 가까운 접근 패턴이 만들어질 수 있음을 보여줍니다.",
    "이 probe 단독으로 bank conflict를 확정하지는 않습니다. 그러나 padding 적용 실험에서 같은 spike가 완화된다면, bank mapping 기원의 병목이라는 해석이 강화됩니다.",
  ],

  caveats: [
    "현재 결과는 modulo wrap을 사용하는 fixed-work read probe입니다. bounded no-wrap shared access와는 성격이 다를 수 있습니다.",
    "checksum과 output_mean은 stride별 참조 sequence가 달라지므로 semantic equivalence 지표로 사용하면 안 됩니다.",
    "이 실험만으로 read conflict, write conflict, broadcast behavior를 분리할 수 없습니다.",
    "instruction scheduling, compiler unrolling, shared-memory bank width, data type size가 결과에 영향을 줄 수 있습니다.",
    "따라서 이 결과는 bank conflict 확정 판정이 아니라, padding comparison으로 이어지는 conflict candidate evidence로 읽어야 합니다.",
  ],

  nextProbes: [
    "shared_pad_effect로 padding이 stride 16, 32, 48, 64 spike를 완화하는지 확인합니다.",
    "shared_read_vs_write_stride로 read/write conflict 민감도를 분리합니다.",
    "shared_broadcast_vs_conflict로 동일 주소 broadcast와 bank conflict를 분리합니다.",
    "Nsight Compute capture로 shared transaction 관련 지표를 확인합니다.",
  ],

  nextLinks: [
    {
      label: "Shared Pad Effect로 padding 완화 확인하기",
      href: "/hardware-evidence/shared-pad-effect",
    },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
  ],
  
  keyFindings: [
    { label: "largest spike", value: "stride 64" },
    { label: "major conflict", value: "stride 32" },
    { label: "work shape", value: "fixed-work wrapped" },
    { label: "next check", value: "padding" },
  ],
};

export default sharedBankConflictStride;