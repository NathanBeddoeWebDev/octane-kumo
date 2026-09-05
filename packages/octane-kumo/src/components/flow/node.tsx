/** @jsxImportSource octane */
import { useRender } from "@octanejs/base-ui/use-render";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import { useFlowStateContext, useNode, type NodeData } from "./diagram";

type AnchorType = "start" | "end" | "both";
type NativeRef = JSX.IntrinsicElements["li"]["ref"];

export type FlowNodeProps = {
  id?: string;
  render?:
    | ElementDescriptor
    | ((
        props: JSX.IntrinsicElements["li"],
        state: Record<string, never>,
      ) => ElementDescriptor);
  children?: OctaneNode;
  disabled?: boolean;
  ref?: NativeRef;
};

type AnchorContext = {
  registerAnchor: (
    type: AnchorType,
    element: HTMLElement | null,
  ) => (() => void) | undefined;
};
const FlowNodeAnchorContext = createContext<AnchorContext | null>(null);

function FlowNodeComponent({
  id: requestedId,
  render,
  children,
  disabled = false,
  ref,
}: FlowNodeProps) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const nodeProps = useMemo((): NodeData => ({ kind: "node" }), []);
  const { index, id } = useNode(nodeProps, requestedId);
  const { reportNode, removeNode, nodePositions } = useFlowStateContext();
  const startOffset = useRef<number | undefined>(undefined);
  const endOffset = useRef<number | undefined>(undefined);

  const reportSize = useCallback(() => {
    if (!nodeRef.current) return;
    const { width, height } = nodeRef.current.getBoundingClientRect();
    reportNode(id, {
      width,
      height,
      disabled,
      startAnchorOffset: startOffset.current,
      endAnchorOffset: endOffset.current,
    });
  }, [reportNode, id, disabled]);

  useLayoutEffect(() => {
    const element = nodeRef.current;
    if (!element) return;
    reportSize();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(reportSize);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      removeNode(id);
    };
  }, [reportSize, removeNode, id]);

  const registerAnchor = useCallback(
    (type: AnchorType, element: HTMLElement | null) => {
      const write = (offset: number | undefined) => {
        if (type === "start" || type === "both") startOffset.current = offset;
        if (type === "end" || type === "both") endOffset.current = offset;
      };
      if (!element) {
        write(undefined);
        reportSize();
        return;
      }
      const measure = () => {
        if (!nodeRef.current) return;
        const anchor = element.getBoundingClientRect();
        const node = nodeRef.current.getBoundingClientRect();
        write(anchor.top - node.top + anchor.height / 2);
        reportSize();
      };
      measure();
      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(measure);
      observer?.observe(element);
      return () => observer?.disconnect();
    },
    [reportSize],
  );

  const position = nodePositions[id];
  const anchorContext = useMemo(() => ({ registerAnchor }), [registerAnchor]);
  const element = useRender({
    defaultTagName: "li",
    render,
    ref: [nodeRef, ref],
    props: [
      {
        className: cn(
          !render &&
            "absolute cursor-default rounded-md bg-kumo-base px-3 py-2 shadow ring ring-kumo-line",
        ),
        style: position
          ? {
              position: "absolute",
              top: position.y,
              left: position.x,
              cursor: "default",
            }
          : { opacity: 0 },
        "data-node-index": index,
        "data-node-id": id,
        "data-flow-id": id,
        "data-testid": id,
        "aria-hidden": position ? undefined : "true",
      },
      { children },
    ],
  });
  return (
    <FlowNodeAnchorContext.Provider value={anchorContext}>
      {element}
    </FlowNodeAnchorContext.Provider>
  );
}

export const FlowNode = Object.assign(FlowNodeComponent, {
  displayName: "Flow.Node",
});

export type FlowAnchorProps = {
  type?: "start" | "end";
  render?:
    | ElementDescriptor
    | ((
        props: JSX.IntrinsicElements["div"],
        state: Record<string, never>,
      ) => ElementDescriptor);
  children?: OctaneNode;
  ref?: JSX.IntrinsicElements["div"]["ref"];
};

function FlowAnchorComponent({ type, render, children, ref }: FlowAnchorProps) {
  const context = useContext(FlowNodeAnchorContext);
  if (!context) throw new Error("Flow.Anchor must be used within Flow.Node");
  const anchorRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const cleanup = context.registerAnchor(type ?? "both", anchorRef.current);
    return () => {
      cleanup?.();
      context.registerAnchor(type ?? "both", null);
    };
  }, [context, type]);
  return useRender({
    defaultTagName: "div",
    render,
    ref: [anchorRef, ref],
    props: [{ children }],
  });
}

export const FlowAnchor = Object.assign(FlowAnchorComponent, {
  displayName: "Flow.Anchor",
});
