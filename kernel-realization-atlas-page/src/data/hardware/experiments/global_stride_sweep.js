const globalStrideSweep = {
  id: "global-stride-sweep",
  category: "Memory Response",
  label: "Global Stride Sweep",
  summary:
    "global memory 접근 stride를 단계적으로 바꾸며, coalescing이 깨질 때 실제 GPU 응답이 어떻게 변하는지 보는 가장 기본적인 probing 실험입니다.",
  question:
    "연속 접근이 깨지고 thread들이 더 넓게 흩어진 주소를 읽기 시작할 때, 실행 시간과 bandwidth 효율은 어떤 식으로 무너지는가?",
  whyItMatters:
    "같은 의미의 load라도 실제 access pattern이 달라지면 transaction behavior와 effective bandwidth가 크게 바뀝니다. 이는 operator realization에서 layout, tiling, fusion, gather/scatter style choice가 왜 중요한지 보여주는 가장 직접적인 근거가 됩니다.",

  method: [
    "thread index에 stride를 곱해 global memory 접근 간격을 단계적으로 증가시킵니다.",
    "stride를 power-of-two 형태로 sweep하며 access pattern의 변화만 관찰합니다.",
    "각 설정에서 warmup 이후 평균 kernel time을 측정합니다.",
    "결과 checksum 또는 parity check를 통해 기능적 차이가 아닌 access response 차이를 보려 합니다.",
  ],

  kernelShape: {
    grid: "problem size에 맞춰 1D grid 구성",
    block: "일반적으로 1D block, contiguous thread indexing",
    accessPattern: "index = base + tid * stride",
    variedParameter: "stride",
    timing: "warmup + repeated kernel timing",
    validation: "checksum / output consistency",
  },

  codeSnippet: `int tid = blockIdx.x * blockDim.x + threadIdx.x;
int idx = tid * stride;
if (idx < N) {
  acc += input[idx];
}`,

  observe: [
    "stride 증가에 따라 avg kernel time이 어떻게 변하는가",
    "초기 stride 구간과 큰 stride 구간의 응답 차이",
    "연속 접근 대비 흩어진 접근의 bandwidth 저하",
    "특정 stride 이후 응답 변화가 급격해지는 지점",
  ],

  outputs: [
    "stride vs avg_ms 표",
    "stride vs effective bandwidth 요약",
    "대표 stride 구간별 비교 코멘트",
    "device / config metadata",
  ],

  resultHighlights: [
    "작은 stride 구간에서는 비교적 안정적인 응답을 보일 가능성이 큽니다.",
    "stride가 커질수록 coalescing 효율이 무너지며 time이 증가하는 패턴이 나타납니다.",
    "일정 구간 이후에는 transaction fragmentation의 영향이 더 선명하게 드러날 수 있습니다.",
    "같은 연산 의미라도 access layout이 실제 비용 구조를 크게 바꾼다는 점이 관찰됩니다.",
  ],

  interpretation: [
    "연속적이고 인접한 접근을 유지하는 realization이 훨씬 유리합니다.",
    "의미적으로 동일한 gather-like 구현이라도 memory layout이 나쁘면 hardware cost가 급격히 상승할 수 있습니다.",
    "tiling이나 reordering이 단지 추상적 변환이 아니라 실제 transaction 품질을 바꾸는 수단임을 보여줍니다.",
  ],

  caveats: [
    "stride 변화는 cache behavior와 transaction behavior를 동시에 흔들 수 있습니다.",
    "문제 크기, block size, GPU 세대에 따라 곡선 형태는 달라질 수 있습니다.",
    "이 실험 하나만으로 cache line size나 transaction granularity를 정확히 단정하긴 어렵습니다.",
  ],

  nextLinks: [
    { label: "변환 성질 보기", href: "/properties-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
  ],
};

export default globalStrideSweep;