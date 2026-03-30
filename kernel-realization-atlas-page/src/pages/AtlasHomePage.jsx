import { Link } from "react-router-dom";

const primaryCards = [
  {
    title: "하드웨어 증거",
    desc: "GPU probing과 측정 데이터를 통해 실제 하드웨어 거동과 실행 특성을 확인합니다.",
    href: "/hardware-evidence",
  },
  {
    title: "최적화 의미 체계",
    desc: "연산적 특성, 변환 가능성, 의미 보존의 출발점을 정리합니다.",
    href: "/properties-new",
  },
  {
    title: "불변성",
    desc: "어떤 변환이 허용되고 어디까지 유지되어야 하는지를 설명합니다.",
    href: "/invariants",
  },
  {
    title: "연산자 실현 구조",
    desc: "각 operator가 어떤 realization space와 실행 경로를 가지는지 정리합니다.",
    href: "/operators-new",
  },
  {
    title: "실현 실험실",
    desc: "variant 비교, metric 해석, signature 분석을 통해 실제 구현을 검증합니다.",
    href: "/analysis-new",
  },
  {
    title: "메모리 렌즈",
    desc: "Atlas 전체를 가로지르는 memory-centric 관점에서 구조를 다시 읽습니다.",
    href: "/memory-new",
  },
];

const chips = [
  "Hardware Evidence",
  "Optimization Semantics",
  "Invariants",
  "Operator Realizations",
  "Realization Labs",
  "Memory Lens",
];

export default function AtlasHomePage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Kernel Realization Atlas
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          측정된 하드웨어 거동에서 연산자 realization과 실험 해석까지
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 Atlas는 GPU의 실제 실행 특성에서 출발해, 연산의 변환 가능성과
          불변성을 정리하고, 각 operator의 realization path와 실험 해석까지
          하나의 구조로 연결합니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-300">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 카테고리</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Atlas는 하드웨어 증거, 의미 체계, 불변성, 연산자 realization, 실험
            분석, 메모리 렌즈의 여섯 관점으로 탐색할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {primaryCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-lime-400/40 hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">{card.title}</div>
              <div className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">구조 읽기</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            이 Atlas를 처음 읽는다면 먼저 Overview에서 전체 구조를 보고,
            Hardware Evidence와 Optimization Semantics를 거쳐 Operators와
            Analysis로 내려가는 흐름이 가장 자연스럽습니다.
          </p>
        </div>

        <Link
          to="/atlas-overview-new"
          className="inline-flex rounded-2xl border border-lime-400/30 bg-lime-400/10 px-5 py-3 text-sm font-medium text-lime-300 transition hover:bg-lime-400/15"
        >
          Atlas 구조 개요 보기
        </Link>
      </section>
    </div>
  );
}