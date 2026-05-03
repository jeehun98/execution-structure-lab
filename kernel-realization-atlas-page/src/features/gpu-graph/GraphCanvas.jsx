import { useMemo, useState } from "react";
import { buildGraph } from "./buildGraph";

const CANVAS = {
  width: 720,
  height: 360,
};

const ROOT = {
  x: CANVAS.width / 2,
  y: 60,
};

const CHILD_Y = 245;

function getChildPositions(children) {
  const count = children.length;
  const gap = 260;
  const startX = ROOT.x - ((count - 1) * gap) / 2;

  return children.map((child, index) => ({
    ...child,
    x: startX + index * gap,
    y: CHILD_Y,
  }));
}

function NodeButton({ node, x, y, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(node.id)}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? "border-lime-400 bg-lime-400/10 text-white shadow-[0_0_20px_rgba(163,230,53,0.16)]"
          : "border-white/20 bg-white/5 text-neutral-300 hover:border-lime-400/50 hover:text-white"
      }`}
      style={{ left: x, top: y }}
    >
      {node.label}
    </button>
  );
}

function EdgePath({ from, to, label, active }) {
  const midY = (from.y + to.y) / 2;

  return (
    <g>
      <path
        d={`M ${from.x} ${from.y + 28} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 28}`}
        fill="none"
        stroke={
          active
            ? "rgb(163 230 53 / 0.85)"
            : "rgb(163 230 53 / 0.38)"
        }
        strokeWidth={active ? 2 : 1.4}
      />

      {label ? (
        <text
          x={(from.x + to.x) / 2}
          y={midY - 8}
          textAnchor="middle"
          className="fill-lime-300 text-[11px]"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export default function GraphCanvas({ onSelect }) {
  const { nodes, edges } = useMemo(() => buildGraph(), []);
  const [focus, setFocus] = useState("warp");

  const root = nodes.find((node) => node.id === "warp");

  const children = useMemo(() => {
    const directChildren = edges
      .filter((edge) => edge.from === "warp")
      .map((edge) => ({
        edge,
        node: nodes.find((node) => node.id === edge.to),
      }))
      .filter((item) => item.node);

    return getChildPositions(directChildren);
  }, [edges, nodes]);

  const selectNode = (id) => {
    const selectedNode = nodes.find((node) => node.id === id);

    setFocus(id);
    onSelect?.(selectedNode);
  };

  const rootPosition = {
    x: ROOT.x,
    y: ROOT.y,
  };

  return (
    <div
      className="relative mx-auto"
      style={{
        width: CANVAS.width,
        height: CANVAS.height,
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      >
        {children.map(({ edge, x, y, node }) => (
          <EdgePath
            key={edge.id}
            from={rootPosition}
            to={{ x, y }}
            label={edge.type}
            active={focus === "warp" || focus === node.id}
          />
        ))}
      </svg>

      <NodeButton
        node={root}
        x={rootPosition.x}
        y={rootPosition.y}
        active={focus === "warp"}
        onClick={selectNode}
      />

      {children.map(({ node, x, y }) => (
        <NodeButton
          key={node.id}
          node={node}
          x={x}
          y={y}
          active={focus === node.id}
          onClick={selectNode}
        />
      ))}
    </div>
  );
}