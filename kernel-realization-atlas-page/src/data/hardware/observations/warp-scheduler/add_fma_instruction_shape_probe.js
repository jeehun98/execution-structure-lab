// hardware/observations/warp-scheduler/add_fma_instruction_shape_probe.js

export const addFmaInstructionShapeProbeObservation = {
  id: "add_fma_instruction_shape_probe",
  groupLabel: "Warp Scheduling",
  type: "Instruction Shape Probe",
  label: "ADD/FMA instruction shape probe",
  title: "ADD/FMA chain에서 드러나는 SASS instruction shape signature",

  summary:
    "ADD와 FMA arithmetic workload를 dependency-chain 길이와 compiler-generated SASS shape 관점에서 비교한 probe입니다. 이 실험은 ADD/FMA의 단순 연산 속도 비교가 아니라, source-level kernel shape가 compiler lowering을 거쳐 어떤 SASS instruction stream으로 변형되고, 그 결과 warp progress signature가 어떻게 달라지는지 관찰합니다.",

  keyFindings: [
    {
      label: "Compared Ops",
      value: "FADD / FFMA",
      desc: "ADD와 FMA arithmetic chain 비교",
    },
    {
      label: "Chain Sensitivity",
      value: "8 → 16",
      desc: "dependency chain 길이 증가에 따른 progress 감소 관찰",
    },
    {
      label: "Primary Evidence",
      value: "SASS shape",
      desc: "progress 해석은 source code가 아니라 실제 SASS instruction stream 기준",
    },
    {
      label: "Main Caveat",
      value: "not pure latency",
      desc: "progress ratio를 operation latency ratio로 직접 해석하면 안 됨",
    },
  ],

  probeContext: {
    title: "이 probe가 묻는 질문",
    body:
      "이 실험은 ADD와 FMA가 source-level에서 비슷한 arithmetic 반복처럼 보이더라도, compiler가 생성한 SASS instruction shape가 달라질 수 있다는 점에 주목합니다. 특히 dependency chain 길이를 8에서 16으로 늘렸을 때 progress가 감소하지만, 그 감소가 단순히 chain 길이에 비례하는지, 혹은 instruction stream shape와 source setup 비용이 함께 영향을 주는지 확인합니다.",
    question:
      "ADD/FMA arithmetic chain의 progress 차이는 순수 operation latency 차이인가, 아니면 compiler-generated SASS instruction shape가 만든 execution signature인가?",
  },

  knownMechanisms: {
    title: "해석에 필요한 실행 모델",
    items: [
      {
        label: "Dependency chain",
        text:
          "dependent arithmetic chain에서는 이전 instruction의 결과가 다음 instruction의 입력이 됩니다. 이 구조는 warp가 다음 instruction을 issue하기 위해 결과 dependency를 기다리게 만들 수 있습니다.",
      },
      {
        label: "SASS instruction shape",
        text:
          "CUDA source의 ADD/FMA 표현은 compiler lowering 이후 실제 SASS에서 FADD, FFMA, MOV, register setup, immediate handling 등으로 변형될 수 있습니다. 따라서 source-level operation count만으로 실행 shape를 판단하면 안 됩니다.",
      },
      {
        label: "Progress signature",
        text:
          "고정 cycle budget 안에서 각 warp가 얼마나 반복을 진행했는지를 progress로 기록하면, workload의 dependency structure와 instruction stream shape가 warp-level signature로 드러날 수 있습니다.",
      },
      {
        label: "Compiler transformation risk",
        text:
          "chain 길이나 source expression을 바꿨을 때 compiler가 instruction scheduling, register allocation, source setup 방식을 바꿀 수 있습니다. 이 경우 progress 변화는 하드웨어 latency만이 아니라 compiler-generated shape 변화까지 포함합니다.",
      },
    ],
  },

  notTryingToProve: [
    "FADD와 FFMA의 절대 latency를 측정했다는 주장",
    "ADD가 FMA보다 항상 빠르거나 느리다는 일반화",
    "progress ratio가 instruction latency ratio와 동일하다는 주장",
    "모든 GPU architecture에서 동일한 ADD/FMA ordering이 성립한다는 주장",
    "compiler가 모든 chain length에서 동일한 SASS shape를 보존한다는 주장",
  ],

  config: {
    blocks: 1,
    warpsPerBlock: 8,
    threadsPerBlock: 256,
    cycleBudget: 100_000,
    comparedOps: ["FADD", "FFMA"],
    chainLengths: [8, 16],
    measurementTarget: "per-warp progress",
    evidenceTarget: "generated SASS instruction stream",
  },

  scenarioMap: {
    0: "add_chain_8",
    1: "add_chain_16",
    2: "fma_chain_8",
    3: "fma_chain_16",
  },

  roleMap: {
    0: "dependent_add_chain",
    1: "dependent_fma_chain",
  },

  instructionShapeStats: [
    {
      scenarioId: 0,
      scenarioName: "add_chain_8",
      op: "FADD",
      chainLength: 8,
      expectedShape: "dependent FADD chain",
      sassEvidence:
        "FADD 중심의 dependent arithmetic chain 여부를 SASS에서 확인해야 함",
      interpretation:
        "chain 8 조건은 chain 16과 비교하기 위한 짧은 dependency baseline입니다.",
    },
    {
      scenarioId: 1,
      scenarioName: "add_chain_16",
      op: "FADD",
      chainLength: 16,
      expectedShape: "longer dependent FADD chain",
      sassEvidence:
        "chain 길이 증가가 SASS에서도 실제 dependent FADD 수 증가로 보존되는지 확인해야 함",
      interpretation:
        "progress 감소가 관찰되더라도 이를 단순 2배 latency 증가로 해석하면 안 됩니다.",
    },
    {
      scenarioId: 2,
      scenarioName: "fma_chain_8",
      op: "FFMA",
      chainLength: 8,
      expectedShape: "dependent FFMA chain",
      sassEvidence:
        "FFMA instruction과 source setup instruction이 어떤 비율로 등장하는지 확인해야 함",
      interpretation:
        "FMA는 arithmetic intensity가 높아 보이지만, 실제 비교는 SASS instruction stream 기준으로 해야 합니다.",
    },
    {
      scenarioId: 3,
      scenarioName: "fma_chain_16",
      op: "FFMA",
      chainLength: 16,
      expectedShape: "longer dependent FFMA chain",
      sassEvidence:
        "chain length 증가 시 FFMA sequence가 안정적으로 유지되는지 확인해야 함",
      interpretation:
        "chain 길이 증가로 progress가 감소하더라도 compiler reshaping 여부를 먼저 분리해야 합니다.",
    },
  ],

  observedPatterns: [
    {
      label: "chain length 증가",
      observation:
        "chain 길이를 8에서 16으로 늘리면 progress가 감소합니다.",
      interpretation:
        "이는 dependency chain이 길어지면서 warp가 더 긴 dependent instruction stream을 통과해야 하기 때문입니다. 하지만 감소폭이 정확히 2배로 나타나지 않는다면, latency hiding, issue behavior, instruction setup, compiler lowering이 함께 작용한다고 봐야 합니다.",
    },
    {
      label: "ADD/FMA 비교",
      observation:
        "ADD와 FMA는 source-level에서는 단순 arithmetic 차이처럼 보이지만 SASS에서는 instruction stream shape가 달라질 수 있습니다.",
      interpretation:
        "따라서 ADD/FMA 비교는 operation type 비교라기보다 generated SASS shape 비교입니다.",
    },
    {
      label: "MOV/source setup",
      observation:
        "SASS에 MOV 또는 source setup instruction이 끼어들 수 있습니다.",
      interpretation:
        "이 instruction이 dependency를 완화했다고 바로 해석하면 안 됩니다. 기본적으로는 instruction stream에 추가 비용이 생긴 것으로 먼저 봐야 합니다.",
    },
    {
      label: "compiler preservation",
      observation:
        "source-level chain이 실제 SASS에서 동일한 dependency chain으로 보존된다는 보장은 없습니다.",
      interpretation:
        "codegen heuristic으로 쓰려면 source pattern이 안정적인 SASS shape를 생성하는지 먼저 검증해야 합니다.",
    },
  ],

  records: [
    {
      block: 0,
      warpId: 0,
      role: "add_chain_8",
      progress: null,
      lastClock: null,
      sink: null,
      signature:
        "짧은 dependent FADD chain에서 형성되는 arithmetic progress signature",
    },
    {
      block: 0,
      warpId: 1,
      role: "add_chain_16",
      progress: null,
      lastClock: null,
      sink: null,
      signature:
        "긴 dependent FADD chain에서 progress가 감소하는 chain-length sensitivity signature",
    },
    {
      block: 0,
      warpId: 2,
      role: "fma_chain_8",
      progress: null,
      lastClock: null,
      sink: null,
      signature:
        "짧은 dependent FFMA chain에서 형성되는 arithmetic progress signature",
    },
    {
      block: 0,
      warpId: 3,
      role: "fma_chain_16",
      progress: null,
      lastClock: null,
      sink: null,
      signature:
        "긴 dependent FFMA chain에서 compiler-generated SASS shape와 함께 관찰되는 progress signature",
    },
  ],

  interpretation: [
    "ADD/FMA progress 차이는 source-level operation type만으로 해석하면 안 됩니다.",
    "실제 비교 기준은 compiler가 생성한 SASS instruction stream입니다.",
    "chain 길이를 8에서 16으로 늘렸을 때 progress가 감소하는 것은 자연스럽지만, 감소폭이 정확히 chain 길이에 비례하지 않는다면 추가 요인을 분리해야 합니다.",
    "MOV/source setup instruction이 끼었다고 해서 dependency가 완화되었다고 바로 결론내리면 안 됩니다.",
    "SASS shape가 안정적으로 보존되지 않으면 ADD/FMA progress 비교는 operation 비교가 아니라 compiler 변형 비교가 됩니다.",
    "codegen 관점에서는 arithmetic source pattern이 어떤 SASS shape로 lowering되는지 검증하는 단계가 필요합니다.",
  ],

  caveats: [
    "현재 노드는 ADD/FMA의 절대 latency benchmark가 아닙니다.",
    "progress는 cycle budget 안에서의 synthetic workload 진행량이므로 실제 application throughput과 동일하지 않습니다.",
    "chain length 변화는 instruction count, dependency depth, register allocation, compiler scheduling을 동시에 바꿀 수 있습니다.",
    "SASS shape가 고정되지 않은 상태에서 progress ratio를 operation cost ratio로 사용하면 위험합니다.",
    "GPU architecture, compiler version, optimization flag에 따라 SASS shape가 달라질 수 있습니다.",
  ],

  codegenImpact: {
    targetPattern:
      "dependent_arithmetic_chain / add_fma_kernel / arithmetic_codegen_pattern",

    affectedDecision:
      "instruction_shape_validation / arithmetic_cost_model / source_pattern_selection / sass_stability_gate",

    costSignal:
      "ADD/FMA arithmetic chain의 progress 차이는 source-level op count가 아니라 generated SASS instruction shape를 기준으로 해석해야 합니다. chain length 증가가 progress를 낮추더라도, 그 원인은 dependency latency뿐 아니라 compiler lowering, MOV/source setup, instruction scheduling, register allocation이 함께 섞인 결과일 수 있습니다.",

    ruleCandidate:
      "arithmetic codegen variant를 비교할 때 source-level ADD/FMA 개수만 세지 말고, 먼저 SASS shape가 의도한 dependent chain을 보존하는지 확인합니다. SASS shape가 보존된 variant끼리만 progress를 비교하고, MOV/source setup 또는 instruction reshaping이 달라진 variant는 별도 class로 분리합니다.",

    confidence: {
      observation: "medium-high",
      interpretation: "medium",
      codegen: "medium-high",
    },

    reminder:
      "ADD/FMA 비교는 source operation 비교가 아니라 SASS instruction shape 비교입니다. codegen heuristic으로 쓰려면 SASS shape stability를 먼저 gate로 걸어야 합니다.",
  },

  costModelRole: {
    role: "instruction_shape_attribution",

    description:
      "이 probe는 workload progress signature의 원인을 arithmetic instruction stream 수준으로 내리는 attribution node입니다. source-level ADD/FMA pattern이 실제 SASS에서 어떻게 보존되거나 변형되는지 확인함으로써, arithmetic cost model이 source op count에만 의존하지 않도록 만드는 근거를 제공합니다.",

    usedBy: [
      "sass_shape_stability_probe",
      "arithmetic_codegen_decision_rule",
      "kernel_variant_validation",
      "instruction_stream_cost_model",
    ],
  },

  measurementReliability: {
    status: "sass_required",

    issue:
      "ADD/FMA chain source code가 실제 SASS에서 동일한 dependency chain으로 lowering된다는 보장이 없습니다.",

    impact:
      "progress 차이는 operation latency뿐 아니라 compiler-generated instruction shape 차이를 포함할 수 있습니다.",

    mitigation:
      "각 chain length와 operation variant마다 SASS를 확인하고, FADD/FFMA sequence, MOV/source setup, register dependency, instruction count를 함께 기록합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "ADD/FMA source pattern을 그대로 operation cost로 환산하지 않습니다.",
      "SASS에서 FADD/FFMA chain이 실제로 보존되는지 확인합니다.",
      "chain length 증가의 progress 감소를 단순 latency ratio로 해석하지 않습니다.",
      "MOV/source setup은 먼저 추가 instruction cost로 간주합니다.",
      "SASS shape가 다른 variant는 같은 arithmetic class로 비교하지 않습니다.",
    ],
  },

  comparisonPurpose: {
    title: "후속 probe와 비교하는 방식",
    summary:
      "이 probe는 ADD/FMA arithmetic chain에서 progress 차이를 관찰하되, 그 원인을 SASS instruction shape와 compiler lowering 관점에서 해석합니다. 후속 probe에서는 chain length, source expression, compiler option, register pressure 변화에 따라 SASS shape가 얼마나 안정적으로 유지되는지 검증해야 합니다.",
    examples: [
      "sass_shape_stability_probe에서는 chain length 8/16/32에서 FADD/FFMA sequence가 유지되는지 확인합니다.",
      "arithmetic_codegen_decision_rule에서는 SASS shape가 stable한 variant만 cost model에 반영합니다.",
      "mixed_workload_probe와 비교하면 broad workload role signature에서 arithmetic 내부 instruction signature로 해석 단위를 낮출 수 있습니다.",
      "latency_hiding 계열 probe와 비교하면 dependent arithmetic chain의 stall이 ready warp supply로 얼마나 숨겨지는지 분리할 수 있습니다.",
    ],
  },

  nextStep: {
    label: "SASS Shape Stability Probe",
    desc:
      "ADD/FMA progress 차이를 codegen heuristic으로 쓰기 전에, source-level chain pattern이 compiler lowering 이후에도 안정적인 SASS shape로 유지되는지 검증합니다.",
    configText:
      "vary chain_length = 8, 16, 32\nvary op = FADD, FFMA\ninspect SASS sequence\ntrack MOV/source setup and dependency preservation",
    metrics: [
      "FADD/FFMA instruction count",
      "MOV/source setup instruction count",
      "dependent register chain preservation",
      "chain length별 progress ratio",
      "SASS shape stability score",
    ],
  },

  previousObservationId: "warp_signature_permutation",
  nextObservationId: "sass_shape_stability_probe",
};