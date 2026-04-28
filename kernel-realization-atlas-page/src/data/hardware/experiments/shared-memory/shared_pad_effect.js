const noPaddingReference = [
  { stride: 1, baseline_avg_ms: 0.292179 },
  { stride: 2, baseline_avg_ms: 0.292049 },
  { stride: 3, baseline_avg_ms: 0.295705 },
  { stride: 5, baseline_avg_ms: 0.291317 },
  { stride: 7, baseline_avg_ms: 0.293013 },
  { stride: 9, baseline_avg_ms: 0.292119 },
  { stride: 11, baseline_avg_ms: 0.296368 },
  { stride: 13, baseline_avg_ms: 0.294177 },
  { stride: 15, baseline_avg_ms: 0.225094 },
  { stride: 16, baseline_avg_ms: 0.440908 },
  { stride: 17, baseline_avg_ms: 0.190128 },
  { stride: 19, baseline_avg_ms: 0.189227 },
  { stride: 23, baseline_avg_ms: 0.188305 },
  { stride: 29, baseline_avg_ms: 0.187757 },
  { stride: 31, baseline_avg_ms: 0.191162 },
  { stride: 32, baseline_avg_ms: 0.844257 },
  { stride: 33, baseline_avg_ms: 0.189525 },
  { stride: 37, baseline_avg_ms: 0.187558 },
  { stride: 41, baseline_avg_ms: 0.188054 },
  { stride: 47, baseline_avg_ms: 0.188669 },
  { stride: 48, baseline_avg_ms: 0.389304 },
  { stride: 49, baseline_avg_ms: 0.189255 },
  { stride: 53, baseline_avg_ms: 0.187548 },
  { stride: 59, baseline_avg_ms: 0.187441 },
  { stride: 61, baseline_avg_ms: 0.191066 },
  { stride: 63, baseline_avg_ms: 0.188476 },
  { stride: 64, baseline_avg_ms: 0.895489 },
  { stride: 65, baseline_avg_ms: 0.189557 },
  { stride: 71, baseline_avg_ms: 0.197958 },
  { stride: 79, baseline_avg_ms: 0.187747 },
  { stride: 83, baseline_avg_ms: 0.187426 },
  { stride: 97, baseline_avg_ms: 0.190308 },
];

const paddedResults = [
  { stride: 1, padded_avg_ms: 0.438493, padded_min_ms: 0.436224, padded_max_ms: 0.441344 },
  { stride: 2, padded_avg_ms: 0.474150, padded_min_ms: 0.436224, padded_max_ms: 1.015808 },
  { stride: 3, padded_avg_ms: 0.514169, padded_min_ms: 0.436224, padded_max_ms: 1.093632 },
  { stride: 5, padded_avg_ms: 0.460425, padded_min_ms: 0.436224, padded_max_ms: 1.082368 },
  { stride: 7, padded_avg_ms: 0.502673, padded_min_ms: 0.436224, padded_max_ms: 0.983040 },
  { stride: 9, padded_avg_ms: 0.506569, padded_min_ms: 0.436224, padded_max_ms: 1.325056 },
  { stride: 11, padded_avg_ms: 0.504871, padded_min_ms: 0.436192, padded_max_ms: 0.979776 },
  { stride: 13, padded_avg_ms: 0.424960, padded_min_ms: 0.278528, padded_max_ms: 1.054560 },
  { stride: 15, padded_avg_ms: 0.282692, padded_min_ms: 0.276480, padded_max_ms: 0.310272 },
  { stride: 16, padded_avg_ms: 0.294468, padded_min_ms: 0.277504, padded_max_ms: 0.348160 },
  { stride: 17, padded_avg_ms: 0.293339, padded_min_ms: 0.277504, padded_max_ms: 0.661408 },
  { stride: 19, padded_avg_ms: 0.300945, padded_min_ms: 0.276480, padded_max_ms: 0.646880 },
  { stride: 23, padded_avg_ms: 0.291947, padded_min_ms: 0.277504, padded_max_ms: 0.328576 },
  { stride: 29, padded_avg_ms: 0.284162, padded_min_ms: 0.277504, padded_max_ms: 0.327680 },
  { stride: 31, padded_avg_ms: 0.617078, padded_min_ms: 0.558080, padded_max_ms: 1.143808 },
  { stride: 32, padded_avg_ms: 0.278313, padded_min_ms: 0.275232, padded_max_ms: 0.294912 },
  { stride: 33, padded_avg_ms: 0.283617, padded_min_ms: 0.276480, padded_max_ms: 0.327680 },
  { stride: 37, padded_avg_ms: 0.299461, padded_min_ms: 0.276480, padded_max_ms: 0.643072 },
  { stride: 41, padded_avg_ms: 0.284243, padded_min_ms: 0.277504, padded_max_ms: 0.325312 },
  { stride: 47, padded_avg_ms: 0.280730, padded_min_ms: 0.276480, padded_max_ms: 0.295936 },
  { stride: 48, padded_avg_ms: 0.280724, padded_min_ms: 0.275456, padded_max_ms: 0.322560 },
  { stride: 49, padded_avg_ms: 0.327793, padded_min_ms: 0.277504, padded_max_ms: 1.656832 },
  { stride: 53, padded_avg_ms: 0.287329, padded_min_ms: 0.277504, padded_max_ms: 0.325632 },
  { stride: 59, padded_avg_ms: 0.294775, padded_min_ms: 0.278528, padded_max_ms: 0.645120 },
  { stride: 61, padded_avg_ms: 0.286017, padded_min_ms: 0.277440, padded_max_ms: 0.395072 },
  { stride: 63, padded_avg_ms: 0.284528, padded_min_ms: 0.276480, padded_max_ms: 0.333824 },
  { stride: 64, padded_avg_ms: 0.283585, padded_min_ms: 0.274432, padded_max_ms: 0.339968 },
  { stride: 65, padded_avg_ms: 0.284119, padded_min_ms: 0.275456, padded_max_ms: 0.314368 },
  { stride: 71, padded_avg_ms: 0.293700, padded_min_ms: 0.277504, padded_max_ms: 0.321536 },
  { stride: 79, padded_avg_ms: 0.286949, padded_min_ms: 0.278528, padded_max_ms: 0.328704 },
  { stride: 83, padded_avg_ms: 0.285577, padded_min_ms: 0.278400, padded_max_ms: 0.364544 },
  { stride: 97, padded_avg_ms: 0.283250, padded_min_ms: 0.278528, padded_max_ms: 0.304128 },
];

const baselineByStride = new Map(
  noPaddingReference.map((row) => [row.stride, row])
);

const chartData = paddedResults.map((row) => {
  const baseline = baselineByStride.get(row.stride);
  const baselineAvg = baseline?.baseline_avg_ms ?? null;
  const paddedAvg = row.padded_avg_ms;

  return {
    stride: row.stride,
    baseline_avg_ms: baselineAvg,
    padded_avg_ms: paddedAvg,
    padded_min_ms: row.padded_min_ms,
    padded_max_ms: row.padded_max_ms,
    improvement_ratio:
      baselineAvg && paddedAvg ? baselineAvg / paddedAvg : null,
    padded_over_baseline:
      baselineAvg && paddedAvg ? paddedAvg / baselineAvg : null,
  };
});

const sharedPadEffect = {
  id: "shared-pad-effect",
  category: "Shared Memory",
  label: "Shared Padding Effect",
  summary:
    "Shared memory layout에 32-float 주기 padding을 추가해, bank-aligned stride spike가 완화되는지 확인합니다. 이 실험은 padding을 universal speedup으로 보는 것이 아니라, 특정 conflict-shaped latency spike를 깨뜨리는 layout transformation으로 해석합니다.",

  question:
    "padding을 추가하면 stride 16, 32, 48, 64에서 관찰된 shared memory latency spike가 완화되는가? 그리고 그 완화가 모든 stride에 대해 보편적으로 나타나는가, 아니면 특정 access pattern에 한정되는가?",

  whyItMatters:
    "AICF가 shared memory를 사용하는 realization을 선택하려면 단순히 shared memory가 빠르다는 사실만으로는 부족합니다. layout transformation이 어떤 conflict 후보를 줄이고, 어떤 구간에서는 오히려 비용을 만드는지 알아야 합니다. 이 probe는 padding을 하드웨어 반응을 이동시키는 변환으로 읽기 위한 evidence입니다.",

  method: [
    "padding이 없는 shared_bank_conflict_stride 결과를 baseline으로 사용합니다.",
    "동일한 block/grid/work 조건에서 shared memory logical index를 padded physical index로 변환합니다.",
    "padding_period=32를 사용해 32개 float마다 하나의 padding slot을 삽입합니다.",
    "stride별 baseline_avg_ms와 padded_avg_ms를 함께 비교합니다.",
    "특히 baseline에서 spike가 컸던 stride 16, 32, 48, 64가 padding 후 완화되는지 확인합니다.",
    "동시에 padding이 다른 stride에서 새로운 overhead나 phase-shifted spike를 만드는지도 확인합니다.",
  ],

  kernelShape: {
    accessPattern: "padded shared load stride sweep",
    comparedBaseline: "shared_bank_conflict_stride without padding",
    changedVariable: "logical-to-physical shared-memory layout mapping",
    paddingRule: "physical_index = logical_index + logical_index / 32",
    paddingPeriod: "32 floats",
    fixedWork: "same launched threads and same accesses per thread",
    launchedThreads: "256 x 256 = 65536",
    accessesPerThread: "1024 fixed",
    totalAccesses: "67,108,864",
    sharedSpanFloats: "8192 logical floats",
    paddedSharedSpanFloats: "8449 physical floats",
    interpretationTarget:
      "whether padding breaks bank-aligned conflict spikes rather than universally reducing cost",
  },

  codeSnippet: `int logical = tid * stride + j;
int wrapped = logical % shared_span_floats;

// Insert one padding element every 32 logical floats.
int physical = wrapped + wrapped / padding_period;

float x = smem[physical];
acc += x * 1.000001f;`,

  observe: [
    "baseline에서 spike가 컸던 stride 16, 32, 48, 64가 padding 후 완화되는가",
    "stride 32와 64처럼 32-bank alignment가 강한 지점에서 개선 폭이 큰가",
    "padding이 모든 stride를 개선하는가, 아니면 일부 stride에서 오히려 비용을 만드는가",
    "stride 31, 49처럼 padding 후 새로운 spike 또는 큰 max_ms가 나타나는 구간이 있는가",
    "min_ms와 max_ms 차이가 큰 구간에서 반복 간 변동성이 증가하는가",
  ],

  outputs: [
    "baseline vs padded avg_ms curve",
    "padding improvement ratio by stride",
    "padded min/max timing range",
    "conflict-spike mitigation points",
    "padding-induced overhead or shifted-spike candidates",
  ],

  chartData,

  charts: [
    {
      title: "No Padding vs Padding Avg Time",
      xKey: "stride",
      yKeys: ["baseline_avg_ms", "padded_avg_ms"],
      summary:
        "padding이 없는 baseline과 padding 적용 결과를 같은 stride 축에서 비교합니다. stride 16, 32, 48, 64의 spike 완화 여부를 직접 확인합니다.",
    },
    {
      title: "Padding Improvement Ratio",
      xKey: "stride",
      yKeys: ["improvement_ratio"],
      summary:
        "baseline_avg_ms / padded_avg_ms 값입니다. 1보다 크면 padding이 빨라진 것이고, 1보다 작으면 padding이 오히려 느려진 것입니다.",
    },
    {
      title: "Padded Timing Range",
      xKey: "stride",
      yKeys: ["padded_min_ms", "padded_avg_ms", "padded_max_ms"],
      summary:
        "padding 적용 결과의 min/avg/max를 함께 보여줍니다. 일부 stride에서 평균보다 max가 크게 튀는지 확인할 수 있습니다.",
    },
  ],

  resultHighlights: [
    "baseline에서 가장 큰 spike였던 stride 32는 0.844257 ms에서 0.278313 ms로 낮아져 약 3.03x 개선되었습니다.",
    "stride 64는 0.895489 ms에서 0.283585 ms로 낮아져 약 3.16x 개선되었습니다.",
    "stride 16은 0.440908 ms에서 0.294468 ms로, stride 48은 0.389304 ms에서 0.280724 ms로 낮아졌습니다.",
    "따라서 padding은 baseline의 16/32/48/64 bank-aligned spike를 실제로 완화했습니다.",
    "하지만 stride 1, 2, 3, 5, 7, 9, 11 등에서는 padding 적용 결과가 baseline보다 느려졌습니다.",
    "stride 31은 baseline 0.191162 ms에서 padding 0.617078 ms로 증가해, padding이 새로운 불리한 mapping을 만들 수 있음을 보여줍니다.",
  ],

  interpretation: [
    "padding은 shared memory를 항상 빠르게 만드는 일반 최적화가 아닙니다. 특정 bank-aligned conflict pattern을 깨뜨리는 layout transformation입니다.",
    "stride 32와 64에서 큰 개선이 나타난 것은 padding이 32-bank alignment를 깨뜨렸다는 강한 정성적 evidence입니다.",
    "반대로 작은 stride와 일부 odd stride에서 padding이 느려진 것은 주소 변환, physical layout 변화, 새로운 bank mapping phase가 비용을 만들 수 있음을 의미합니다.",
    "이 결과는 shared memory 최적화가 'shared를 쓰면 빠르다'가 아니라 'access pattern과 layout이 맞아야 빠르다'는 점을 보여줍니다.",
    "AICF 관점에서는 padding을 무조건 적용하는 rewrite가 아니라, conflict 후보가 있는 kernel shape에 조건부로 적용하는 realization rule로 다뤄야 합니다.",
  ],

  caveats: [
    "baseline 실험은 warmup 10, repeat 50이고 padding 실험은 warmup 5, repeat 30입니다. 절대 시간 비교보다 spike 완화의 구조적 패턴에 더 무게를 둬야 합니다.",
    "padding 결과는 일부 stride에서 max_ms가 크게 튀므로 평균만으로 안정성을 판단하면 안 됩니다.",
    "padding은 physical shared span을 증가시키므로 shared memory footprint와 occupancy에 영향을 줄 수 있습니다.",
    "현재 실험은 read-mode 중심이며, write conflict와 read/write mixed pattern에서는 결과가 달라질 수 있습니다.",
    "Nsight Compute의 shared transaction, bank conflict 관련 지표가 붙으면 해석 신뢰도가 더 높아집니다.",
  ],

  nextProbes: [
    "shared_read_vs_write_stride로 read/write conflict 민감도를 분리합니다.",
    "shared_broadcast_vs_conflict로 broadcast path와 bank conflict path를 분리합니다.",
    "padding_period sweep으로 16, 32, 64 등 padding 주기가 spike 위치를 어떻게 이동시키는지 확인합니다.",
    "shared footprint를 키우거나 줄여 padding이 occupancy와 shared memory capacity에 미치는 영향을 확인합니다.",
  ],

  nextLinks: [
    {
      label: "Shared Bank Conflict Stride 기준 실험 보기",
      href: "/hardware-evidence/shared-bank-conflict-stride",
    },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
  ],

  keyFindings: [
    { label: "stride 32", value: "3.03x faster" },
    { label: "stride 64", value: "3.16x faster" },
    { label: "shifted spike", value: "stride 31" },
    { label: "rule", value: "conditional padding" },
  ],
};

export default sharedPadEffect;