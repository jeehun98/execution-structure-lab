import { Link } from "react-router-dom";

const operatorGroups = [
  {
    title: "Dense Compute Operators",
    desc: "GEMM처럼 높은 연산 밀도를 가지며 tiling, residency, epilogue fusion과 강하게 연결되는 연산자 계열입니다.",
  },
  {
    title: "Reduction-Centric Operators",
    desc: "sum, mean, norm처럼 reduction 구조가 핵심이 되는 연산자 계열입니다. 순서, accumulation, numerical stability가 realization의 핵심 변수입니다.",
  },
  {
    title: "Normalization Operators",
    desc: "LayerNorm, RMSNorm처럼 통계 계산과 rescaling이 결합된 연산자 계열입니다. streaming, rematerialization, fusion 가능성과 자주 연결됩니다.",
  },
  {
    title: "Attention-Like Operators",
    desc: "softmax, weighted reduction, blockwise update처럼 중간 결과를 전부 물질화하지 않고 realization을 바꾸는 여지가 큰 연산자 계열입니다.",
  },
  {
    title: "Elementwise / Epilogue Operators",
    desc: "bias add, activation, simple transform처럼 다른 연산 뒤에 붙어 fusion 경로를 형성하기 쉬운 연산자 계열입니다.",
  },
  {
    title: "Composite Operator Paths",
    desc: "단일 operator보다 여러 연산이 묶여 하나의 realization path를 이루는 경우를 다룹니다. fusion과 staged execution의 출발점이 됩니다.",
  },
];

const interpretationCards = [
  {
    title: "의미에서 출발",
    desc: "operator는 단순한 API 이름이 아니라 계산 의미를 가진 단위입니다. 같은 의미를 유지하면서도 realization은 달라질 수 있습니다.",
  },
  {
    title: "속성과 불변성으로 해석",
    desc: "각 operator는 property를 통해 변환 가능성을 얻고, invariant를 통해 허용 범위를 제한받습니다.",
  },
  {
    title: "실행 경로로 연결",
    desc: "최종적으로 operator는 하나의 고정 구현이 아니라, hardware evidence와 synthesis 조건에 따라 여러 realization path를 가질 수 있습니다.",
  },
];

const nextLinks = [
  {
    title: "하드웨어 증거 보기",
    href: "/hardware-evidence",
  },
  {
    title: "최적화 의미 체계",
    href: "/properties-new",
  },
  {
    title: "불변성 보기",
    href: "/invariants",
  },
  {
    title: "실현 실험실",
    href: "/analysis-new",
  },
];

export default function OperatorsNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Operator Realizations
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          각 연산자가 가질 수 있는 realization space를 정리하는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 operator를 고정된 구현 단위가 아니라, 여러 실행 경로와
          realization variant를 가질 수 있는 구조로 다룹니다. Atlas에서
          operator는 의미, 속성, 불변성, 하드웨어 제약이 만나는 결절점입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">연산자 계열</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Operators는 계산 구조와 realization 성격에 따라 여러 계열로 나눠
            볼 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {operatorGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{group.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {group.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            operator 페이지는 단순한 연산자 목록이 아닙니다. 각 연산자가 어떤
            property를 가지는지, 어떤 invariant를 중심으로 이해되어야 하는지,
            그리고 실제로 어떤 realization path로 이어질 수 있는지를 연결하는
            해석 층입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {interpretationCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            연산자 realization은 하드웨어 증거, 속성 정의, 불변성, 실험 분석과
            연결되어 해석됩니다.
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