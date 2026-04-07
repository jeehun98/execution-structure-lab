import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { hardwareChips } from "../data/hardware/chips";
import { hardwareOverview } from "../data/hardware/overview";
import { hardwareEvidenceSections } from "../data/hardware/sections";
import { hardwareExperiments } from "../data/hardware/experiments";

function formatKeyLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
}

function DetailList({ title, items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm text-neutral-300">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-6"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KernelShapeTable({ kernelShape }) {
  if (!kernelShape) return null;

  const entries = Object.entries(kernelShape).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
  );

  if (!entries.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h4 className="text-lg font-semibold text-white">Kernel structure</h4>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/10">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 px-4 py-4 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                {formatKeyLabel(key)}
              </div>
              <div className="text-sm leading-6 text-neutral-300">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExperimentNavCard({ experiment, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left transition ${
        active
          ? "border-lime-400/50 bg-lime-400/10"
          : "border-white/10 bg-black/20 hover:border-lime-400/30 hover:bg-white/[0.06]"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {experiment.category}
      </div>
      <div className="mt-2 text-base font-semibold text-white">
        {experiment.label}
      </div>
      <div className="mt-2 text-sm leading-6 text-neutral-400">
        {experiment.summary}
      </div>
    </button>
  );
}

function NextLinks({ links = [] }) {
  if (!links?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h4 className="text-lg font-semibold text-white">다음 연결 경로</h4>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HardwareEvidencePage() {
  const [selectedId, setSelectedId] = useState(hardwareExperiments[0]?.id ?? null);

  const selectedExperiment = useMemo(() => {
    return (
      hardwareExperiments.find((experiment) => experiment.id === selectedId) ??
      hardwareExperiments[0] ??
      null
    );
  }, [selectedId]);

  if (!selectedExperiment) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-neutral-300">
        No hardware experiments found.
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          {hardwareOverview.eyebrow}
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          {hardwareOverview.title}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          {hardwareOverview.description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-300">
          {hardwareChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {hardwareEvidenceSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              {section.desc}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">왜 이 층이 필요한가</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
            {hardwareOverview.whyItMatters}
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Experiment Explorer</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-neutral-400">
            실험을 선택하면, 목적과 질문뿐 아니라 probe 설계 방식, 핵심 커널 구조,
            관찰된 결과 요약, 그리고 realization 판단으로 이어지는 해석까지 함께
            볼 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-lime-400/80">
                Experiments
              </div>

              <div className="space-y-3">
                {hardwareExperiments.map((experiment) => (
                  <ExperimentNavCard
                    key={experiment.id}
                    experiment={experiment}
                    active={experiment.id === selectedId}
                    onClick={() => setSelectedId(experiment.id)}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
                {selectedExperiment.category}
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {selectedExperiment.label}
              </h3>
              <p className="mt-4 text-sm leading-7 text-neutral-400">
                {selectedExperiment.summary}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  이 실험이 묻는 질문
                </h4>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {selectedExperiment.question}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  왜 중요한가
                </h4>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {selectedExperiment.whyItMatters}
                </p>
              </div>
            </div>

            <DetailList
              title="How the probe is built"
              items={selectedExperiment.method}
            />

            <KernelShapeTable kernelShape={selectedExperiment.kernelShape} />

            {selectedExperiment.codeSnippet ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  Key kernel excerpt
                </h4>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  전체 구현을 모두 펼치기보다, 이 probe의 핵심이 드러나는 코드 조각만
                  보여줍니다.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-neutral-200">
                  <code>{selectedExperiment.codeSnippet}</code>
                </pre>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="관찰 포인트"
                items={selectedExperiment.observe}
              />
              <DetailList
                title="예상 출력 / 정리 형태"
                items={selectedExperiment.outputs}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="Observed results"
                items={selectedExperiment.resultHighlights}
              />
              <DetailList
                title="Interpretation"
                items={selectedExperiment.interpretation}
              />
            </div>

            <DetailList title="Caveats" items={selectedExperiment.caveats} />

            <NextLinks links={selectedExperiment.nextLinks} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">
            Why this layer matters
          </h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            {hardwareOverview.whyItMatters}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Next paths</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              to="/properties-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              변환 성질 보기
            </Link>
            <Link
              to="/operators-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              연산자 실현 구조 보기
            </Link>
            <Link
              to="/analysis-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              실현 비교 실험 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}