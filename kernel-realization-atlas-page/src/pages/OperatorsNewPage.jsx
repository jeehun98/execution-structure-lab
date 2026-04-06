import { Link } from "react-router-dom";

const interpretationAxes = [
  {
    id: "structure-composition",
    title: "Structure Composition",
    desc: "각 operator를 하나의 이름으로 고정해 보지 않고, 어떤 computation structure들이 함께 결합되어 있는지로 읽습니다. 하나의 연산자 안에서도 reduction, streaming accumulation, weighted aggregation, local accumulation 같은 구조들이 겹쳐 나타날 수 있습니다.",
  },
  {
    id: "property-profile",
    title: "Property Profile",
    desc: "operator는 구조 조합에 따라 서로 다른 변환 가능성을 가집니다. reordering, decomposition, streaming, fusion, rematerialization, residency 같은 property는 여기서 operator의 realization space를 여는 프로파일로 읽힙니다.",
  },
  {
    id: "invariant-boundaries",
    title: "Invariant Boundaries",
    desc: "가능한 변환이 많다고 해서 모두 허용되는 것은 아닙니다. 각 operator는 구조 조합에 따라 서로 다른 의미 경계, dependency 경계, numerical 경계를 가지며, 이 조건들이 realization의 허용 범위를 규정합니다.",
  },
  {
    id: "realization-branches",
    title: "Realization Branches",
    desc: "같은 operator라도 하나의 구현으로 고정되지 않습니다. structure, property, invariant, hardware evidence가 결합되며 여러 realization path로 갈라지고, 실제 구현은 그 분기 위에서 선택됩니다.",
  },
];

const operatorFamilies = [
  {
    id: "dense-compute-chains",
    title: "Dense Compute Chains",
    desc: "GEMM 계열처럼 높은 연산 밀도와 tile-compatible local accumulation이 중심이 되는 family입니다. tiling, residency, epilogue fusion이 realization choice를 크게 바꾸며, operator는 단일 kernel보다 fused chain이나 staged path로 나타나는 경우가 많습니다.",
  },
  {
    id: "reduction-statistics-families",
    title: "Reduction / Statistics Families",
    desc: "sum, mean, norm, statistics accumulation처럼 reduction과 summary formation이 중심이 되는 family입니다. 어떤 축으로 줄이는지, partial summary를 어떻게 만들고 합치는지, accumulation order를 어떻게 다루는지가 realization의 핵심 변수가 됩니다.",
  },
  {
    id: "normalization-families",
    title: "Normalization Families",
    desc: "LayerNorm, RMSNorm처럼 통계 계산, rescaling, elementwise transform이 결합된 family입니다. reduction structure와 normalization boundary가 함께 작동하며, streaming, rematerialization, fusion 가능성이 자주 함께 나타납니다.",
  },
  {
    id: "attention-weighted-aggregation-families",
    title: "Attention / Weighted Aggregation Families",
    desc: "softmax, attention, blockwise weighted update처럼 weighted aggregation과 streaming accumulation이 결합된 family입니다. intermediate를 전부 materialize하지 않고도 realization을 바꿀 수 있는 여지가 크며, online update와 blockwise execution이 중요한 해석 단위가 됩니다.",
  },
  {
    id: "elementwise-epilogue-families",
    title: "Elementwise / Epilogue Families",
    desc: "bias add, activation, affine transform처럼 다른 구조 뒤에 붙으며 더 긴 realization chain의 일부가 되기 쉬운 family입니다. 단독 의미보다 producer-consumer 연결 안에서의 fusion context가 더 중요한 경우가 많습니다.",
  },
  {
    id: "composite-realization-paths",
    title: "Composite Realization Paths",
    desc: "실제 구현은 단일 operator로 끝나지 않고 여러 구조가 연속적으로 이어진 경로로 형성되는 경우가 많습니다. 이 층에서는 operator를 독립 항목으로만 보지 않고, 하나의 fused path나 staged pipeline 안에서 다시 읽습니다.",
  },
];

const exampleMappings = [
  {
    id: "layernorm-mapping",
    title: "LayerNorm",
    desc: "reduction, normalization, elementwise transform이 결합된 사례입니다. streaming, rematerialization, fusion 가능성이 함께 나타나며, statistic consistency와 numerical stability boundary가 realization 선택을 제한합니다.",
  },
  {
    id: "softmax-attention-mapping",
    title: "Softmax / Attention",
    desc: "reduction, rescaling, weighted aggregation, streaming accumulation이 함께 작동하는 사례입니다. online update와 blockwise execution이 가능성을 열어 주지만, normalization consistency와 partial-state correctness가 반드시 유지되어야 합니다.",
  },
  {
    id: "gemm-epilogue-mapping",
    title: "GEMM + Epilogue",
    desc: "dense local accumulation 위에 epilogue transform이 결합되는 사례입니다. residency, tiling, fusion property가 강하게 작동하며, tile boundary correctness와 accumulation consistency가 realization branch를 제한합니다.",
  },
];

const nextLinks = [
  {
    title: "하드웨어 관찰",
    href: "/hardware-evidence",
  },
  {
    title: "변환 규칙",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    href: "/invariants",
  },
  {
    title: "실험 분석",
    href: "/analysis-new",
  },
];

export default function OperatorsNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Operators
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          연산자를 구조 조합과
          <br className="hidden lg:block" />
          realization path의 결절점으로 읽는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 operator를 고정된 API 이름이나 단일 구현 단위로 보지
          않습니다. 대신 각 operator가 어떤 computation structure들의
          조합으로 이루어지는지, 어떤 property profile을 가지는지, 어떤
          invariant boundary에 의해 제한되는지, 그리고 실제로 어떤 realization
          path들로 갈라지는지를 함께 읽습니다. Atlas에서 operator는 앞선 층들을
          다시 하나의 구체적 사례로 묶어 주는 결절점입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">해석의 축</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            operator는 단순한 이름 목록이 아니라, 구조, 성질, 보존 조건,
            realization branch가 만나는 지점으로 읽어야 합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {interpretationAxes.map((axis) => (
            <div
              key={axis.title}
              id={axis.id}
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{axis.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {axis.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            대표적인 operator families
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            실제 operator들은 서로 다른 computation structure 조합과 realization
            성격에 따라 여러 family로 읽을 수 있습니다. 중요한 것은 이름 자체가
            아니라, 어떤 구조가 중심을 이루고 어떤 path로 이어지는가입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {operatorFamilies.map((family) => (
            <div
              key={family.title}
              id={family.id}
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">
                {family.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {family.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">사례로 보는 매핑</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            이 층에서는 실제 operator를 구조적 조합의 사례로 다시 읽습니다.
            operator는 앞선 pages에서 정의한 structure, property, invariant가
            현실적인 realization 선택으로 묶이는 구체적 장면입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {exampleMappings.map((item) => (
            <div
              key={item.title}
              id={item.id}
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            computation structure가 계산의 골격을 설명하고, property가 변환
            가능성을 열고, invariant가 허용 범위를 제한한다면, operator 페이지는
            그 세 층이 실제 연산자와 realization branch 안에서 어떻게 함께
            묶이는지를 보여 줍니다. 따라서 이 페이지는 연산자 목록이 아니라,
            구조 해석이 concrete implementation space로 넘어가는 연결층입니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            연산자 해석은 하드웨어 관찰, 변환 규칙, 보존 조건, 실험 분석과 함께
            읽을 때 가장 선명해집니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {nextLinks.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-medium text-neutral-300 transition hover:border-lime-400/40 hover:bg-white/10 hover:text-white"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}