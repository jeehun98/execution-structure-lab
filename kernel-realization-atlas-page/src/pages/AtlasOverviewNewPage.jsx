import { Link } from "react-router-dom";

const layers = [
  {
    title: "Hardware Evidence",
    desc: "GPU가 실제로 어떻게 반응하는지 측정하고 정리하는 층입니다. memory access, scheduling, primitive realization 같은 하드웨어 증거가 여기에 놓입니다.",
  },
  {
    title: "Optimization Semantics",
    desc: "연산이 어떤 변환 가능성을 가지는지, 그리고 그 가능성이 어떤 의미적 조건 아래에서 성립하는지를 설명하는 층입니다.",
  },
  {
    title: "Invariants",
    desc: "가능한 변환이 실제로 어디까지 허용되는지, 무엇이 반드시 유지되어야 하는지를 규정하는 층입니다.",
  },
  {
    title: "Operator Realizations",
    desc: "각 operator를 고정된 구현이 아니라 여러 realization path를 가질 수 있는 구조로 보는 층입니다.",
  },
  {
    title: "Realization Labs",
    desc: "variant 비교, metric 해석, fusion 사례를 통해 실제 realization을 검증하고 읽어내는 실험 층입니다.",
  },
];

const principles = [
  {
    title: "측정에서 시작",
    desc: "이 Atlas는 추상 규칙만으로 시작하지 않습니다. 실제 GPU의 측정된 반응을 중요한 근거로 둡니다.",
  },
  {
    title: "의미와 실행의 연결",
    desc: "연산의 의미, 불변성, 실행 경로를 따로 보지 않고 하나의 연속 구조로 다룹니다.",
  },
  {
    title: "고정 구현이 아닌 realization space",
    desc: "operator는 하나의 코드 조각이 아니라, 여러 가능한 realization path를 가지는 대상으로 봅니다.",
  },
  {
    title: "분석은 선택 근거",
    desc: "analysis는 결과 정리가 아니라, 다음 realization과 synthesis 방향을 선택하는 근거가 됩니다.",
  },
];

const nextLinks = [
  {
    title: "하드웨어 증거",
    href: "/hardware-evidence",
  },
  {
    title: "최적화 의미 체계",
    href: "/properties-new",
  },
  {
    title: "불변성",
    href: "/invariants",
  },
  {
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
  {
    title: "실현 실험실",
    href: "/analysis-new",
  },
  {
    title: "메모리 렌즈",
    href: "/memory-new",
  },
];

export default function AtlasOverviewNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Atlas Overview
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          Kernel Realization Atlas를 어떻게 읽어야 하는가
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 Atlas는 단순한 operator 목록이나 profiling 결과 모음이 아닙니다.
          GPU의 실제 하드웨어 반응에서 출발해, 연산의 변환 가능성과 불변성을
          정리하고, 각 operator의 realization path와 실제 실험 해석까지 하나의
          구조로 연결하는 지도입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">왜 이런 구조인가</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            의미적으로 가능한 변환이 실제 하드웨어에서 항상 좋은 실행이 되는 것은
            아닙니다. 반대로 하드웨어에서 빠른 방식이 항상 의미적으로 안전한 것도
            아닙니다. 그래서 Atlas는 하드웨어 증거, 의미 체계, 불변성, operator
            realization, 실험 분석을 분리하면서도 서로 연결된 층으로 다룹니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">구성 층위</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Atlas는 아래 순서로 읽는 것이 가장 자연스럽습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {layers.map((layer) => (
            <div
              key={layer.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {layer.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 관점</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 Atlas를 관통하는 해석 원칙들입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
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
          <h2 className="text-xl font-semibold text-white">탐색 시작</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            아래 카테고리에서 각 층위를 직접 탐색할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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