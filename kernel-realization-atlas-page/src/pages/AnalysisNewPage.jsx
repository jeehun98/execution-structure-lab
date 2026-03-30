import { Link } from "react-router-dom";

const analysisGroups = [
  {
    title: "Variant Comparison",
    desc: "같은 operator 또는 같은 목적을 가지는 여러 realization variant를 비교합니다. 구현 차이, 실행 경로, 성능 차이를 함께 읽습니다.",
  },
  {
    title: "Metric Interpretation",
    desc: "latency, throughput, occupancy, memory traffic 같은 측정값을 단순 수치가 아니라 realization 특성의 결과로 해석합니다.",
  },
  {
    title: "Configuration Context",
    desc: "tile size, stage 수, block 구성, memory layout 같은 설정이 어떤 실행 차이를 만드는지 함께 봅니다.",
  },
  {
    title: "Execution Signature",
    desc: "trace, profile, measured behavior를 통해 realization이 실제로 어떤 방식으로 실행되었는지 확인합니다.",
  },
  {
    title: "Fusion Case Studies",
    desc: "단일 operator를 넘어서 fusion path가 어떻게 형성되고, intermediate 제거와 locality 확보가 어떻게 이루어지는지 봅니다.",
  },
  {
    title: "Validation and Limits",
    desc: "빠른 실행만이 아니라 correctness, numerical stability, boundary condition까지 포함해 realization의 유효 범위를 확인합니다.",
  },
];

const roleCards = [
  {
    title: "이론을 실험으로 내리는 층",
    desc: "앞선 페이지들이 가능성과 규칙을 설명했다면, Analysis는 그것이 실제 구현에서 어떻게 나타나는지를 보여줍니다.",
  },
  {
    title: "측정값의 해석 층",
    desc: "좋은 수치가 나왔다는 사실보다 왜 그런 결과가 나왔는지, 어떤 property와 hardware condition이 작동했는지가 더 중요합니다.",
  },
  {
    title: "다음 realization 선택의 근거",
    desc: "Analysis는 단순한 결과 보관소가 아니라, 다음 operator realization과 synthesis 방향을 선택하는 근거가 됩니다.",
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
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
];

export default function AnalysisNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Realization Labs
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          realization variant를 비교하고 해석하는 실험 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 각 realization이 실제로 어떻게 실행되었는지 비교하고
          해석합니다. Atlas에서 Analysis는 단순 결과 나열이 아니라, 측정값과
          실행 signature를 통해 realization path를 읽어내는 층입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 분석 축</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Analysis는 variant, metric, config, signature, fusion case,
            validation의 관점에서 읽을 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {analysisGroups.map((group) => (
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
            Analysis는 Atlas의 끝점이면서 동시에 다시 시작점이기도 합니다.
            여기서 얻은 해석은 어떤 realization이 유효했는지, 어떤 조건에서
            실패했는지, 다음 변환과 synthesis를 어떻게 선택해야 하는지에 대한
            근거가 됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roleCards.map((card) => (
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
            실험 분석은 하드웨어 증거, 속성 정의, 불변성, 연산자 realization과
            다시 연결되어 읽혀야 합니다.
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