const topSpikeData = [
  {
    rank: 1,
    padding_period: 31,
    stride: 62,
    median_ms: 0.72704,
    stable_median_ms: 0.28,
    spike_ratio: 2.5966,
    ridge_type: "known-model ridge",
    label: "P31 / S62",
  },
  {
    rank: 2,
    padding_period: 31,
    stride: 31,
    median_ms: 0.723968,
    stable_median_ms: 0.28,
    spike_ratio: 2.5856,
    ridge_type: "known-model ridge",
    label: "P31 / S31",
  },
  {
    rank: 3,
    padding_period: 63,
    stride: 63,
    median_ms: 0.720352,
    stable_median_ms: 0.28,
    spike_ratio: 2.5727,
    ridge_type: "known-model ridge",
    label: "P63 / S63",
  },
  {
    rank: 4,
    padding_period: 47,
    stride: 94,
    median_ms: 0.683008,
    stable_median_ms: 0.28,
    spike_ratio: 2.4393,
    ridge_type: "known-model ridge",
    label: "P47 / S94",
  },
  {
    rank: 5,
    padding_period: 31,
    stride: 93,
    median_ms: 0.677888,
    stable_median_ms: 0.28,
    spike_ratio: 2.421,
    ridge_type: "known-model ridge",
    label: "P31 / S93",
  },
  {
    rank: 6,
    padding_period: 23,
    stride: 92,
    median_ms: 0.676864,
    stable_median_ms: 0.28,
    spike_ratio: 2.4174,
    ridge_type: "residual candidate",
    label: "P23 / S92",
  },
  {
    rank: 7,
    padding_period: 64,
    stride: 63,
    median_ms: 0.657184,
    stable_median_ms: 0.28,
    spike_ratio: 2.3471,
    ridge_type: "known-model ridge",
    label: "P64 / S63",
  },
  {
    rank: 8,
    padding_period: 62,
    stride: 63,
    median_ms: 0.634768,
    stable_median_ms: 0.28,
    spike_ratio: 2.267,
    ridge_type: "64-near phase band",
    label: "P62 / S63",
  },
  {
    rank: 9,
    padding_period: 32,
    stride: 31,
    median_ms: 0.563072,
    stable_median_ms: 0.28,
    spike_ratio: 2.011,
    ridge_type: "known-model ridge",
    label: "P32 / S31",
  },
  {
    rank: 10,
    padding_period: 65,
    stride: 63,
    median_ms: 0.548864,
    stable_median_ms: 0.28,
    spike_ratio: 1.9602,
    ridge_type: "64-near phase band",
    label: "P65 / S63",
  },
];

const ridgeSummaryData = [
  {
    ridge_id: 1,
    padding_period: 31,
    strong_stride: 31,
    median_ms: 0.723968,
    ridge_family: "kP",
    interpretation: "expected from padding-period alignment",
  },
  {
    ridge_id: 2,
    padding_period: 31,
    strong_stride: 62,
    median_ms: 0.72704,
    ridge_family: "kP",
    interpretation: "expected from padding-period alignment",
  },
  {
    ridge_id: 3,
    padding_period: 31,
    strong_stride: 93,
    median_ms: 0.677888,
    ridge_family: "kP",
    interpretation: "expected from padding-period alignment",
  },
  {
    ridge_id: 4,
    padding_period: 32,
    strong_stride: 31,
    median_ms: 0.563072,
    ridge_family: "P-1",
    interpretation: "expected shifted ridge after period-32 padding",
  },
  {
    ridge_id: 5,
    padding_period: 32,
    strong_stride: 62,
    median_ms: 0.455,
    ridge_family: "2(P-1)",
    interpretation: "expected shifted ridge after period-32 padding",
  },
  {
    ridge_id: 6,
    padding_period: 47,
    strong_stride: 94,
    median_ms: 0.683008,
    ridge_family: "2P",
    interpretation: "expected from padding-period alignment",
  },
  {
    ridge_id: 7,
    padding_period: 63,
    strong_stride: 63,
    median_ms: 0.720352,
    ridge_family: "P",
    interpretation: "expected strong period ridge",
  },
  {
    ridge_id: 8,
    padding_period: 64,
    strong_stride: 63,
    median_ms: 0.657184,
    ridge_family: "P-1",
    interpretation: "expected 64-adjacent shifted ridge",
  },
];

const phaseBandData = [
  { padding_period: 59, strong_stride: 63, band: "64-near", intensity: 1 },
  { padding_period: 60, strong_stride: 63, band: "64-near", intensity: 1 },
  { padding_period: 61, strong_stride: 63, band: "64-near", intensity: 1 },
  { padding_period: 62, strong_stride: 63, band: "64-near", intensity: 2 },
  { padding_period: 63, strong_stride: 63, band: "64-near", intensity: 3 },
  { padding_period: 64, strong_stride: 63, band: "64-near", intensity: 3 },
  { padding_period: 65, strong_stride: 63, band: "64-near", intensity: 2 },
  { padding_period: 66, strong_stride: 63, band: "64-near", intensity: 1 },
  { padding_period: 67, strong_stride: 63, band: "64-near", intensity: 1 },
  { padding_period: 68, strong_stride: 63, band: "64-near", intensity: 1 },
];

const sharedPaddingPhaseSweep = {
  id: "shared-padding-phase-sweep",
  category: "Shared Memory",
  label: "Shared Bank Mapping Calibration Sweep",
  summary:
    "padding_period=17..80, stride=1..96의 2차원 sweep을 통해 알려진 shared-memory bank mapping 모델이 실제 timing heatmap에서 재현되는지 확인합니다. 이 probe는 새로운 GPU 동작을 발견하기 위한 실험이라기보다, 이후 residual latency 분석을 위한 calibration baseline입니다.",

  question:
    "이미 알고 있는 logical-to-physical mapping과 bank = physical_address % 32 모델이 실제 latency 지형에서도 재현되는가? 그리고 그 모델로 설명되지 않는 residual 구조는 어디에 남는가?",

  whyItMatters:
    "P와 stride가 bank pattern을 바꾸는 것은 이미 예측 가능한 내용입니다. 따라서 이 실험의 가치는 padding period 자체의 새로움이 아니라, known bank-conflict model을 timing measurement와 맞춰 보고 이후 모델로 설명되지 않는 latency residual을 찾기 위한 기준선을 만드는 데 있습니다.",

  method: [
    "padding_period를 17부터 80까지 sweep합니다.",
    "stride를 1부터 96까지 sweep합니다.",
    "각 point는 동일한 num_blocks, threads_per_block, accesses_per_thread, shared_span_floats 조건에서 측정합니다.",
    "padding rule은 physical = logical + logical / padding_period로 고정합니다.",
    "이 실험에서는 spike 자체를 발견으로 보지 않습니다. spike가 known bank mapping model과 일치하는지 확인하는 calibration으로 봅니다.",
    "avg_ms는 outlier 영향을 크게 받을 수 있으므로 median_ms를 주 해석 지표로 사용합니다.",
    "후속 분석에서는 각 point의 bank histogram, unique bank count, max lanes per bank, predicted conflict degree를 계산하고 measured median_ms와 비교해야 합니다.",
    "진짜 관심 대상은 measured latency가 아니라 predicted bank conflict model로 설명되지 않는 residual입니다.",
  ],

  kernelShape: {
    accessPattern: "2D padded shared-memory bank-mapping calibration sweep",
    changedVariables: ["padding period", "stride"],
    paddingPeriodRange: "17..80",
    strideRange: "1..96",
    totalPoints: "64 x 96 = 6144",
    paddingRule: "physical_index = logical_index + logical_index / padding_period",
    knownBankModel: "bank = physical_index % 32 for float access",
    fixedWork:
      "same blocks, same threads per block, same accesses per thread, same logical shared span",
    numBlocks: "256",
    threadsPerBlock: "256",
    accessesPerThread: "1024",
    sharedSpanFloats: "8192",
    repeatIters: "20",
    primaryMetric: "median_ms",
    secondaryMetrics: ["avg_ms", "max_ms", "normalized median ratio"],
    calibrationRole:
      "known bank-mapping reproduction test before residual analysis",
    nextTarget:
      "measured_median_ms - predicted_conflict_cost or measured_median_ms / predicted_conflict_cost",
  },

  codeSnippet: `int logical = tid * stride + j;
int wrapped = logical % shared_span_floats;

// Sweep padding_period from 17 to 80.
int physical = wrapped + wrapped / padding_period;

// Known model for calibration:
int bank = physical % 32;

float x = smem[physical];
acc += x * 1.000001f;`,

  observe: [
    "known bank mapping model로 예측 가능한 ridge가 실제 timing heatmap에서 재현되는가",
    "padding_period=31에서 stride 31, 62, 93처럼 kP 계열이 나타나는가",
    "padding_period=32에서 stride 31, 62처럼 P-1 계열이 나타나는가",
    "padding_period=63, 64 근처에서 stride 63 계열이 나타나는가",
    "padding_period=17에서 sharp spike가 아니라 broad plateau가 나타나는가",
    "같은 predicted conflict degree를 갖는 point들 사이에서 measured median_ms가 크게 갈리는가",
    "median_ms는 낮지만 max_ms만 튀는 phase가 존재하는가",
  ],

  outputs: [
    "known-model timing reproduction map",
    "median_ms calibration heatmap target",
    "normalized median ratio target",
    "period multiple ridge candidates",
    "P-1 ridge candidates",
    "64-near phase band candidates",
    "small-period broad plateau evidence",
    "future residual heatmap target",
  ],

  chartData: topSpikeData,

  charts: [
    {
      title: "Top Calibration Spikes by Median Time",
      xKey: "rank",
      yKeys: ["median_ms", "stable_median_ms"],
      summary:
        "상위 spike를 rank 순서로 보여줍니다. 이 spike들은 새로운 발견이라기보다, known bank mapping과 padding boundary가 timing에서 재현되는지 확인하기 위한 calibration point입니다.",
    },
    {
      title: "Spike Ratio Against Stable Median",
      xKey: "rank",
      yKeys: ["spike_ratio"],
      summary:
        "median_ms / stable_median_ms 기준의 spike ratio입니다. 이 값은 모델 재현 강도를 빠르게 보기 위한 것이며, 후속 단계에서는 predicted conflict cost 대비 residual ratio로 대체되어야 합니다.",
    },
  ],

  keyFindings: [
    { label: "role", value: "calibration" },
    { label: "sweep size", value: "6144 points" },
    { label: "known ridge", value: "P31 / S62" },
    { label: "next metric", value: "residual" },
  ],

  resultHighlights: [
    "이 실험은 새로운 GPU 동작을 발견한 실험이라기보다, 이미 알려진 shared-memory bank mapping과 padding layout transformation이 timing heatmap에서 재현되는지 확인한 calibration입니다.",
    "padding_period=31에서는 stride 31, 62, 93이 강하게 튀며, 이는 stride=kP 형태의 period multiple ridge로 설명 가능합니다.",
    "padding_period=32에서는 stride 31, 62가 강하게 나타나며, 이는 period-32 padding이 기존 stride-32 정렬을 깨는 대신 P-1 계열로 spike를 이동시키는 구조로 설명 가능합니다.",
    "padding_period=63/64 주변에서는 stride 63이 강하게 나타납니다. 이 역시 32-bank / 64-near periodicity와 결합된 known-model 후보로 먼저 봐야 합니다.",
    "padding_period=17의 stride 1..16 broad plateau는 sharp bank-conflict spike라기보다 small-period dense padding과 low-stride boundary phase가 만든 별도 calibration pattern으로 분리해야 합니다.",
    "따라서 이 페이지의 결론은 padding period가 새롭고 알 수 없는 GPU 특성을 드러냈다는 것이 아니라, 이후 residual analysis에 필요한 known-model baseline을 만들었다는 것입니다.",
  ],

  interpretation: [
    "P와 stride를 바꾸면 bank pattern이 바뀐다는 사실 자체는 새롭지 않습니다. bank = physical_index % 32 모델로 많은 구조를 예측할 수 있습니다.",
    "따라서 이 sweep을 GPU mechanism discovery로 해석하면 과장입니다. 이 실험은 probe가 제대로 작동하는지, 그리고 heatmap/median/max 분석 파이프라인이 expected ridge를 재현하는지 확인하는 기준 실험입니다.",
    "진짜 GPU probing은 여기서부터 시작됩니다. known bank-conflict model이 예측한 ridge를 제거한 뒤에도 남는 residual latency structure를 찾아야 합니다.",
    "흥미로운 후보는 conflict degree가 같은데 latency가 크게 다른 point, predicted conflict가 낮은데 median_ms가 높은 point, median은 낮지만 max_ms만 반복적으로 튀는 point입니다.",
    "AICF 관점에서는 이 실험을 padding 최적화 결론으로 사용하지 않습니다. 대신 padding rewrite 후보를 평가할 때 사용할 model baseline과 residual analyzer의 입력으로 사용합니다.",
  ],

  caveats: [
    "이 실험은 timing 기반 calibration입니다. bank conflict를 직접 계수한 것이 아닙니다.",
    "P와 stride의 ridge 대부분은 known bank mapping model로 설명 가능한 후보입니다. 따라서 이 자체를 새로운 하드웨어 발견으로 주장하면 안 됩니다.",
    "avg_ms는 outlier 영향을 받기 때문에 단독 해석에 부적합합니다. median_ms를 주 지표로, max_ms를 occasional stall 후보로 봐야 합니다.",
    "현재 결과는 shared_span_floats=8192와 modulo wrap 조건에 묶여 있습니다. span 또는 base offset을 바꾸면 같은 bank histogram에서 latency가 달라지는지 확인해야 합니다.",
    "padding_period가 작아지면 physical shared span이 증가하고 boundary가 자주 삽입되므로, bank conflict 외의 shared footprint 또는 instruction overhead가 섞일 수 있습니다.",
    "후속 residual analysis 없이 이 실험만으로 padding period 선택 규칙을 만들면 안 됩니다.",
  ],

  nextProbes: [
    "shared_bank_model_residual_analyzer로 각 P/stride point의 bank histogram과 predicted conflict degree를 계산합니다.",
    "conflict_degree가 같은 point끼리 그룹화하고, 그룹 내부에서 measured median_ms가 비정상적으로 높은 point를 찾습니다.",
    "same bank histogram인데 shared_span_floats 또는 base offset을 바꾸면 latency가 달라지는지 확인합니다.",
    "shared_padding_phase_span_sweep으로 shared_span_floats를 2048, 4096, 8192, 16384로 바꿔 ridge가 유지되는지 확인합니다.",
    "median_ms residual heatmap과 max_ms residual heatmap을 분리해 반복적 phase cost와 occasional stall 후보를 구분합니다.",
    "Nsight Compute capture로 residual spike와 shared transaction/replay 지표가 대응하는지 확인합니다.",
  ],

  nextLinks: [
    {
      label: "Shared Padding Period Sweep 보기",
      href: "/hardware-evidence/shared-padding-period-sweep",
    },
    {
      label: "Shared Padding Effect 보기",
      href: "/hardware-evidence/shared-pad-effect",
    },
    {
      label: "Shared Bank Conflict Stride 보기",
      href: "/hardware-evidence/shared-bank-conflict-stride",
    },
  ],

  extraNotes: {
    ridgeSummaryData,
    phaseBandData,
    revisedRole:
      "This probe is a calibration baseline, not a hardware discovery result.",
    knownModel:
      "logical = lane_id * stride; physical = logical + floor(logical / padding_period); bank = physical % 32.",
    residualTarget:
      "The next meaningful target is measured latency residual after subtracting or normalizing by predicted bank-conflict cost.",
    documentationSummary:
      "이 실험은 padding 자체의 새로운 성질을 발견한 것이 아니라, 이미 알려진 shared-memory bank mapping과 padding layout 변환이 실제 latency heatmap으로 재현되는지 확인한 기준 실험이다. 후속 GPU probing에서는 이 known model을 baseline으로 두고, 모델로 설명되지 않는 residual latency structure를 찾아야 한다.",
  },
};

export default sharedPaddingPhaseSweep;