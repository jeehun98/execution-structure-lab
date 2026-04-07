import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { hardwareChips } from "../data/hardware/chips";
import { hardwareEvidenceSections } from "../data/hardware/sections";
import { hardwareExperiments } from "../data/hardware/experiments";

export default function HardwareEvidencePage() {
  const [selectedId, setSelectedId] = useState(hardwareExperiments[0].id);

  const selectedExperiment = useMemo(
    () =>
      hardwareExperiments.find((experiment) => experiment.id === selectedId) ??
      hardwareExperiments[0],
    [selectedId]
  );

  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Hardware Evidence
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          불투명한 GPU 거동을 역추적해
          <br className="hidden lg:block" />
          realization 선택 근거를 확보하는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 GPU가 실제로 어떻게 반응하는지를 측정 기반으로 다룹니다.
          단순한 성능 수치 정리가 아니라, probing kernel과 실험 결과를 통해
          memory, scheduling, execution primitive의 작동 단서를 역으로 읽어냅니다.
          여기서 얻은 관찰은 어떤 구현 방식이 실제로 성립하고, 어떤 realization이
          더 적절한지 판단하는 근거로 이어집니다.
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
            의미적으로 허용되는 변환이 항상 좋은 실행으로 이어지지는 않습니다.
            probing 실험은 hardware response와 execution pattern을 직접 드러내고,
            어떤 realization이 실제 GPU에서 더 적절한지 판단할 근거를 제공합니다.
            이 결과는 analysis와 operator realization 페이지로 이어지며,
            realization 비교와 선택의 출발점이 됩니다.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Experiment Explorer</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-neutral-400">
            왼쪽에서 실험을 선택하면, 오른쪽에서 해당 실험의 목적, 관찰 포인트,
            출력 형태, 그리고 다음 연결 경로를 바로 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-lime-400/80">
                Experiments
              </div>

              <div className="space-y-3">
                {hardwareExperiments.map((experiment) => {
                  const active = experiment.id === selectedId;

                  return (
                    <button
                      key={experiment.id}
                      type="button"
                      onClick={() => setSelectedId(experiment.id)}
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
                })}
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

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">관찰 포인트</h4>
                <ul className="mt-4 space-y-3 text-sm text-neutral-300">
                  {selectedExperiment.observe.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  예상 출력 / 정리 형태
                </h4>
                <ul className="mt-4 space-y-3 text-sm text-neutral-300">
                  {selectedExperiment.outputs.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h4 className="text-lg font-semibold text-white">다음 연결 경로</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {selectedExperiment.nextLinks.map((link) => (
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
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">
            Why this layer matters
          </h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            추상적으로 허용되는 변환과 실제로 좋은 realization은 다를 수 있습니다.
            GPU의 memory hierarchy, bank mapping, transaction behavior, issue pattern은
            구현 품질을 크게 바꾸며, 이 차이는 연산 의미만으로는 드러나지 않습니다.
            그래서 Atlas는 의미 계층과 별도로 hardware evidence를 두고, 불투명한
            실행 메커니즘을 probing과 측정으로 역추적합니다. 이 층의 목적은
            하드웨어를 설명하는 데서 끝나지 않고, 어떤 구현 방식이 실제로 더
            적절한지 판단할 근거를 만드는 데 있습니다.
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