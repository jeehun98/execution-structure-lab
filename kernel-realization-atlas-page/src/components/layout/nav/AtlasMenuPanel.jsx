import { Link } from "react-router-dom";

const quickFlow = [
  "실행",
  "최적화",
  "보존",
  "하드웨어 관찰",
  "계산 구조",
  "구현과 실험",
  "생성",
];

export default function AtlasMenuPanel({ panel }) {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-4">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          시작점
        </p>

        <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
          {panel.title}
        </h2>

        <p className="mt-4 max-w-md text-sm leading-7 text-neutral-400">
          이 아틀라스는 AI 연산의 실행에서 출발해, 최적화 규칙과 보존 조건,
          하드웨어 관찰, 공통 계산 구조, 구현 비교 실험, 생성 관점까지 하나의
          흐름으로 연결합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {quickFlow.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="col-span-5 grid grid-cols-1 gap-8 md:grid-cols-2">
        {panel.sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-200">
              {section.title}
            </h3>

            <div className="space-y-3">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block rounded-xl border border-transparent p-3 transition hover:border-white/10 hover:bg-white/5"
                >
                  <div className="text-sm font-medium text-white">
                    {link.label}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-neutral-400">
                    {link.desc}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="col-span-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-lime-400">
            추천 순서
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-300">
            <div>1. 하드웨어 관찰</div>
            <div>2. 최적화 규칙</div>
            <div>3. 보존 조건</div>
            <div>4. 공통 계산 구조</div>
            <div>5. 연산자 구현</div>
            <div>6. 실험 분석</div>
            <div>7. 메모리 관점</div>
          </div>

          <Link
            to={panel.featured.href}
            className="mt-5 inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-300 transition hover:bg-lime-400/15"
          >
            {panel.featured.title} 보기
          </Link>
        </div>
      </div>
    </div>
  );
}