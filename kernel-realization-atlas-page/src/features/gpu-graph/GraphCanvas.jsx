import { useMemo, useState } from "react";
import buildGraph from "./buildGraph";

const INITIAL_FOCUS_ID = "warp";

const POSITION_STORAGE_KEY = "gpu-graph-node-positions";

const GRAPH_PADDING = {
  x: 120,
  y: 120,
};

const LAYER_X = {
  concept: 120,
  "execution-context": 340,
  "execution-unit": 580,
  "probe-baseline": 860,
  probe: 860,
  "probe-result": 1140,
  "follow-up-result": 1420,
  "attribution-result": 1700,
  plan: 1980,
  optimization: 2260,
};

const DEFAULT_LAYER = "probe";
const ROW_GAP = 120;
const MIN_GRAPH_WIDTH = 1600;
const MIN_GRAPH_HEIGHT = 760;

const DEFAULT_NODE_HALF_WIDTH = 64;

// --- Storage ---

function loadSavedPositions() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function savePositionsToStorage(positions) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    POSITION_STORAGE_KEY,
    JSON.stringify(positions, null, 2)
  );
}

// --- Normalization ---

function normalizeEdge(edge) {
  const from = edge.from ?? edge.source;
  const to = edge.to ?? edge.target;

  return {
    ...edge,
    from,
    to,
  };
}

function normalizeGraph(graph) {
  return {
    nodes: graph.nodes ?? [],
    edges: (graph.edges ?? [])
      .map(normalizeEdge)
      .filter((edge) => edge.from && edge.to),
  };
}

// --- Layout ---

function getNodeLayer(node) {
  if (node.layer) return node.layer;

  if (node.kind === "concept") return "concept";
  if (node.kind === "execution") return "execution-unit";
  if (node.kind === "memory") return "execution-unit";
  if (node.status === "planned") return "plan";

  return DEFAULT_LAYER;
}

function getLayerOrder(layer) {
  const keys = Object.keys(LAYER_X);
  const index = keys.indexOf(layer);

  if (index >= 0) {
    return index;
  }

  return keys.indexOf(DEFAULT_LAYER);
}

function sortNodesInLayer(nodes) {
  return [...nodes].sort((a, b) => {
    const aOrder = a.order ?? 0;
    const bOrder = b.order ?? 0;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return String(a.label ?? a.id).localeCompare(String(b.label ?? b.id));
  });
}

function getLayout({ nodes, edges, savedPositions }) {
  const columns = nodes.reduce((map, node) => {
    const layer = getNodeLayer(node);

    if (!map[layer]) {
      map[layer] = [];
    }

    map[layer].push(node);
    return map;
  }, {});

  const positionedNodes = [];

  Object.entries(columns)
    .sort(([layerA], [layerB]) => getLayerOrder(layerA) - getLayerOrder(layerB))
    .forEach(([layer, layerNodes]) => {
      const x = LAYER_X[layer] ?? LAYER_X[DEFAULT_LAYER];
      const sortedNodes = sortNodesInLayer(layerNodes);

      sortedNodes.forEach((node, index) => {
        const savedPosition = savedPositions[node.id];

        positionedNodes.push({
          ...node,
          layer,
          x: savedPosition?.x ?? x,
          y: savedPosition?.y ?? GRAPH_PADDING.y + index * ROW_GAP,
        });
      });
    });

  const maxX = positionedNodes.reduce((max, node) => Math.max(max, node.x), 0);
  const maxY = positionedNodes.reduce((max, node) => Math.max(max, node.y), 0);

  const graphWidth = Math.max(MIN_GRAPH_WIDTH, maxX + GRAPH_PADDING.x);
  const graphHeight = Math.max(MIN_GRAPH_HEIGHT, maxY + GRAPH_PADDING.y);

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
    width: graphWidth,
    height: graphHeight,
  };
}

// --- Selection Helpers ---

function getAdjacentNodeIds(focusId, edges) {
  const ids = new Set([focusId]);

  edges.forEach((edge) => {
    if (edge.from === focusId) {
      ids.add(edge.to);
    }

    if (edge.to === focusId) {
      ids.add(edge.from);
    }
  });

  return ids;
}

function getRelatedNodeIds(focusNode) {
  const ids = new Set();

  const relatedNodes = focusNode?.relatedNodes ?? [];

  relatedNodes.forEach((item) => {
    if (typeof item === "string") {
      ids.add(item);
      return;
    }

    if (item?.id) {
      ids.add(item.id);
    }
  });

  return ids;
}

// --- Edge Geometry ---

function getEdgeOrientation(fromNode, toNode) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDy > absDx * 1.2) {
    return "vertical";
  }

  return "horizontal";
}

function getEdgeLabelPosition(fromNode, toNode) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;

  const orientation = getEdgeOrientation(fromNode, toNode);

  if (orientation === "vertical") {
    const labelSideOffset = 38;

    return {
      x: fromNode.x + labelSideOffset,
      y: fromNode.y + dy * 0.5,
      anchor: "start",
    };
  }

  const goingRight = dx >= 0;

  const sourceOuterX = goingRight
    ? fromNode.x + DEFAULT_NODE_HALF_WIDTH
    : fromNode.x - DEFAULT_NODE_HALF_WIDTH;

  const targetOuterX = goingRight
    ? toNode.x - DEFAULT_NODE_HALF_WIDTH
    : toNode.x + DEFAULT_NODE_HALF_WIDTH;

  const gap = Math.abs(targetOuterX - sourceOuterX);
  const offsetFromSource = Math.min(Math.max(gap * 0.28, 46), 82);

  return {
    x: goingRight
      ? sourceOuterX + offsetFromSource
      : sourceOuterX - offsetFromSource,
    y: fromNode.y + dy * 0.35 - 28,
    anchor: "middle",
  };
}

function getEdgePathD(fromNode, toNode) {
  const startX = fromNode.x;
  const startY = fromNode.y;
  const endX = toNode.x;
  const endY = toNode.y;

  const dx = endX - startX;
  const dy = endY - startY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const orientation = getEdgeOrientation(fromNode, toNode);

  if (orientation === "vertical") {
    const directionY = Math.sign(dy || 1);
    const controlOffset = Math.max(absDy * 0.35, 48);

    const c1x = startX;
    const c1y = startY + directionY * controlOffset;
    const c2x = endX;
    const c2y = endY - directionY * controlOffset;

    return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
  }

  const directionX = Math.sign(dx || 1);
  const controlOffset = Math.max(absDx * 0.35, 60);

  const c1x = startX + directionX * controlOffset;
  const c1y = startY;
  const c2x = endX - directionX * controlOffset;
  const c2y = endY;

  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
}

// --- Components ---

function NodeButton({
  node,
  active,
  connected,
  related,
  onClick,
  onMove,
}) {
  const handlePointerDown = (event) => {
    event.preventDefault();

    const startClientX = event.clientX;
    const startClientY = event.clientY;

    const startNodeX = node.x;
    const startNodeY = node.y;

    let moved = false;

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startClientX;
      const dy = moveEvent.clientY - startClientY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        moved = true;
      }

      onMove(node.id, {
        x: Math.round(startNodeX + dx),
        y: Math.round(startNodeY + dy),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (!moved) {
        onClick(node.id);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab whitespace-nowrap rounded-xl border px-4 py-2 text-sm transition active:cursor-grabbing ${
        active
          ? "border-lime-400 bg-neutral-950 text-white shadow-[0_0_22px_rgba(163,230,53,0.2)]"
          : connected
          ? "border-lime-400/70 bg-neutral-950 text-white shadow-[0_0_14px_rgba(163,230,53,0.12)]"
          : related
          ? "border-sky-400/70 bg-neutral-950 text-white shadow-[0_0_14px_rgba(56,189,248,0.12)]"
          : "border-white/20 bg-neutral-900 text-neutral-300 hover:border-lime-400/50 hover:text-white"
      }`}
      style={{
        left: node.x,
        top: node.y,
        touchAction: "none",
      }}
    >
      {node.label}
    </button>
  );
}

function EdgePath({ edge, active }) {
  const from = edge.fromNode;
  const to = edge.toNode;

  if (!from || !to) {
    return null;
  }

  const pathD = getEdgePathD(from, to);
  const labelPos = getEdgeLabelPosition(from, to);

  return (
    <g>
      <path
        d={pathD}
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
          textAnchor={labelPos.anchor ?? "middle"}
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

function ToolbarButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs text-neutral-300 shadow-lg transition hover:border-lime-400/40 hover:text-white"
    >
      {children}
    </button>
  );
}

export default function GraphCanvas({ onSelect }) {
  const graph = useMemo(() => normalizeGraph(buildGraph()), []);

  const [savedPositions, setSavedPositions] = useState(() =>
    loadSavedPositions()
  );

  const layout = useMemo(
    () =>
      getLayout({
        nodes: graph.nodes,
        edges: graph.edges,
        savedPositions,
      }),
    [graph, savedPositions]
  );

  const [focus, setFocus] = useState(INITIAL_FOCUS_ID);

  const focusNode = useMemo(
    () => layout.nodes.find((node) => node.id === focus) ?? null,
    [focus, layout.nodes]
  );

  const connectedNodeIds = useMemo(
    () => getAdjacentNodeIds(focus, layout.edges),
    [focus, layout.edges]
  );

  const relatedNodeIds = useMemo(
    () => getRelatedNodeIds(focusNode),
    [focusNode]
  );

  const selectNode = (id) => {
    const selectedNode = layout.nodes.find((node) => node.id === id);

    if (!selectedNode) {
      return;
    }

    setFocus(id);
    onSelect?.(selectedNode);
  };

  const moveNode = (id, position) => {
    setSavedPositions((prev) => {
      const next = {
        ...prev,
        [id]: position,
      };

      savePositionsToStorage(next);

      return next;
    });
  };

  const resetSavedPositions = () => {
    setSavedPositions({});
    savePositionsToStorage({});
  };

  const copyPositionsJson = async () => {
    const json = JSON.stringify(savedPositions, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      console.log("Copied graph positions:", json);
    } catch {
      console.log("Graph positions:", json);
    }
  };

  const exportPositionsJson = () => {
    const json = JSON.stringify(savedPositions, null, 2);
    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "gpu-graph-node-positions.json";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const isEdgeActive = (edge) => {
    return edge.from === focus || edge.to === focus;
  };

  return (
    <div className="relative h-[calc(100vh-150px)] min-h-[620px] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-black">
      <div className="absolute right-4 top-4 z-30 flex gap-2">
        <ToolbarButton onClick={copyPositionsJson}>
          copy positions
        </ToolbarButton>

        <ToolbarButton onClick={exportPositionsJson}>
          export json
        </ToolbarButton>

        <ToolbarButton onClick={resetSavedPositions}>
          reset layout
        </ToolbarButton>
      </div>

      <div className="graph-scroll scrollbar-hidden h-full w-full overflow-auto">
        <div
          className="relative"
          style={{
            width: layout.width,
            height: layout.height,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
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
              connected={connectedNodeIds.has(node.id)}
              related={relatedNodeIds.has(node.id)}
              onClick={selectNode}
              onMove={moveNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}