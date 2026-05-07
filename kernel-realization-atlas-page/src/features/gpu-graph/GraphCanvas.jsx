import { useEffect, useMemo, useState } from "react";
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

/**
 * 변경된 부분: 
 * 간선 라벨을 목적지 노드(toNode)의 정중앙 상단에 배치합니다.
 */
function getEdgeLabelPosition(toNode) {
  return {
    x: toNode.x,
    y: toNode.y - 35, // 노드 버튼 위로 띄움
  };
}

// --- Components ---

function NodeButton({ node, active, pathActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(node.id)}
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? "border-lime-400 bg-neutral-950 text-white shadow-[0_0_22px_rgba(163,230,53,0.2)]"
          : pathActive
          ? "border-lime-400/70 bg-neutral-950 text-white shadow-[0_0_14px_rgba(163,230,53,0.12)]"
          : "border-white/20 bg-neutral-900 text-neutral-300 hover:border-lime-400/50 hover:text-white"
      }`}
      style={{
        left: node.x,
        top: node.y,
      }}
    >
      {node.label}
    </button>
  );
}

function EdgePath({ edge, active }) {
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

  // 목적지 노드 기준으로 라벨 위치 결정
  const labelPos = getEdgeLabelPosition(to);

  return (
    <g>
      <path
        d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
        fill="none"
        stroke={
          active
            ? "rgb(163 230 53 / 0.9)"
            : "rgb(163 230 53 / 0.22)"
        }
        strokeWidth={active ? 2 : 1.2}
        strokeLinecap="round"
      />

      {edge.type ? (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-[11px] font-bold transition-colors ${
            active ? "fill-lime-300" : "fill-neutral-500"
          }`}
          style={{
            paintOrder: "stroke",
            stroke: "rgba(0, 0, 0, 0.95)",
            strokeWidth: 5,
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

  useEffect(() => {
    const root = layout.nodes.find((node) => node.id === ROOT_ID);
    if (root) {
      onSelect?.(root);
    }
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
      style={{
        width: CANVAS.width,
        height: CANVAS.height,
      }}
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
        />
      ))}
    </div>
  );
}