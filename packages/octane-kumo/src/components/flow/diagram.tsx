/** @jsxImportSource octane */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type OctaneNode,
} from "octane";
import { cn } from "../../utils/cn";
import { FlowConnectors } from "./connectors";
import {
  DescendantsProvider,
  useDescendantIndex,
  useDescendants,
  useOptionalDescendantsContext,
  type DescendantInfo,
} from "./use-children";
import {
  computeEdges,
  computePositions,
  computeDiagramRect,
  type FlowAlign,
  type FlowOrientation,
  type FlowState,
  type TreeNode,
} from "./flow-layout";

export type { FlowAlign, FlowOrientation, FlowState, TreeNode };

const DEFAULT_PADDING = {
  y: 64,
  x: 16,
};

type Orientation = FlowOrientation;

function isEventFromNode(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-node-id]") !== null;
}

/** Minimum scrollbar thumb size in percentage to ensure visibility */
const MIN_SCROLLBAR_THUMB_SIZE = 10;

export interface FlowDiagramProps {
  /**
   * Flow direction.
   * - `"horizontal"`: Nodes progress left-to-right (default)
   * - `"vertical"`: Nodes progress top-to-bottom
   */
  orientation?: Orientation;
  /**
   * Whether to render the pannable canvas wrapper.
   * - `true`: Renders with pannable canvas, scrollbars, and pan gestures (default)
   * - `false`: Renders only the node list without canvas wrapper
   */
  canvas?: boolean;
  /**
   * Cross-axis alignment of nodes.
   * - `"start"`: Nodes align to the top/left edge (default)
   * - `"center"`: Nodes are centered across the inactive axis
   */
  align?: FlowAlign;
  /**
   * Padding around the diagram content within the canvas.
   * - `x`: Horizontal padding in pixels (default: 16)
   * - `y`: Vertical padding in pixels (default: 64)
   */
  padding?: { x?: number; y?: number };
  /**
   * Callback fired when the overflow state changes.
   * Called with `{ x: boolean, y: boolean }` indicating overflow in each axis.
   */
  onOverflowChange?: (overflow: { x: boolean; y: boolean }) => void;
  className?: string;
  children?: OctaneNode;
}

export function FlowDiagram({
  orientation = "horizontal",
  canvas = true,
  align = "start",
  padding: requestedPadding,
  onOverflowChange,
  className,
  children,
}: FlowDiagramProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const padding = {
    x: requestedPadding?.x ?? DEFAULT_PADDING.x,
    y: requestedPadding?.y ?? DEFAULT_PADDING.y,
  };

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [bounds, setBounds] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{
    viewportWidth: number;
    viewportHeight: number;
    contentWidth: number;
    contentHeight: number;
  } | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [canPan, setCanPan] = useState(false);

  const [nodes, setNodes] = useState<FlowState["nodes"]>({});
  const [rootDescendants, setRootDescendants] = useState<
    DescendantInfo<NodeData>[]
  >([]);
  // Maps each list/parallel node's id to its own immediate descendants,
  // populated by reportDescendants calls from nested FlowNodeList and
  // FlowParallelNode components.
  const [childrenByParent, setChildrenByParent] = useState<
    Map<string, DescendantInfo<NodeData>[]>
  >(new Map());

  const reportNode = useCallback(
    (
      id: string,
      props: {
        width: number;
        height: number;
        disabled?: boolean;
        startAnchorOffset?: number;
        endAnchorOffset?: number;
      },
    ) => {
      setNodes((prev) => {
        const existing = prev[id];
        if (
          existing?.width === props.width &&
          existing?.height === props.height &&
          existing?.disabled === props.disabled &&
          existing?.startAnchorOffset === props.startAnchorOffset &&
          existing?.endAnchorOffset === props.endAnchorOffset
        )
          return prev;
        return { ...prev, [id]: props };
      });
    },
    [],
  );

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const reportDescendants = useCallback(
    (id: string | null, descendants: DescendantInfo<NodeData>[]) => {
      if (id === null) {
        setRootDescendants((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(descendants)) return prev;
          return descendants;
        });
      } else {
        setChildrenByParent((prev) => {
          const existing = prev.get(id);
          if (JSON.stringify(existing) === JSON.stringify(descendants))
            return prev;
          const next = new Map(prev);
          next.set(id, descendants);
          return next;
        });
      }
    },
    [],
  );

  // Derive the tree from root descendants synchronously — never stored in state.
  const tree = descendantsToTree(rootDescendants, childrenByParent);
  const flowState: FlowState = { nodes, tree, align, orientation };

  // Derive edges, positions, and diagram size synchronously — never stored in state.
  const edges = computeEdges(flowState);
  const nodePositions = computePositions(flowState);
  const diagramRect = computeDiagramRect(nodePositions, flowState);

  const flowStateContextValue = useMemo(
    () => ({
      reportNode,
      removeNode,
      reportDescendants,
      orientation,
      nodePositions,
      edges,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      reportNode,
      removeNode,
      reportDescendants,
      orientation,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(nodePositions),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(edges),
    ],
  );

  useEffect(() => {
    if (!canvas) return;
    if (!wrapperRef.current || !contentRef.current) return;

    const measureBounds = () => {
      if (!wrapperRef.current || !contentRef.current) return;

      const wrapper = wrapperRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();

      const availableWidth = wrapper.width - padding.x * 2;
      const availableHeight = wrapper.height - padding.y * 2;

      setBounds({
        x: Math.min(0, availableWidth - content.width),
        y: Math.min(0, availableHeight - content.height),
      });

      setDimensions({
        viewportWidth: availableWidth,
        viewportHeight: availableHeight,
        contentWidth: content.width,
        contentHeight: content.height,
      });

      const isXOverflow = content.width > availableWidth;
      const isYOverflow = content.height > availableHeight;

      setCanPan(isXOverflow || isYOverflow);
      onOverflowChange?.({ x: isXOverflow, y: isYOverflow });
    };

    measureBounds();

    const resizeObserver = new ResizeObserver(measureBounds);
    resizeObserver.observe(wrapperRef.current);
    resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, [padding.x, padding.y, canvas, onOverflowChange]);

  useEffect(() => {
    if (!canvas) return;
    if (!bounds) return;

    /**
     * It's possible for the content to resize after the user panned. If we're
     * at the edge of the pan and the content gets smaller, then we've "panned
     * too far". In this case, we transition the pan back to the new bounds.
     */
    if (panRef.current.x < bounds.x) {
      setPan((value) => ({ ...value, x: bounds.x }));
    }
    if (panRef.current.y < bounds.y) {
      setPan((value) => ({ ...value, y: bounds.y }));
    }
  }, [bounds, canvas]);

  // Handle wheel/scroll events for panning
  useEffect(() => {
    if (!canvas) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      if (!bounds) return;

      const canScrollX = bounds.x < 0;
      const canScrollY = bounds.y < 0;

      if (!canScrollX && !canScrollY) return;

      e.preventDefault();

      if (canScrollY) {
        const newY = Math.max(
          bounds.y,
          Math.min(0, panRef.current.y - e.deltaY),
        );
        setPan((value) => ({ ...value, y: newY }));
      }

      if (canScrollX) {
        const newX = Math.max(
          bounds.x,
          Math.min(0, panRef.current.x - e.deltaX),
        );
        setPan((value) => ({ ...value, x: newX }));
      }
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [canvas, bounds]);

  const handlePointerDown = (event: PointerEvent) => {
    if (
      !canvas ||
      !canPan ||
      event.button !== 0 ||
      isEventFromNode(event.target)
    )
      return;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    setIsPanning(true);
  };
  const handlePointerMove = (event: PointerEvent) => {
    const previous = pointer.current;
    if (!previous || previous.id !== event.pointerId || !bounds) return;
    const x = Math.max(
      bounds.x,
      Math.min(0, panRef.current.x + event.clientX - previous.x),
    );
    const y = Math.max(
      bounds.y,
      Math.min(0, panRef.current.y + event.clientY - previous.y),
    );
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setPan({ x, y });
  };
  const handlePointerUp = () => {
    pointer.current = null;
    setIsPanning(false);
  };

  // Calculate scrollbar dimensions
  const canScrollX = bounds && bounds.x < 0;
  const canScrollY = bounds && bounds.y < 0;

  const scrollThumbWidth =
    dimensions && dimensions.contentWidth > 0 && dimensions.viewportWidth > 0
      ? Math.max(
          MIN_SCROLLBAR_THUMB_SIZE,
          (dimensions.viewportWidth / dimensions.contentWidth) * 100,
        )
      : 0;
  const scrollThumbHeight =
    dimensions && dimensions.contentHeight > 0 && dimensions.viewportHeight > 0
      ? Math.max(
          MIN_SCROLLBAR_THUMB_SIZE,
          (dimensions.viewportHeight / dimensions.contentHeight) * 100,
        )
      : 0;

  // Transform pan position to scrollbar thumb position (as percentage).
  const scrollLeft = bounds?.x
    ? `${(-pan.x / -bounds.x) * (100 - scrollThumbWidth)}%`
    : "0%";
  const scrollTop = bounds?.y
    ? `${(-pan.y / -bounds.y) * (100 - scrollThumbHeight)}%`
    : "0%";

  return (
    <FlowStateContext.Provider value={flowStateContextValue}>
      <div
        ref={wrapperRef}
        className={cn(
          "group relative isolate min-w-0 grow overflow-hidden",
          className,
        )}
        style={{
          paddingTop: padding.y,
          paddingBottom: padding.y,
          paddingLeft: padding.x,
          paddingRight: padding.x,
          cursor:
            canvas && canPan ? (isPanning ? "grabbing" : "grab") : undefined,
          userSelect: isPanning ? "none" : undefined,
          touchAction: canvas && canPan ? "none" : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div
          data-testid="flow-contents"
          ref={contentRef}
          className={cn("relative mx-auto")}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            width: diagramRect.width || undefined,
            height: diagramRect.height || undefined,
          }}
        >
          <FlowNodeList>{children}</FlowNodeList>
          <div className={cn("pointer-events-none absolute inset-0")}>
            <FlowConnectors
              edges={edges}
              nodePositions={nodePositions}
              nodes={flowState.nodes}
              orientation={orientation}
            />
          </div>
        </div>

        {/* Vertical scrollbar */}
        {canScrollY && (
          <div
            className={cn(
              "absolute top-1 right-1 bottom-1 w-1.5 rounded-full bg-kumo-hairline/50 opacity-0 group-hover:opacity-100",
            )}
          >
            <div
              className={cn("absolute w-full rounded-full bg-kumo-fill")}
              style={{
                height: `${scrollThumbHeight}%`,
                top: scrollTop,
              }}
            />
          </div>
        )}

        {/* Horizontal scrollbar */}
        {canScrollX && (
          <div
            className={cn(
              "absolute right-1 bottom-1 left-1 h-1.5 rounded-full bg-kumo-hairline/50 opacity-0 group-hover:opacity-100",
            )}
          >
            <div
              className={cn("absolute h-full rounded-full bg-kumo-fill")}
              style={{
                width: `${scrollThumbWidth}%`,
                left: scrollLeft,
              }}
            />
          </div>
        )}
      </div>
    </FlowStateContext.Provider>
  );
}

export type NodeData =
  | { kind: "node"; disabled?: boolean }
  | { kind: "parallel"; disabled?: boolean; children: string[]; align?: "end" }
  | { kind: "list"; disabled?: boolean; children: string[] };

// ============================================================================
// FlowState context
// ============================================================================

type FlowStateContextValue = {
  reportNode: (
    id: string,
    props: {
      width: number;
      height: number;
      disabled?: boolean;
      startAnchorOffset?: number;
      endAnchorOffset?: number;
    },
  ) => void;
  removeNode: (id: string) => void;
  /**
   * Report immediate descendants from a list/parallel node.
   * Pass `null` as `id` for the root FlowNodeList.
   */
  reportDescendants: (
    id: string | null,
    descendants: DescendantInfo<NodeData>[],
  ) => void;
  orientation: Orientation;
  /** Derived node positions (computed synchronously from FlowState). */
  nodePositions: Record<string, { x: number; y: number }>;
  /** Derived edges (computed synchronously from FlowState). */
  edges: [string, string][];
};

const FlowStateContext = createContext<FlowStateContextValue | null>(null);

export function useFlowStateContext(): FlowStateContextValue {
  const context = useContext(FlowStateContext);
  if (context === null) {
    throw new Error("useFlowStateContext must be used within a FlowDiagram");
  }
  return context;
}

export const useNodeGroup = () => useDescendants<NodeData>();

export const useNode = (props: NodeData, id?: string) =>
  useDescendantIndex<NodeData>(props, id);

/**
 * Hook to optionally register as a node if within a parent descendants context.
 * Returns registration info if registered, or null if no parent context exists.
 */
export const useOptionalNode = (props: NodeData) => {
  const parentContext = useOptionalDescendantsContext<NodeData>();
  const id = useId();

  const renderOrder = parentContext?.claimRenderOrder(id) ?? -1;

  // Keep mutable refs so the mount/unmount effect always has current values.
  const registerRef = useRef(parentContext?.register);
  registerRef.current = parentContext?.register;
  const propsRef = useRef(props);
  propsRef.current = props;
  const renderOrderRef = useRef(renderOrder);
  renderOrderRef.current = renderOrder;

  // Mount: register once. Unmount: unregister.
  useEffect(() => {
    if (!registerRef.current) return;
    const { unregister } = registerRef.current(
      id,
      renderOrderRef.current,
      propsRef.current,
    );
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const propsKey = JSON.stringify(props);
  // Compare structural values, not object identity, without removing the node.
  useEffect(() => {
    if (!registerRef.current) return;
    registerRef.current(id, renderOrder, propsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, renderOrder, propsKey]);

  if (!parentContext) return null;

  const index = parentContext.descendants.findIndex((d) => d.id === id);
  return { index, id };
};

/**
 * Recursively build a TreeNode from a flat list of registered descendants.
 *
 * Each descendant only carries `kind` and `children` (IDs of its own
 * immediate children). The full tree is reconstructed bottom-up using the
 * descendants maps that each list/parallel node maintains locally.
 */
function descendantsToTree(
  descendants: DescendantInfo<NodeData>[],
  childrenByParent: Map<string, DescendantInfo<NodeData>[]> = new Map(),
): TreeNode {
  return {
    kind: "list",
    children: descendants.map((d) => descendantToTreeNode(d, childrenByParent)),
  };
}

function descendantToTreeNode(
  d: DescendantInfo<NodeData>,
  childrenByParent: Map<string, DescendantInfo<NodeData>[]>,
): TreeNode {
  if (d.props.kind === "node") return { kind: "node", id: d.id };
  const ownDescendants = childrenByParent.get(d.id) ?? [];
  const children = ownDescendants.map((child) =>
    descendantToTreeNode(child, childrenByParent),
  );
  if (d.props.kind === "parallel") {
    return { kind: "parallel", children, align: d.props.align };
  }
  return { kind: "list", children };
}

export function FlowNodeList({ children }: { children: OctaneNode }) {
  const descendants = useNodeGroup();
  const { reportDescendants, orientation } = useFlowStateContext();

  // Only structural info (kind, id, children) is keyed — not DOM rects —
  // to avoid re-computing on every measurement update.
  const structuralKey = JSON.stringify(
    descendants.descendants.map((d) => ({
      id: d.id,
      kind: d.props.kind,
      children: d.props.kind !== "node" ? d.props.children : undefined,
      align: d.props.kind === "parallel" ? d.props.align : undefined,
    })),
  );

  const nodeProps = useMemo(
    () => ({
      kind: "list" as const,
      children: descendants.descendants.map((d) => d.id),
      disabled: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structuralKey],
  );

  // Register with parent context if nested (e.g., inside Flow.Parallel).
  // Returns null when this is the root FlowNodeList (no parent context).
  const registration = useOptionalNode(nodeProps);

  // Report our immediate descendants upward so FlowDiagram can reconstruct
  // the full tree. Root list uses null as id; nested lists use their own id.
  useEffect(() => {
    reportDescendants(registration?.id ?? null, descendants.descendants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structuralKey, reportDescendants, registration?.id]);

  return (
    <DescendantsProvider value={descendants}>
      <ul
        ref={(element) => {
          descendants.containerRef.current = element;
        }}
        data-flow-id={registration?.id}
        className={cn(
          "ml-0 list-none",
          orientation === "vertical" && "flex flex-col",
        )}
      >
        {children}
      </ul>
    </DescendantsProvider>
  );
}
