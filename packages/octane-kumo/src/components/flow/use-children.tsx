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

// ============================================================================
// Types
// ============================================================================
export type DescendantInfo<T = Record<string, unknown>> = {
  id: string;
  props: T;
  renderOrder: number;
};

type DescendantsContextType<DescendantType = Record<string, unknown>> = {
  containerRef: { current: HTMLElement | null };
  register: (
    id: string,
    renderOrder: number,
    props?: DescendantType,
  ) => { unregister: () => void };
  descendants: DescendantInfo<DescendantType>[];
  claimRenderOrder: (id: string) => number;
};

// ============================================================================
// Context
// ============================================================================

const DescendantsContext = createContext<DescendantsContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useDescendants<
  DescendantType extends Record<string, unknown>,
>(): DescendantsContextType<DescendantType> {
  const [registeredDescendants, setRegisteredDescendants] = useState<
    DescendantInfo<DescendantType>[]
  >([]);
  const descendantsRef = useRef<Map<string, DescendantInfo<DescendantType>>>(
    new Map(),
  );
  const containerRef = useRef<HTMLElement | null>(null);
  const publish = useCallback(() => {
    const order = new Map(
      Array.from(
        containerRef.current?.querySelectorAll("[data-flow-id]") ?? [],
      ).map((element, index) => [element.getAttribute("data-flow-id"), index]),
    );
    const sorted = Array.from(descendantsRef.current.values())
      .sort(
        (a, b) =>
          (order.get(a.id) ?? a.renderOrder) -
          (order.get(b.id) ?? b.renderOrder),
      )
      .map((entry, index) => ({ ...entry, renderOrder: index }));
    setRegisteredDescendants((previous) =>
      JSON.stringify(previous) === JSON.stringify(sorted) ? previous : sorted,
    );
  }, []);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Octane may move keyed children without re-running their component body.
    // DOM order, rather than render invocation order, is authoritative.
    const observer = new MutationObserver(publish);
    observer.observe(container, { childList: true, subtree: true });
    publish();
    return () => observer.disconnect();
  }, [publish]);

  // Track render order — resets each render cycle
  const renderOrderCounterRef = useRef(0);
  const renderOrderMapRef = useRef<Map<string, number>>(new Map());

  // Reset counter at the start of each render cycle
  renderOrderCounterRef.current = 0;
  renderOrderMapRef.current.clear();

  const claimRenderOrder = useCallback((id: string): number => {
    if (!renderOrderMapRef.current.has(id)) {
      renderOrderMapRef.current.set(id, renderOrderCounterRef.current++);
    }
    return renderOrderMapRef.current.get(id) as number;
  }, []);

  const register = useCallback(
    (
      id: string,
      renderOrder: number,
      props: DescendantType = {} as DescendantType,
    ) => {
      const descendantInfo: DescendantInfo<DescendantType> = {
        id,
        props,
        renderOrder,
      };
      descendantsRef.current.set(id, descendantInfo);

      publish();

      const unregister = () => {
        descendantsRef.current.delete(id);
        publish();
      };

      return { unregister };
    },
    [publish],
  );

  const contextValue: DescendantsContextType<DescendantType> = useMemo(
    () => ({
      containerRef,
      register,
      descendants: registeredDescendants,
      claimRenderOrder,
    }),
    [register, registeredDescendants, claimRenderOrder],
  );

  return contextValue;
}

// ============================================================================
// Provider Component
// ============================================================================

type DescendantsProviderProps<T extends Record<string, unknown>> = {
  value: DescendantsContextType<T>;
  children: OctaneNode;
};

export function DescendantsProvider<T extends Record<string, unknown>>({
  value,
  children,
}: DescendantsProviderProps<T>) {
  return (
    <DescendantsContext.Provider
      value={value as unknown as DescendantsContextType}
    >
      {children}
    </DescendantsContext.Provider>
  );
}

// ============================================================================
// Context Hooks
// ============================================================================

export function useDescendantsContext<
  T extends Record<string, unknown>,
>(): DescendantsContextType<T> {
  const context = useContext(DescendantsContext);

  if (!context) {
    throw new Error(
      "useDescendantsContext must be used within DescendantsProvider",
    );
  }

  return context as DescendantsContextType<T>;
}

export function useOptionalDescendantsContext<
  T extends Record<string, unknown>,
>(): DescendantsContextType<T> | null {
  const context = useContext(DescendantsContext);
  return context as DescendantsContextType<T> | null;
}

// ============================================================================
// Descendant Index Hook
// ============================================================================

export function useDescendantIndex<T extends Record<string, unknown>>(
  props?: T,
  customId?: string,
) {
  const context = useDescendantsContext<T>();
  const generatedId = useId();
  const id = customId ?? generatedId;

  const renderOrder = context.claimRenderOrder(id);

  // Keep mutable refs so the mount/unmount effect always has current values
  // without needing to re-run (which would cause the unregister/re-register
  // cycle that triggers infinite parent re-renders).
  const registerRef = useRef(context.register);
  registerRef.current = context.register;
  const propsRef = useRef(props);
  propsRef.current = props;
  const renderOrderRef = useRef(renderOrder);
  renderOrderRef.current = renderOrder;

  // Mount: register. Unmount: unregister. Never runs again for the same id.
  useEffect(() => {
    const { unregister } = registerRef.current(
      id,
      renderOrderRef.current,
      propsRef.current,
    );
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const propsKey = JSON.stringify(props);
  // Keep structural changes without an unregister/register cycle.
  useEffect(() => {
    registerRef.current(id, renderOrder, propsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, renderOrder, propsKey]);

  const index = useMemo(() => {
    return context.descendants.findIndex((descendant) => descendant.id === id);
  }, [context.descendants, id]);

  return { index, id };
}
