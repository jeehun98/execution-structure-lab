import { Link, useParams } from "react-router-dom";
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

import { hardwareExperimentGroups } from "../data/hardware/experiments";

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
  if (value === null || value === undefined) return "—";
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

function findExperimentById(experimentId) {
  for (const group of hardwareExperimentGroups) {
    const experiment = group.experiments?.find(
      (item) => item.id === experimentId
    );

    if (experiment) {
      return { group, experiment };
    }
  }

  return { group: null, experiment: null };
}

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function SectionBlock({ id, eyebrow, title, desc, children }) {
  if (!children) return null;

  return (
    <section
      id={id}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      {(eyebrow || title || desc) && (
        <div>
          {eyebrow ? (
            <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
              {eyebrow}
            </div>
          ) : null}

          {title ? (
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          ) : null}

          {desc ? (
            <p className="mt-3 text-sm leading-6 text-neutral-400">{desc}</p>
          ) : null}
        </div>
      )}

      <div className={title || desc || eyebrow ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

function DetailList({ title, items = [] }) {
  if (!hasItems(items)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

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

function KeyFindingGrid({ items = [] }) {
  if (!hasItems(items)) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            {item.label}
          </div>

          <div className="mt-3 text-xl font-semibold leading-tight text-white">
            {item.value}
          </div>

          {item.desc ? (
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {item.desc}
            </p>
          ) : null}
        </div>
      ))}
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
      <h3 className="text-lg font-semibold text-white">커널 구조 단서</h3>

      <p className="mt-3 text-sm leading-6 text-neutral-400">
        이 표는 커널이 어떤 하드웨어 반응을 유도하도록 설계되어 있는지
        정리합니다. 구현 세부보다, 어떤 변수를 고정하고 어떤 변수를 흔드는지가
        중요합니다.
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
      <h3 className="text-lg font-semibold text-white">{chart.title}</h3>

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
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartSection({ charts = [], chartData = [] }) {
  if (!hasItems(charts) || !hasItems(chartData)) return null;

  return (
    <div className="space-y-6">
      {charts.map((chart, index) => (
        <ChartCard
          key={`${chart.title}-${index}`}
          chart={chart}
          data={chartData}
        />
      ))}
    </div>
  );
}

function CodeSnippet({ code }) {
  if (!code) return null;

  return (
    <SectionBlock
      id="code"
      eyebrow="Kernel Snippet"
      title="핵심 커널 발췌"
      desc="전체 구현보다, 이 실험의 하드웨어 반응을 만드는 최소 코드 구조에 집중합니다."
    >
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-neutral-200">
        <code>{code}</code>
      </pre>
    </SectionBlock>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AnchorNav({ items = [] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function NextLinks({ links = [] }) {
  if (!hasItems(links)) return null;

  return (
    <SectionBlock
      id="next-path"
      eyebrow="Next Path"
      title="다음 검증 경로"
      desc="하나의 probe 결과만으로 메커니즘을 단정하지 않고, 다음 실험으로 해석을 좁혀 갑니다."
    >
      <div className="grid gap-4 md:grid-cols-2">
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
    </SectionBlock>
  );
}

function NeighborNavigation({ currentExperimentId }) {
  const allExperiments = hardwareExperimentGroups.flatMap((group) =>
    (group.experiments ?? []).map((experiment) => ({
      group,
      experiment,
    }))
  );

  const currentIndex = allExperiments.findIndex(
    ({ experiment }) => experiment.id === currentExperimentId
  );

  if (currentIndex < 0) return null;

  const prev = allExperiments[currentIndex - 1];
  const next = allExperiments[currentIndex + 1];

  if (!prev && !next) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {prev ? (
        <Link
          to={`/hardware-evidence/${prev.experiment.id}`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-lime-400/30 hover:bg-white/[0.06]"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Previous Probe
          </div>

          <div className="mt-2 text-base font-semibold text-white">
            {prev.experiment.label}
          </div>

          <div className="mt-2 text-sm text-neutral-400">
            {prev.group.label}
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={`/hardware-evidence/${next.experiment.id}`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-lime-400/30 hover:bg-white/[0.06]"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Next Probe
          </div>

          <div className="mt-2 text-base font-semibold text-white">
            {next.experiment.label}
          </div>

          <div className="mt-2 text-sm text-neutral-400">
            {next.group.label}
          </div>
        </Link>
      ) : null}
    </div>
  );
}

export default function HardwareExperimentDetailPage() {
  const { experimentId } = useParams();
  const { group, experiment } = findExperimentById(experimentId);

  if (!experiment) {
    return (
      <div className="space-y-6">
        <Link
          to="/hardware-evidence"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          ← Hardware Evidence
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-neutral-300">
          No hardware probe found.
        </div>
      </div>
    );
  }

  const badges = [];

  if (group?.label) badges.push(group.label);
  if (experiment.category && experiment.category !== group?.label) {
    badges.push(experiment.category);
  }

  const anchorItems = [
    { href: "#overview", label: "실험 개요" },
    ...(hasItems(experiment.keyFindings)
      ? [{ href: "#key-findings", label: "핵심 관찰" }]
      : []),
    { href: "#question", label: "질문 / 필요성" },
    { href: "#method", label: "구성 방식" },
    ...(experiment.codeSnippet ? [{ href: "#code", label: "커널 발췌" }] : []),
    ...(hasItems(experiment.charts) && hasItems(experiment.chartData)
      ? [{ href: "#curve", label: "반응 곡선" }]
      : []),
    { href: "#signals", label: "관찰 신호" },
    { href: "#results", label: "결과 / 해석" },
    { href: "#limits", label: "한계 / 후속 검증" },
    ...(hasItems(experiment.nextLinks)
      ? [{ href: "#next-path", label: "다음 경로" }]
      : []),
  ];

  const siblingExperiments =
    group?.experiments?.filter((item) => item.id !== experiment.id) ?? [];

  const hasQuestionBlock = experiment.question || experiment.whyItMatters;
  const hasMethodBlock = hasItems(experiment.method) || experiment.kernelShape;
  const hasSignalBlock = hasItems(experiment.observe) || hasItems(experiment.outputs);
  const hasResultBlock =
    hasItems(experiment.resultHighlights) || hasItems(experiment.interpretation);
  const hasLimitBlock =
    hasItems(experiment.caveats) || hasItems(experiment.nextProbes);

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <Link
          to="/hardware-evidence"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          ← Hardware Evidence
        </Link>

        <div
          id="overview"
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300"
              >
                {badge}
              </span>
            ))}
          </div>

          <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            {experiment.label}
          </h1>

          {experiment.summary ? (
            <p className="mt-4 max-w-4xl text-base leading-8 text-neutral-400">
              {experiment.summary}
            </p>
          ) : null}
        </div>

        <section id="key-findings">
          <KeyFindingGrid items={experiment.keyFindings} />
        </section>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SidebarCard title="이 페이지에서 보는 것">
            <AnchorNav items={anchorItems} />
          </SidebarCard>

          <SidebarCard title="같은 그룹의 다른 Probe">
            <div className="space-y-3">
              {siblingExperiments.length ? (
                siblingExperiments.map((item) => (
                  <Link
                    key={item.id}
                    to={`/hardware-evidence/${item.id}`}
                    className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <div className="text-sm leading-6 text-neutral-500">
                  같은 그룹의 다른 실험이 아직 없습니다.
                </div>
              )}
            </div>
          </SidebarCard>
        </aside>

        <div className="space-y-6">
          {hasQuestionBlock ? (
            <div id="question" className="grid gap-6 lg:grid-cols-2">
              {experiment.question ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-lg font-semibold text-white">
                    Probe Question
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">
                    {experiment.question}
                  </p>
                </div>
              ) : null}

              {experiment.whyItMatters ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-lg font-semibold text-white">
                    AICF에서 필요한 이유
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">
                    {experiment.whyItMatters}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {hasMethodBlock ? (
            <div id="method" className="grid gap-6 lg:grid-cols-2">
              <DetailList title="Probe 구성 방식" items={experiment.method} />
              <KernelShapeTable kernelShape={experiment.kernelShape} />
            </div>
          ) : null}

          <CodeSnippet code={experiment.codeSnippet} />

          <SectionBlock
            id="curve"
            eyebrow="Response Curve"
            title="반응 곡선"
            desc="그래프는 단순 시각화가 아니라, 하드웨어 반응의 모양을 읽기 위한 핵심 증거입니다."
          >
            <ChartSection
              charts={experiment.charts}
              chartData={experiment.chartData}
            />
          </SectionBlock>

          {hasSignalBlock ? (
            <div id="signals" className="grid gap-6 lg:grid-cols-2">
              <DetailList title="관찰할 신호" items={experiment.observe} />
              <DetailList title="예상 출력 형태" items={experiment.outputs} />
            </div>
          ) : null}

          {hasResultBlock ? (
            <div id="results" className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="관찰된 결과"
                items={experiment.resultHighlights}
              />
              <DetailList
                title="가능한 해석"
                items={experiment.interpretation}
              />
            </div>
          ) : null}

          {hasLimitBlock ? (
            <div id="limits" className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="한계와 과잉해석 방지"
                items={experiment.caveats}
              />
              <DetailList
                title="후속 검증 Probe"
                items={experiment.nextProbes}
              />
            </div>
          ) : null}

          <NextLinks links={experiment.nextLinks} />
          <NeighborNavigation currentExperimentId={experiment.id} />
        </div>
      </div>
    </div>
  );
}