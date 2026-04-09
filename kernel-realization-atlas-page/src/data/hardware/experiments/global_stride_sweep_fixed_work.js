const globalStrideSweepFixedWork = {
  id: "global-stride-sweep-fixed-work",
  category: "Memory Response",
  label: "Global Stride Sweep (Fixed Work)",
  summary:
    "전체 work를 고정한 채 stride만 변화시켜, 주소 연속성 붕괴가 warp access grouping, locality, transaction efficiency에 어떤 반응을 일으키는지 읽는 probe입니다.",

  question:
    "같은 양의 global load라도 주소 간격이 달라질 때, GPU는 어느 구간에서 비용을 급격히 키우고, 어느 구간에서 다른 memory-path response를 드러내는가?",

  whyItMatters:
    "이 실험의 목적은 단순히 stride penalty를 확인하는 것이 아니라, 주소 구조 변화에 대해 GPU가 어떤 비용 곡선을 보이는지를 관찰하는 데 있습니다. 여기서 얻는 반응은 coalescing sensitivity, locality 붕괴 지점, address mapping 민감도, 그리고 후속 probe가 필요한 비정상 구간을 찾는 근거로 이어집니다.",

  method: [
    "모든 stride에서 total_accesses, active_threads, accesses_per_thread를 동일하게 유지합니다.",
    "각 thread는 동일 횟수의 global load를 수행하되, lane 간 주소 간격만 stride에 따라 바뀌도록 구성합니다.",
    "stride를 1에서 1024까지 증가시키며 avg_ms 변화를 기록합니다.",
    "결과 곡선은 work 차이가 아니라 address layout 변화에 대한 hardware response로 읽습니다.",
  ],

  kernelShape: {
    accessPattern: "global load only, fixed-work stride sweep",
    comparedAxis: [
      "warp address continuity",
      "transaction grouping",
      "locality breakdown",
      "address dispersion response",
    ],
    launchedThreads: "65536",
    activeThreads: "65536 across all strides",
    accessesPerThread: "256 across all strides",
    totalAccesses: "16777216 across all strides",
    totalBytesRequested: "67108864 bytes across all strides",
  },

  codeSnippet: `// simplified shape
int tid = blockIdx.x * blockDim.x + threadIdx.x;
float acc = 0.0f;

for (int i = 0; i < accesses_per_thread; ++i) {
  int idx = base_offset + tid * stride + i * total_threads * stride;
  acc += input[idx];
}

output[tid] = acc;`,

  observe: [
    "stride 증가에 따라 시간 곡선이 어떻게 변하는가",
    "연속 접근 붕괴가 급격한 비용 증가로 나타나는 구간",
    "높은 stride 영역에서 plateau, peak, 재하락 같은 비단조 반응이 나타나는가",
    "후속 locality / mapping probe가 필요한 이상 구간이 어디인가",
  ],

  outputs: [
    "stride timing curve",
    "memory response summary",
    "address dispersion sensitivity notes",
    "follow-up probe directions",
  ],

  resultHighlights: [
    "모든 stride에서 total_accesses, active_threads, accesses_per_thread, total_bytes_requested가 동일하게 유지되어 비교 조건이 정리되어 있습니다.",
    "Stride 1의 0.192ms는 stride 2, 4, 8에서 각각 0.317ms, 0.644ms, 1.335ms로 빠르게 증가합니다.",
    "Stride 16~64 구간은 높은 비용을 유지하며, stride 64에서 1.876ms로 전체 최고값을 기록합니다.",
    "Stride 128 이후에는 시간이 다시 감소해 stride 256에서는 0.718ms, stride 512에서는 0.318ms까지 내려갑니다.",
    "결과적으로 이 장치에서는 연속 접근 붕괴의 비용이 분명히 존재하지만, 반응 곡선은 단순 단조 증가가 아니라 비단조 형태를 보입니다.",
  ],

  interpretation: [
    "이 probe는 같은 work를 유지한 채 주소 구조만 바꾸므로, 시간 차이를 memory response 차이로 읽을 수 있습니다.",
    "Stride 1에서 8까지의 급격한 악화는 warp-level access grouping과 transaction efficiency가 연속성에 강하게 의존한다는 신호입니다.",
    "Stride 64 부근의 peak와 그 이후의 재하락은 실제 GPU 반응이 단순 coalescing 설명 하나로 닫히지 않음을 보여줍니다.",
    "이 결과는 locality, cache/TLB, address mapping, memory partition 반응이 함께 곡선을 만든다는 가능성을 남깁니다.",
    "따라서 stride sweep은 단순 penalty 측정이 아니라, memory-path 반응 경계를 찾고 후속 probe를 설계하기 위한 출발점으로 보는 편이 맞습니다.",
  ],

  caveats: [
    "현재 결과에는 warp address span, cache line footprint, sector count 같은 직접 지표가 포함되어 있지 않습니다.",
    "따라서 특정 stride에서의 peak 원인을 시간 데이터만으로 단정할 수는 없습니다.",
    "Nsight Compute metric과 offset sweep, page-scale stride probe를 결합하면 해석이 더 단단해집니다.",
    "이 실험은 내부 규칙을 직접 복원하기보다, 반응 경계와 이상 구간을 드러내는 데 더 적합합니다.",
  ],

  nextProbes: [
    "base_offset sweep to check alignment sensitivity",
    "page-scale stride sweep to expose large-address locality breakdown",
    "Nsight Compute capture for sector count, L1/L2 hit, DRAM throughput, and TLB-related clues",
    "shared staging comparison to test whether local regularization reduces global stride penalty",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default globalStrideSweepFixedWork;