import raw from "./shared_padding_period_sweep_raw.json";

function formatPeriodKey(period) {
  return `period_${period}_avg_ms`;
}

function formatPeriodMinKey(period) {
  return `period_${period}_min_ms`;
}

function formatPeriodMaxKey(period) {
  return `period_${period}_max_ms`;
}

function buildWideChartData(results = []) {
  const byStride = new Map();

  for (const row of results) {
    const stride = row.stride;
    const period = row.padding_period;

    if (!byStride.has(stride)) {
      byStride.set(stride, { stride });
    }

    const target = byStride.get(stride);

    target[formatPeriodKey(period)] = row.avg_ms;
    target[formatPeriodMinKey(period)] = row.min_ms;
    target[formatPeriodMaxKey(period)] = row.max_ms;
  }

  return Array.from(byStride.values()).sort((a, b) => a.stride - b.stride);
}

function getRow(results, paddingPeriod, stride) {
  return results.find(
    (row) => row.padding_period === paddingPeriod && row.stride === stride
  );
}

function getTopSpikes(results = [], count = 8) {
  return [...results]
    .sort((a, b) => b.avg_ms - a.avg_ms)
    .slice(0, count)
    .map((row) => ({
      label: `P${row.padding_period} / S${row.stride}`,
      value: `${row.avg_ms.toFixed(3)} ms`,
    }));
}

const chartData = buildWideChartData(raw.results);
const paddingPeriods = raw.config.padding_periods;

const periodAvgKeys = paddingPeriods.map(formatPeriodKey);
const period32 = raw.results.filter((row) => row.padding_period === 32);
const period64 = raw.results.filter((row) => row.padding_period === 64);

const period31Stride31 = getRow(raw.results, 31, 31);
const period32Stride31 = getRow(raw.results, 32, 31);
const period33Stride31 = getRow(raw.results, 33, 31);
const period64Stride63 = getRow(raw.results, 64, 63);
const period64Stride64 = getRow(raw.results, 64, 64);

const sharedPaddingPeriodSweep = {
  id: "shared-padding-period-sweep",
  category: "Shared Memory",
  label: "Shared Padding Period Sweep",
  summary:
    "Shared memory padding period를 16, 31, 32, 33, 64로 바꾸며 conflict spike의 위치가 logical-to-physical mapping boundary와 함께 이동하는지 관찰합니다. 이 probe는 padding을 단순 최적화가 아니라 spike topology를 이동시키는 layout transformation으로 읽기 위한 실험입니다.",

  question:
    "padding period를 바꾸면 shared memory latency spike는 사라지는가, 아니면 다른 stride 위치로 이동하는가? spike 위치가 padding boundary와 어떤 관계를 갖는가?",

  whyItMatters:
    "AICF가 shared memory layout rewrite를 선택하려면 padding을 무조건 적용하는 규칙으로 다루면 안 됩니다. padding period는 bank mapping을 깨뜨릴 수도 있지만, 동시에 새로운 불리한 phase를 만들 수 있습니다. 이 실험은 padding period가 하드웨어 반응의 지형을 어떻게 이동시키는지 보여주는 evidence입니다.",

  method: [
    "동일한 shared memory stride sweep 조건에서 padding period만 바꿉니다.",
    "padding_period 16, 31, 32, 33, 64를 비교합니다.",
    "각 period마다 같은 stride 집합을 측정해 spike 위치가 period boundary 근처로 이동하는지 확인합니다.",
    "avg_ms뿐 아니라 min_ms와 max_ms를 함께 기록해 특정 period/stride 조합에서 반복 간 불안정성이 커지는지 확인합니다.",
    "이 실험은 shared_pad_effect의 후속 probe로, padding이 spike를 단순 제거하는지 혹은 이동시키는지 구분합니다.",
  ],

  kernelShape: {
    accessPattern: "padded shared-memory stride sweep",
    changedVariable: "padding period",
    paddingPeriods: paddingPeriods.join(", "),
    paddingRule: "physical_index = logical_index + logical_index / padding_period",
    fixedWork: "same blocks, threads per block, accesses per thread, shared span",
    numBlocks: String(raw.config.num_blocks),
    threadsPerBlock: String(raw.config.threads_per_block),
    launchedThreads: `${raw.config.num_blocks} x ${raw.config.threads_per_block} = ${
      raw.config.num_blocks * raw.config.threads_per_block
    }`,
    accessesPerThread: String(raw.config.accesses_per_thread),
    totalAccesses: String(
      raw.config.num_blocks *
        raw.config.threads_per_block *
        raw.config.accesses_per_thread
    ),
    sharedSpanFloats: String(raw.config.shared_span_floats),
    interpretationTarget:
      "whether conflict spike topology moves with logical-to-physical padding boundaries",
  },

  codeSnippet: `int logical = tid * stride + j;
int wrapped = logical % shared_span_floats;

// Padding period is swept: 16, 31, 32, 33, 64.
int physical = wrapped + wrapped / padding_period;

float x = smem[physical];
acc += x * 1.000001f;`,

  observe: [
    "padding_period 31, 32, 33에서 stride 31 근처의 spike가 어떻게 달라지는가",
    "padding_period 64에서 stride 63 또는 64 근처에 spike가 이동하는가",
    "period가 32-bank alignment와 가까울 때 spike 위치가 어떻게 형성되는가",
    "padding_period 16처럼 더 촘촘한 padding이 전체 구간에 overhead를 만드는가",
    "min_ms와 max_ms 차이가 큰 period/stride 조합이 반복 안정성 문제를 시사하는가",
  ],

  outputs: [
    "padding period별 stride timing curve",
    "period/stride spike topology",
    "padding boundary shifted spike candidates",
    "min/avg/max timing stability comparison",
    "layout transformation sensitivity evidence",
  ],

  chartData,

  charts: [
    {
      title: "Padding Period Sweep: Avg Time by Stride",
      xKey: "stride",
      yKeys: periodAvgKeys,
      summary:
        "padding period 16, 31, 32, 33, 64를 같은 stride 축에서 비교합니다. spike가 완전히 사라지는지, 아니면 period boundary 근처로 이동하는지 확인합니다.",
    },
    {
      title: "Padding Period 32 Timing Range",
      xKey: "stride",
      yKeys: [
        formatPeriodMinKey(32),
        formatPeriodKey(32),
        formatPeriodMaxKey(32),
      ],
      summary:
        "padding period 32에서 min/avg/max를 함께 봅니다. stride 31 근처 spike가 평균뿐 아니라 반복 범위에서도 뚜렷한지 확인합니다.",
    },
    {
      title: "Padding Period 64 Timing Range",
      xKey: "stride",
      yKeys: [
        formatPeriodMinKey(64),
        formatPeriodKey(64),
        formatPeriodMaxKey(64),
      ],
      summary:
        "padding period 64에서 min/avg/max를 함께 봅니다. stride 63에서 강한 spike가 형성되는지 확인합니다.",
    },
  ],

  keyFindings: [
    {
      label: "period 31 / stride 31",
      value: `${period31Stride31?.avg_ms?.toFixed(3) ?? "-"} ms`,
    },
    {
      label: "period 32 / stride 31",
      value: `${period32Stride31?.avg_ms?.toFixed(3) ?? "-"} ms`,
    },
    {
      label: "period 33 / stride 31",
      value: `${period33Stride31?.avg_ms?.toFixed(3) ?? "-"} ms`,
    },
    {
      label: "period 64 / stride 63",
      value: `${period64Stride63?.avg_ms?.toFixed(3) ?? "-"} ms`,
    },
  ],

  resultHighlights: [
    `padding_period 31에서는 stride 31이 ${period31Stride31?.avg_ms?.toFixed(
      6
    )} ms로 가장 뚜렷한 spike 후보가 되었습니다.`,
    `padding_period 32에서도 stride 31이 ${period32Stride31?.avg_ms?.toFixed(
      6
    )} ms로 강하게 튀며, period boundary 바로 앞 stride가 불리한 mapping을 만들 수 있음을 보여줍니다.`,
    `padding_period 33에서는 stride 31 spike가 ${period33Stride31?.avg_ms?.toFixed(
      6
    )} ms 수준으로 완화되지만 완전히 사라지지는 않습니다.`,
    `padding_period 64에서는 stride 63이 ${period64Stride63?.avg_ms?.toFixed(
      6
    )} ms로 크게 튀고, stride 64는 ${period64Stride64?.avg_ms?.toFixed(
      6
    )} ms로 낮게 유지됩니다.`,
    "padding period를 바꾸면 spike가 단순히 제거되는 것이 아니라 다른 stride 위치로 이동할 수 있습니다.",
    "padding_period 16은 초반 stride 구간에서 0.49~0.52 ms 수준의 높은 평균을 보여, padding이 과하면 전반적인 overhead나 불안정한 mapping을 만들 수 있음을 시사합니다.",
  ],

  interpretation: [
    "이 결과는 padding이 bank conflict를 보편적으로 제거하는 스위치가 아니라, logical-to-physical index mapping을 바꾸는 transformation임을 보여줍니다.",
    "period 31과 32에서 stride 31 spike가 두드러진 것은 padding boundary와 stride pattern이 특정 phase에서 다시 정렬될 수 있음을 시사합니다.",
    "period 64에서 stride 63 spike가 나타난 점은 period boundary 바로 앞 stride가 새로운 conflict topology를 만들 수 있다는 강한 단서입니다.",
    "따라서 shared_pad_effect에서 stride 32/64 spike가 완화되었다고 해서 padding을 항상 적용하면 된다고 결론 내리면 안 됩니다.",
    "AICF 관점에서는 padding period를 kernel shape, stride pattern, shared footprint와 함께 선택해야 하며, 고정 규칙이 아니라 조건부 realization parameter로 다뤄야 합니다.",
  ],

  caveats: [
    "이 실험은 timing 기반 probe이므로 bank conflict를 직접 계수한 결과는 아닙니다.",
    "avg_ms spike는 bank mapping 외에도 instruction scheduling, modulo/index arithmetic, shared memory footprint, occupancy, 반복 간 변동성의 영향을 받을 수 있습니다.",
    "padding_period가 작아질수록 padded shared span과 shared memory footprint가 증가하므로 occupancy와 resource pressure가 달라질 수 있습니다.",
    "period별 max_ms가 큰 구간은 평균만으로 해석하면 안 됩니다. min/avg/max를 함께 봐야 합니다.",
    "Nsight Compute의 shared transaction, bank conflict, replay 관련 지표가 붙으면 해석 신뢰도가 더 높아집니다.",
  ],

  nextProbes: [
    "padding_period를 더 촘촘히 sweep해 spike 위치가 period-1 근처에서 반복되는지 확인합니다.",
    "shared_read_vs_write_stride로 read/write conflict 민감도를 분리합니다.",
    "shared_broadcast_vs_conflict로 broadcast와 bank conflict path를 분리합니다.",
    "shared footprint sweep으로 padded span 증가가 occupancy에 미치는 영향을 확인합니다.",
  ],

  nextLinks: [
    {
      label: "Shared Padding Effect 기준 실험 보기",
      href: "/hardware-evidence/shared-pad-effect",
    },
    {
      label: "Shared Bank Conflict Stride 보기",
      href: "/hardware-evidence/shared-bank-conflict-stride",
    },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
  ],

  rawMetadata: {
    probeId: raw.probe_id,
    device: raw.device,
    config: raw.config,
    topSpikes: getTopSpikes(raw.results),
    period32,
    period64,
  },
};

export default sharedPaddingPeriodSweep;