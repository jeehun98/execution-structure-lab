import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { hardwareChips } from "../data/hardware/chips";
import { hardwareOverview } from "../data/hardware/overview";
import {
  hardwareExperimentGroups,
  hardwareExperimentsIntro,
} from "../data/hardware/experiments";

function formatKeyLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
}

function formatMetricLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatMetricValue(value) {
  if (typeof value !== "number") return String(value);

  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  if (Math.abs(value) < 1 && value !== 0) {
    return value.toFixed(4);
  }
  if (!Number.isInteger(value)) {
    return value.toFixed(3);
  }
  return String(value);
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
      <h4 className="text-lg font-semibold text-white">커널 구조 단서</h4>
      <p className="mt-3 text-sm leading-6 text-neutral-400">
        이 표는 커널이 어떤 하드웨어 반응을 유도하도록 설계되었는지 보여줍니다.
        여기서 중요한 것은 구현 세부보다, 어떤 변수를 고정하고 어떤 변수를
        흔드는지입니다.
      </p>

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

function GroupNavCard({ group, active, onClick }) {
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Probe Group
          </div>
          <div className="mt-2 text-base font-semibold text-white">
            {group.label}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
          {group.experiments?.length ?? 0}
        </div>
      </div>

      {group.summary ? (
        <div className="mt-3 text-sm leading-6 text-neutral-400">
          {group.summary}
        </div>
      ) : null}
    </button>
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
      <h4 className="text-lg font-semibold text-white">다음 검증 경로</h4>
      <p className="mt-3 text-sm leading-6 text-neutral-400">
        하나의 probe 결과만으로 하드웨어 메커니즘을 단정하지 않습니다. 다음
        실험으로 같은 현상이 유지되는지, 다른 변수에서 이동하는지 확인합니다.
      </p>

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

function ChartCard({ chart, data = [] }) {
  if (!chart || !data?.length || !chart.xKey || !chart.yKeys?.length) {
    return null;
  }

  const strokePalette = [
    "#84cc16",
    "#22c55e",
    "#38bdf8",
    "#a78bfa",
    "#f59e0b",
    "#f472b6",
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h4 className="text-lg font-semibold text-white">{chart.title}</h4>
      {chart.summary ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {chart.summary}
        </p>
      ) : null}

      <div className="mt-4 h-72 rounded-xl border border-white/10 bg-black/20 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey={chart.xKey}
              stroke="rgba(255,255,255,0.55)"
              tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.55)"
              tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
              tickFormatter={formatMetricValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value, name) => [
                formatMetricValue(value),
                formatMetricLabel(name),
              ]}
              labelFormatter={(label) =>
                `${formatMetricLabel(chart.xKey)}: ${label}`
              }
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-neutral-300">
                  {formatMetricLabel(value)}
                </span>
              )}
            />
            {chart.yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={strokePalette[index % strokePalette.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartSection({ charts = [], chartData = [] }) {
  if (!charts?.length || !chartData?.length) return null;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white">반응 곡선</h4>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          이 페이지에서 그래프는 단순 시각화가 아닙니다. stride 변화, footprint
          변화, actual work collapse, latency spike처럼 수치 하나로는 보이지
          않는 하드웨어 반응의 모양을 읽기 위한 핵심 증거입니다.
        </p>
      </div>

      <div className="grid gap-6">
        {charts.map((chart, index) => (
          <ChartCard
            key={`${chart.title}-${index}`}
            chart={chart}
            data={chartData}
          />
        ))}
      </div>
    </div>
  );
}

function GroupOverviewCard({ group }) {
  if (!group) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
        {group.label}
      </div>
      <h3 className="mt-3 text-2xl font-semibold text-white">
        {group.headline || `${group.label} Probe Group`}
      </h3>

      {group.summary ? (
        <p className="mt-4 text-sm leading-7 text-neutral-400">
          {group.summary}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <DetailList title="이 분류가 묻는 질문" items={group.questions} />
        <DetailList title="주요 반응 신호" items={group.signals} />
        <DetailList title="해석 기준" items={group.interpretationGuide} />
      </div>
    </div>
  );
}

function GroupSummaryGrid({ groups = [], selectedGroupId, onSelect }) {
  if (!groups?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((group) => {
        const active = group.id === selectedGroupId;

        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              active
                ? "border-lime-400/50 bg-lime-400/10"
                : "border-white/10 bg-white/[0.03] hover:border-lime-400/30 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-semibold text-white">
                {group.label}
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-300">
                {group.experiments?.length ?? 0}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              {group.summary}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export default function HardwareEvidencePage() {
  const [selectedGroupId, setSelectedGroupId] = useState(
    hardwareExperimentGroups[0]?.id ?? null
  );
  const [selectedExperimentId, setSelectedExperimentId] = useState(null);

  const selectedGroup = useMemo(() => {
    return (
      hardwareExperimentGroups.find((group) => group.id === selectedGroupId) ??
      hardwareExperimentGroups[0] ??
      null
    );
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedExperimentId(null);
      return;
    }

    const hasSelectedExperiment = selectedGroup.experiments?.some(
      (experiment) => experiment.id === selectedExperimentId
    );

    if (!hasSelectedExperiment) {
      setSelectedExperimentId(selectedGroup.experiments?.[0]?.id ?? null);
    }
  }, [selectedGroup, selectedExperimentId]);

  const selectedExperiment = useMemo(() => {
    if (!selectedGroup) return null;

    return (
      selectedGroup.experiments?.find(
        (experiment) => experiment.id === selectedExperimentId
      ) ??
      selectedGroup.experiments?.[0] ??
      null
    );
  }, [selectedGroup, selectedExperimentId]);

  if (!selectedGroup || !selectedExperiment) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-neutral-300">
        No hardware probe groups found.
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
          이 페이지는 GPU 커널의 빠르고 느림을 단순 비교하는 곳이 아닙니다.
          하나의 커널 구조를 하드웨어에 입력하고, 그 실행 반응에서 latency
          spike, throughput drop, work collapse, cache reuse, bank conflict 같은
          메커니즘의 흔적을 읽기 위한 probe atlas입니다. 각 실험은 관찰된
          수치와 가능한 해석을 분리하고, 다른 GPU에서 같은 실험을 실행했을 때
          무엇이 유지되고 무엇이 달라지는지 판단할 기준을 제공합니다.
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

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">GPU Probe Atlas</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-neutral-400">
            probe는 개별 커널의 성능 점수가 아니라, 코드 구조가 어떤 하드웨어
            층위를 건드리는지 읽기 위한 실험 단위입니다. 먼저 memory, shared
            memory, compute, resource pressure, compiler lowering 같은 분류로
            정리하고, 각 분류 안에서 공통 질문과 해석 기준을 공유한 뒤 개별
            실험 상세로 내려갑니다.
          </p>
        </div>

        {hardwareExperimentsIntro ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              {hardwareExperimentsIntro.title}
            </h3>
            <p className="mt-3 max-w-5xl text-sm leading-7 text-neutral-400">
              {hardwareExperimentsIntro.desc}
            </p>
          </div>
        ) : null}

        <GroupSummaryGrid
          groups={hardwareExperimentGroups}
          selectedGroupId={selectedGroup.id}
          onSelect={setSelectedGroupId}
        />

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-lime-400/80">
                  Probe Groups
                </div>

                <div className="space-y-3">
                  {hardwareExperimentGroups.map((group) => (
                    <GroupNavCard
                      key={group.id}
                      group={group}
                      active={group.id === selectedGroup.id}
                      onClick={() => setSelectedGroupId(group.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-lime-400/80">
                  Probes in {selectedGroup.label}
                </div>

                <div className="space-y-3">
                  {selectedGroup.experiments?.map((experiment) => (
                    <ExperimentNavCard
                      key={experiment.id}
                      experiment={experiment}
                      active={experiment.id === selectedExperiment.id}
                      onClick={() => setSelectedExperimentId(experiment.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <GroupOverviewCard group={selectedGroup} />

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
                  Probe Question
                </h4>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {selectedExperiment.question}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  AICF에서 필요한 이유
                </h4>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {selectedExperiment.whyItMatters}
                </p>
              </div>
            </div>

            <DetailList
              title="Probe 구성 방식"
              items={selectedExperiment.method}
            />

            <KernelShapeTable kernelShape={selectedExperiment.kernelShape} />

            {selectedExperiment.codeSnippet ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="text-lg font-semibold text-white">
                  핵심 커널 발췌
                </h4>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  전체 구현보다, 이 실험의 하드웨어 반응을 만드는 최소 코드
                  구조에 집중합니다. 이 조각이 어떤 접근 패턴, 동기화, 반복,
                  주소 분포를 만드는지가 해석의 출발점입니다.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-neutral-200">
                  <code>{selectedExperiment.codeSnippet}</code>
                </pre>
              </div>
            ) : null}

            <ChartSection
              charts={selectedExperiment.charts}
              chartData={selectedExperiment.chartData}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="관찰할 신호"
                items={selectedExperiment.observe}
              />
              <DetailList
                title="예상 출력 형태"
                items={selectedExperiment.outputs}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="관찰된 결과"
                items={selectedExperiment.resultHighlights}
              />
              <DetailList
                title="가능한 해석"
                items={selectedExperiment.interpretation}
              />
            </div>

            <DetailList
              title="한계와 과잉해석 방지"
              items={selectedExperiment.caveats}
            />
            <DetailList
              title="후속 검증 Probe"
              items={selectedExperiment.nextProbes}
            />

            <NextLinks links={selectedExperiment.nextLinks} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">
            이 증거가 realization 선택으로 이어지는 방식
          </h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            하드웨어 probe는 결과 보관소가 아니라, 커널 합성기가 realization을
            선택할 때 참조하는 경험적 근거입니다. 특정 stride에서 spike가
            생기는지, padding으로 완화되는지, fixed-work 조건에서도 비용이
            유지되는지, register pressure가 어느 지점에서 occupancy를 무너뜨리는지
            같은 관찰은 이후 layout transformation, tiling, vectorization,
            shared memory 사용 여부, compiler lowering 검증으로 연결됩니다.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">다음 경로</h2>
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