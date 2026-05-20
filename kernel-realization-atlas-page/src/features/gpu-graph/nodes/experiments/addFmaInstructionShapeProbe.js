const addFmaInstructionShapeProbe = {
  id: "add_fma_instruction_shape_probe",
  label: "ADD/FMA Instruction Shape Probe",
  title: "ADD/FMA chain SASS shape probe",
  description:
    "ADD와 FMA arithmetic chain을 dependency length와 generated SASS instruction shape 관점에서 비교하는 probe입니다. 이 노드는 ADD/FMA의 단순 속도 비교가 아니라, source-level arithmetic pattern이 compiler lowering을 거쳐 어떤 instruction stream으로 실행되는지 확인하고, 그 shape가 warp progress signature에 어떤 영향을 주는지 해석합니다.",

  status: "observed",
  kind: "experiment",

  layer: "signature-attribution",
  order: 6,

  detailPath: "/hardware-evidence/add_fma_instruction_shape_probe",

  graphSummary: {
    intro:
      "validated workload signature를 instruction stream 수준으로 더 내려가 해석하는 probe입니다. ADD/FMA source pattern이 실제 SASS에서 어떤 shape로 lowering되고, 그 shape가 warp progress에 어떤 signature를 남기는지 확인합니다.",

    buildUp: [
      {
        id: "same_workload_baseline",
        label: "Same Workload Baseline",
        summary:
          "동일 workload 조건에서 강한 warp_id progress 편향이 나타나는지 확인해 후속 signature 해석의 기준선을 만들었습니다.",
      },
      {
        id: "warp_execution_signature_v0",
        label: "Warp Signature v0",
        summary:
          "서로 다른 execution pattern이 동일한 cycle budget 안에서 구분 가능한 progress signature를 남긴다는 최초 observation을 만들었습니다.",
      },
      {
        id: "warp_signature_repeatability",
        label: "Warp Signature Repeatability",
        summary:
          "v0에서 관찰된 progress signature가 단일 run의 우연이 아니라 동일 조건 반복 실행에서도 유지되는지 검증했습니다.",
      },
      {
        id: "warp_signature_permutation",
        label: "Warp Signature Permutation",
        summary:
          "반복 가능한 signature가 특정 warp_id에 고정된 것이 아니라 workload pattern assignment를 따라 이동하는지 확인했습니다.",
      },
    ],

    roleInFlow:
      "이 노드는 workload-level signature 해석을 arithmetic instruction-shape attribution으로 확장합니다. 앞선 실험들이 signature가 workload structure에 붙어 있음을 보였다면, 이 실험은 그 workload structure 내부의 ADD/FMA SASS shape가 progress 차이에 어떻게 관여하는지 확인합니다.",

    keyTakeaway:
      "핵심은 ADD와 FMA 중 어느 연산이 더 빠르냐가 아닙니다. source-level arithmetic chain이 compiler lowering 이후 어떤 SASS instruction stream이 되었는지 확인하지 않으면, progress 차이를 operation latency나 throughput 차이로 해석할 수 없습니다.",

    nextQuestion:
      "ADD/FMA chain progress 차이가 관찰되었다면, 이제 chain length와 source expression 변화에도 SASS shape가 안정적으로 유지되는지 검증해야 합니다.",
  },

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "ADD/FMA chain의 progress 차이는 source-level operation type만으로 해석하면 안 됩니다. chain 길이를 8에서 16으로 늘리면 progress가 감소할 수 있지만, 그 감소폭이 순수 dependency latency나 operation count에 선형 비례한다고 볼 수는 없습니다. 실제 해석 기준은 generated SASS instruction shape입니다. FADD/FFMA sequence, MOV/source setup, register dependency preservation, compiler reshaping 여부를 함께 확인해야 합니다. codegen 관점에서는 SASS shape가 안정적으로 보존된 variant끼리만 arithmetic cost를 비교해야 합니다.",

    metrics: [
      {
        label: "compared operations",
        value: "FADD / FFMA",
        note: "ADD와 FMA arithmetic chain 비교",
      },
      {
        label: "chain lengths",
        value: "8 / 16",
        note: "dependency chain 길이 변화에 따른 progress sensitivity 확인",
      },
      {
        label: "primary evidence",
        value: "SASS instruction shape",
        note: "source code가 아니라 compiler-generated instruction stream 기준으로 해석",
      },
      {
        label: "main interpretation",
        value: "instruction-shape signature",
        note: "operation latency benchmark가 아니라 SASS shape attribution probe",
      },
      {
        label: "codegen gate",
        value: "SASS stability",
        note: "SASS shape가 안정적인 variant끼리만 cost 비교 가능",
      },
    ],

    interpretation:
      "이 결과는 arithmetic source pattern을 그대로 hardware operation cost로 환산할 수 없다는 점을 보여줍니다. ADD/FMA chain은 compiler lowering 과정에서 instruction stream이 달라질 수 있고, progress signature는 그 lowered shape의 영향을 받습니다.",

    caveat:
      "이 노드는 FADD와 FFMA의 절대 latency를 측정하는 benchmark가 아닙니다. 단일 synthetic workload와 고정 cycle budget에서 관찰한 warp-level progress signature이며, 반드시 SASS 확인과 함께 해석해야 합니다.",
  },

  codegenImpact: {
    targetPattern:
      "dependent_arithmetic_chain / add_fma_kernel / arithmetic_codegen_pattern",

    affectedDecision:
      "instruction_shape_validation / arithmetic_cost_model / source_pattern_selection / sass_stability_gate",

    costSignal:
      "ADD/FMA progress 차이는 source-level op count보다 generated SASS shape에 더 가깝게 붙어 있습니다. chain length 증가, MOV/source setup, register dependency preservation, compiler reshaping 여부를 함께 보지 않으면 arithmetic cost model에 잘못된 ratio가 들어갈 수 있습니다.",

    ruleCandidate:
      "arithmetic kernel variant를 비교할 때 source-level ADD/FMA 개수만 비교하지 않습니다. 먼저 SASS에서 FADD/FFMA dependent chain이 보존되는지 확인하고, instruction stream shape가 안정적인 variant끼리만 progress를 비교합니다. SASS shape가 달라진 variant는 별도의 cost class로 분리합니다.",

    confidence: {
      observation: "medium-high",
      interpretation: "medium",
      codegen: "medium-high",
    },

    reminder:
      "ADD/FMA 비교는 operation 비교가 아니라 SASS instruction-shape 비교입니다. codegen heuristic으로 쓰려면 SASS shape stability를 먼저 확인해야 합니다.",
  },

  costModelRole: {
    role: "instruction_shape_attribution",

    description:
      "이 probe는 workload signature를 instruction stream attribution으로 내리는 역할을 합니다. arithmetic workload의 progress 차이를 source op count가 아니라 generated SASS shape와 연결해 해석하게 만들며, 이후 arithmetic codegen rule의 validation gate로 사용됩니다.",

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
      "source-level ADD/FMA chain이 실제 SASS에서 동일한 dependent instruction chain으로 유지된다는 보장이 없습니다.",

    impact:
      "progress 차이는 operation latency뿐 아니라 compiler-generated SASS shape 차이를 포함할 수 있습니다.",

    mitigation:
      "각 scenario에서 SASS를 확인하고 FADD/FFMA sequence, MOV/source setup, register dependency, instruction count를 함께 기록합니다.",
  },

  codegenReminder: {
    title: "Codegen reminder",
    items: [
      "source-level ADD/FMA 개수만으로 arithmetic cost를 만들지 않습니다.",
      "SASS에서 FADD/FFMA dependent chain이 보존되는지 확인합니다.",
      "chain length 증가의 progress 감소를 단순 2배 비용 증가로 해석하지 않습니다.",
      "MOV/source setup instruction은 먼저 추가 instruction cost로 봅니다.",
      "SASS shape가 다른 variant는 같은 cost class로 묶지 않습니다.",
    ],
  },

  probingMeaning:
    "이 node는 validated warp progress signature를 instruction stream 수준으로 낮추는 attribution probe입니다. ADD/FMA arithmetic chain의 progress 차이를 관찰하되, 그것을 operation latency가 아니라 compiler-generated SASS shape와 연결합니다. codegen 관점에서는 source pattern이 안정적인 SASS shape를 생성하는지 확인한 뒤에만 arithmetic cost model에 반영해야 한다는 근거를 제공합니다.",

  relatedNodes: [
    {
      id: "warp_signature_permutation",
      reason:
        "signature가 workload pattern을 따라간다는 attribution 이후, workload 내부의 arithmetic instruction shape로 해석 단위를 낮춤",
    },
    {
      id: "warp_signature_repeatability",
      reason:
        "반복 가능한 progress signature를 기반으로 ADD/FMA chain sensitivity를 해석함",
    },
    {
      id: "warp_execution_signature_v0",
      reason:
        "execution pattern별 progress 차이를 instruction stream shape 차이로 더 세분화함",
    },
    {
      id: "same_workload_baseline",
      reason:
        "동일 workload baseline을 기준으로 arithmetic chain shape의 progress 차이를 해석함",
    },
    {
      id: "mixed_workload_probe",
      reason:
        "mixed workload가 broad role-level signature라면, ADD/FMA probe는 arithmetic role 내부의 instruction-level signature를 다룸",
    },
  ],

  connectsTo: [
    {
      id: "sass_shape_stability_probe",
      type: "validation-gate",
      label: "instruction shape → SASS stability",
    },
    {
      id: "arithmetic_codegen_decision_rule",
      type: "codegen-rule",
      label: "SASS evidence → arithmetic cost model",
    },
  ],
};

export default addFmaInstructionShapeProbe;