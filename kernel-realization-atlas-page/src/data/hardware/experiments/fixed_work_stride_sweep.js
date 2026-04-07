const fixedWorkStrideSweep = {
  id: "fixed-work-stride-sweep",
  category: "Memory Response",
  label: "Fixed-Work Stride Sweep",
  summary:
    "총 접근 횟수를 고정한 채 stride만 바꾸어, workload 증가 효과를 제거하고 access pattern 변화 자체의 비용을 더 직접적으로 읽는 실험입니다.",
  question:
    "총 work는 같고 access pattern만 달라질 때도 stride 변화가 성능 차이를 강하게 만들까?",
  whyItMatters:
    "일반 stride sweep은 stride 증가와 함께 실제 접근 범위나 전체 traffic의 성격도 함께 변할 수 있습니다. fixed-work 실험은 이 혼합 효과를 줄여, access inefficiency 자체를 더 직접적으로 보여줍니다.",

  method: [
    "총 launched work 또는 total access count를 고정합니다.",
    "stride만 바꾸되, 전체 연산량은 가능한 한 동일하게 유지합니다.",
    "timing과 checksum을 함께 기록해 기능 차이 없이 응답만 비교합니다.",
    "일반 stride sweep과 나란히 보며 access cost의 본질적 부분을 분리해 읽습니다.",
  ],

  kernelShape: {
    grid: "fixed total threads or fixed logical work",
    block: "1D block",
    accessPattern: "fixed total accesses with stride-based indexing",
    variedParameter: "stride under constant work",
    timing: "repeated average kernel timing",
    validation: "checksum / same total logical work",
  },

  codeSnippet: `int logical_tid = blockIdx.x * blockDim.x + threadIdx.x;
int access_idx = (logical_tid * stride) % span;
for (int it = 0; it < accesses_per_thread; ++it) {
  acc += input[(access_idx + it * stride) % span];
}`,

  observe: [
    "총 work가 같을 때 stride 증가가 시간 증가로 이어지는가",
    "일반 stride sweep 대비 곡선 형태가 어떻게 달라지는가",
    "순수 access inefficiency를 더 직접적으로 읽을 수 있는가",
    "hardware response가 workload 크기보다 pattern에 민감한가",
  ],

  outputs: [
    "stride vs avg_ms",
    "global stride sweep 대비 비교 코멘트",
    "same work / different pattern 결과 요약",
    "실험 config metadata",
  ],

  resultHighlights: [
    "총 work를 고정해도 stride 증가에 따라 응답이 악화되는 패턴이 남을 수 있습니다.",
    "이는 단순히 더 많은 일을 해서 느려지는 것이 아니라 access pattern 자체가 비용 원인임을 뒷받침합니다.",
    "일부 구간에서는 일반 stride sweep보다 더 명확한 pattern sensitivity가 드러날 수 있습니다.",
  ],

  interpretation: [
    "realization 선택에서 중요한 것은 연산량만이 아니라 access organization입니다.",
    "같은 FLOPs, 같은 logical work라도 access path가 나쁘면 execution quality가 크게 저하될 수 있습니다.",
    "이 결과는 layout-aware lowering이나 tiled access planning의 필요성을 강하게 지지합니다.",
  ],

  caveats: [
    "modulo 기반 indexing은 또 다른 locality 왜곡을 만들 수 있습니다.",
    "fixed-work를 구현하는 방식에 따라 cache reuse 성격이 달라질 수 있습니다.",
    "absolute 수치보다 pattern 비교와 방향성 해석에 더 적합한 실험입니다.",
  ],

  nextLinks: [
    { label: "변환 성질 보기", href: "/properties-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
  ],
};

export default fixedWorkStrideSweep;