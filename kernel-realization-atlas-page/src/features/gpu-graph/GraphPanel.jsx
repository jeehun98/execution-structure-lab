import { Link } from "react-router-dom";

function ResultSummaryBlock({ resultSummary }) {
  if (!resultSummary) return null;

  const metrics = resultSummary.metrics ?? [];

  return (
    <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-lime-300/80">
        {resultSummary.title ?? "요약 결과"}
      </div>

      {resultSummary.conclusion ? (
        <p className="mt-3 text-sm leading-7 text-neutral-200">
          {resultSummary.conclusion}
        </p>
      ) : null}

      {metrics.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                  {metric.label}
                </span>

                <span className="text-sm font-semibold text-lime-200">
                  {metric.value}
                </span>
              </div>

              {metric.note ? (
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {metric.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {resultSummary.caveat ? (
        <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-neutral-500">
          {resultSummary.caveat}
        </p>
      ) : null}
    </div>
  );
}

export default function GraphPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <div>
        <p className="text-sm text-neutral-400">
          노드를 선택하면 관계가 드러납니다
        </p>
      </div>
    );
  }

  const title = selectedNode.title ?? selectedNode.label;
  const description = selectedNode.description;
  const status = selectedNode.status;
  const kind = selectedNode.kind;
  const detailPath = selectedNode.detailPath;
  const resultSummary = selectedNode.resultSummary;

  return (
    <div>
      {kind ? (
        <div className="mb-3 inline-flex rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
          {kind}
        </div>
      ) : null}

      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-sm leading-7 text-neutral-400">
          {description}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-7 text-neutral-600">
          description이 등록되지 않았습니다.
        </p>
      )}

      <ResultSummaryBlock resultSummary={resultSummary} />

      {status ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
          status:{" "}
          <span className="text-lime-300">
            {status}
          </span>
        </div>
      ) : null}

      {detailPath ? (
        <Link
          to={detailPath}
          className="mt-6 inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 실험 보기 →
        </Link>
      ) : null}
    </div>
  );
}