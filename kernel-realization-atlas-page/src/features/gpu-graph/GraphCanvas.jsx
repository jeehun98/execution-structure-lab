import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { buildGraph } from "./buildGraph";

const CANVAS = {
  width: 820,
  height: 360,
};

const ROOT_ID = "warp";

const ROOT = {
  x: 100,
  y: CANVAS.height / 2,
};

const COLUMN_GAP = 260;
const ROW_GAP = 120;

// --- Helper Functions ---

function buildChildrenMap(edges) {
  return edges.reduce((map, edge) => {
    if (!map[edge.from]) map[edge.from] = [];
    map[edge.from].push(edge);
    return map;
  }, {});
}

function getReachableNodeIds(rootId, childrenMap) {
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);

    const childEdges = childrenMap[id] ?? [];
    childEdges.forEach((edge) => visit(edge.to));
  }

  visit(rootId);
  return visited;
}

function getDepthMap(rootId, childrenMap) {
  const depthMap = new Map([[rootId, 0]]);
  const queue = [rootId];

  while (queue.length) {
    const current = queue.shift();
    const currentDepth = depthMap.get(current) ?? 0;
    const childEdges = childrenMap[current] ?? [];

    childEdges.forEach((edge) => {
      if (!depthMap.has(edge.to)) {
        depthMap.set(edge.to, currentDepth + 1);
        queue.push(edge.to);
      }
    });
  }

  return depthMap;
}

function getLayout({ nodes, edges, rootId }) {
  const childrenMap = buildChildrenMap(edges);
  const reachableIds = getReachableNodeIds(rootId, childrenMap);
  const depthMap = getDepthMap(rootId, childrenMap);

  const visibleNodes = nodes.filter((node) => reachableIds.has(node.id));

  const columns = visibleNodes.reduce((map, node) => {
    const depth = depthMap.get(node.id) ?? 0;
    if (!map[depth]) map[depth] = [];
    map[depth].push(node);
    return map;
  }, {});

  const positionedNodes = [];

  Object.entries(columns).forEach(([depthKey, columnNodes]) => {
    const depth = Number(depthKey);
    const count = columnNodes.length;
    const startY = ROOT.y - ((count - 1) * ROW_GAP) / 2;

    columnNodes.forEach((node, index) => {
      positionedNodes.push({
        ...node,
        x: ROOT.x + depth * COLUMN_GAP,
        y: startY + index * ROW_GAP,
      });
    });
  });

  const positionMap = new Map(positionedNodes.map((node) => [node.id, node]));

  const positionedEdges = edges
    .filter((edge) => positionMap.has(edge.from) && positionMap.has(edge.to))
    .map((edge) => ({
      ...edge,
      fromNode: positionMap.get(edge.from),
      toNode: positionMap.get(edge.to),
    }));

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
  };
}

function getParentMap(edges) {
  const parentMap = new Map();
  edges.forEach((edge) => {
    parentMap.set(edge.to, edge.from);
  });
  return parentMap;
}

function getActivePathNodeIds(focusId, edges, rootId) {
  const parentMap = getParentMap(edges);
  const activeIds = new Set();

  let current = focusId;

  while (current) {
    activeIds.add(current);

    if (current === rootId) break;
    current = parentMap.get(current);
  }

  return activeIds;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function getEdgeLabelPosition({
  startX,
  startY,
  endX,
  endY,
  fromWidth = 0,
  toWidth = 0,
}) {
  const dx = endX - startX;
  const dy = endY - startY;

  const goingRight = dx >= 0;

  // 측정 실패 시에도 위치가 확실히 바뀌도록 fallback 자체를 중앙이 아니라 출발점 기준으로 둠
  const fallbackX = goingRight ? startX + 72 : startX - 72;
  const fallbackY = startY - 22;

  const fromHalfWidth = fromWidth ? fromWidth / 2 : 36;
  const toHalfWidth = toWidth ? toWidth / 2 : 36;

  // 노드 중앙-중앙 선은 유지하되,
  // 라벨은 출발 노드 바깥쪽에서 조금 떨어진 위치에 배치
  const fromOuterX = goingRight
    ? startX + fromHalfWidth
    : startX - fromHalfWidth;

  const toOuterX = goingRight
    ? endX - toHalfWidth
    : endX + toHalfWidth;

  const gap = Math.abs(toOuterX - fromOuterX);

  // 노드 사이 빈 공간이 좁을 때도 라벨이 노드에 붙지 않도록 최소 오프셋 보장
  const offsetFromSource = Math.min(Math.max(gap * 0.28, 46), 86);

  let labelX = goingRight
    ? fromOuterX + offsetFromSource
    : fromOuterX - offsetFromSource;

  // 그래도 다음 노드에 너무 가까워지지 않도록 제한
  if (goingRight) {
    labelX = Math.min(labelX, toOuterX - 24);
  } else {
    labelX = Math.max(labelX, toOuterX + 24);
  }

  const labelY =
    Math.abs(dy) < 20
      ? startY - 24
      : startY + dy * 0.35 - 24;

  if (!Number.isFinite(labelX) || !Number.isFinite(labelY)) {
    return {
      x: fallbackX,
      y: fallbackY,
    };
  }

  return {
    x: labelX,
    y: labelY,
  };
}


// --- Components ---

function NodeButton({
  node,
  active,
  pathActive,
  onClick,
  onWidthMeasured,
}) {
  const buttonRef = useRef(null);

  useLayoutEffect(() => {
    if (buttonRef.current) {
      const width = buttonRef.current.offsetWidth;
      onWidthMeasured(node.id, width);
    }
  }, [node.id, node.label, onWidthMeasured]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onClick(node.id)}
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? "border-lime-400 bg-neutral-950 text-white shadow-[0_0_22px_rgba(163,230,53,0.2)]"
          : pathActive
          ? "border-lime-400/70 bg-neutral-950 text-white shadow-[0_0_14px_rgba(163,230,53,0.12)]"
          : "border-white/20 bg-neutral-900 text-neutral-300 hover:border-lime-400/50 hover:text-white"
      }`}
      style={{ left: node.x, top: node.y }}
    >
      {node.label}
    </button>
  );
}

function EdgePath({ edge, active, fromWidth = 0, toWidth = 0 }) {
  const from = edge.fromNode;
  const to = edge.toNode;

  const startX = from.x;
  const startY = from.y;
  const endX = to.x;
  const endY = to.y;

  const dx = endX - startX;
  const controlOffset = Math.max(Math.abs(dx) * 0.35, 60);

  const c1x = startX + controlOffset;
  const c1y = startY;
  const c2x = endX - controlOffset;
  const c2y = endY;

  const labelPos = getEdgeLabelPosition({
    startX,
    startY,
    endX,
    endY,
    fromWidth,
    toWidth,
  });

  return (
    <g>
      <path
        d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
        fill="none"
        stroke={active ? "rgb(163 230 53 / 0.9)" : "rgb(163 230 53 / 0.22)"}
        strokeWidth={active ? 2 : 1.2}
        strokeLinecap="round"
      />

      {edge.type ? (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-[11px] font-medium transition-colors ${
            active ? "fill-lime-300" : "fill-neutral-500"
          }`}
          style={{
            paintOrder: "stroke",
            stroke: "rgba(0, 0, 0, 0.95)",
            strokeWidth: 6,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        >
          {edge.type}
        </text>
      ) : null}
    </g>
  );
}

export default function GraphCanvas({ onSelect }) {
  const graph = useMemo(() => buildGraph(), []);

  const layout = useMemo(
    () =>
      getLayout({
        nodes: graph.nodes,
        edges: graph.edges,
        rootId: ROOT_ID,
      }),
    [graph]
  );

  const [focus, setFocus] = useState(ROOT_ID);
  const [nodeWidths, setNodeWidths] = useState({});

  const handleWidthMeasured = useCallback((id, width) => {
    setNodeWidths((prev) => {
      if (prev[id] === width) return prev;
      return { ...prev, [id]: width };
    });
  }, []);

  useEffect(() => {
    const root = layout.nodes.find((node) => node.id === ROOT_ID);
    if (root) onSelect?.(root);
  }, [layout.nodes, onSelect]);

  const activePathNodeIds = useMemo(
    () => getActivePathNodeIds(focus, layout.edges, ROOT_ID),
    [focus, layout.edges]
  );

  const selectNode = (id) => {
    const selectedNode = layout.nodes.find((node) => node.id === id);
    setFocus(id);
    onSelect?.(selectedNode);
  };

  const isEdgeActive = (edge) => {
    return activePathNodeIds.has(edge.from) && activePathNodeIds.has(edge.to);
  };

  return (
    <div
      className="relative mx-auto bg-black"
      style={{ width: CANVAS.width, height: CANVAS.height }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      >
        {layout.edges.map((edge) => (
          <EdgePath
            key={edge.id}
            edge={edge}
            active={isEdgeActive(edge)}
            fromWidth={nodeWidths[edge.from] ?? 0}
            toWidth={nodeWidths[edge.to] ?? 0}
          />
        ))}
      </svg>

      {layout.nodes.map((node) => (
        <NodeButton
          key={node.id}
          node={node}
          active={focus === node.id}
          pathActive={activePathNodeIds.has(node.id)}
          onClick={selectNode}
          onWidthMeasured={handleWidthMeasured}
        />
      ))}
    </div>
  );
}