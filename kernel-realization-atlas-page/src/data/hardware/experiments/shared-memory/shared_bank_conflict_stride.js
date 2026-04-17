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
    "현재 결과는 wrapped fixed-work read probe 기준이며, 이후 padding on/off, read/write 분리, broadcast 비교 버전과 함께 읽도록 설계했습니다.",
    "다른 하드웨어와 비교할 때는 절대 시간보다 특정 stride에서 spike가 생기는 위치와 곡선 형태를 함께 비교합니다.",
  ],

  kernelShape: {
    accessPattern: "shared load stride sweep (wrapped fixed-work)",
    comparedAxis: [
      "bank conflict sensitivity",
      "warp-local address distribution",
      "shared access latency response",
      "padding-ready comparison baseline",
    ],
    launchedThreads: "256 x 256 = 65536",
    accessesPerThread: "1024 (fixed)",
    actualTotalAccesses: "65536 x 1024 = 67,108,864",
    totalBytesActual: "approximately constant across strides within the current wrapped probe",
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
    "같은 총 work 조건에서도 shared bank mapping 때문에 실행 시간이 흔들리는가",
    "향후 padding 적용 시 이 spike가 완화되는가",
    "다른 GPU에서 같은 stride sweep를 했을 때 spike 위치나 강도가 달라지는가",
  ],

  outputs: [
    "shared stride timing curve",
    "bank conflict candidate points",
    "padding comparison baseline",
    "cross-hardware interpretation guide for shared-memory response",
  ],

  chartData: [
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
  ],

  charts: [
    {
      title: "Stride vs Avg Time",
      xKey: "stride",
      yKeys: ["avg_ms"],
      summary:
        "Stride 16, 32, 48, 64에서 뚜렷한 spike가 관찰되며, 특히 stride 32가 가장 큰 latency 상승을 보입니다. 이 곡선은 shared memory가 항상 균일하게 빠른 것이 아니라 warp-bank mapping에 따라 국소적 병목을 만들 수 있음을 보여줍니다.",
    },
  ],

  resultHighlights: [
    "stride 16, 32, 48, 64에서 뚜렷한 latency spike가 관찰되었고, 특히 stride 32가 가장 큰 상승을 보였습니다.",
    "반면 다수의 stride 구간은 0.146~0.23 ms 수준에 머물러, shared access cost가 stride 크기 자체보다 bank mapping 구조에 더 민감하다는 점을 보여줍니다.",
    "현재 결과는 wrapped fixed-work read probe 기준이며, padding 버전과 함께 비교하면 layout transformation 효과를 더 직접적으로 해석할 수 있습니다.",
  ],

  interpretation: [
    "stride 16, 32, 64의 큰 spike는 warp 내부 thread들의 shared address 분포가 특정 bank 집합에 강하게 정렬되며 conflict cost를 키운 결과로 해석할 수 있습니다.",
    "stride가 증가해도 항상 느려지지 않고 특정 값에서만 국소 spike가 발생하므로, 이 곡선은 단순 stride penalty보다 bank mapping response를 더 직접적으로 반영합니다.",
    "stride 32에서 가장 큰 상승이 나타난 점은 shared memory access가 warp-bank alignment에 매우 민감하다는 정성적 근거가 됩니다.",
    "stride 48의 중간 규모 spike는 power-of-two stride만이 아니라 특정 배수 구조에서도 bank response가 다시 악화될 수 있음을 보여줍니다.",
    "padding 적용 후 이런 spike가 줄어든다면, 해당 병목이 단순 instruction overhead보다 bank mapping 문제였을 가능성이 더 커집니다.",
    "다른 하드웨어와 비교할 때는 절대 avg_ms보다 spike 위치, spike 크기, padding 민감도를 중심으로 보는 편이 더 안전합니다.",
  ],

  caveats: [
    "현재 결과는 wrapped modulo access를 사용하는 fixed-work read probe 기준입니다. pure bounded no-wrap shared response와는 일부 성격이 다를 수 있습니다.",
    "이 실험은 semantic equivalence bench가 아니라 access-pattern response probe입니다. stride에 따라 참조 sequence가 달라지므로 checksum과 output_mean이 일정하지 않을 수 있습니다.",
    "이 실험만으로는 shared read와 shared write의 민감도를 분리할 수 없습니다.",
    "instruction mix, loop overhead, compiler unrolling 영향이 일부 섞일 수 있습니다.",
    "bank conflict를 더 정확히 분리하려면 padding comparison, broadcast comparison, read/write 분리, possibly Nsight Compute 지표가 함께 필요합니다.",
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