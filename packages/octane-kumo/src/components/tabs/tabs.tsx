/** @jsxImportSource octane */
import { useRender } from "@octanejs/base-ui/use-render";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";

export const KUMO_TABS_VARIANTS = {
  variant: ["segmented", "underline"],
  size: ["base", "sm"],
} as const;

export const KUMO_TABS_DEFAULT_VARIANTS = {
  variant: "segmented",
  size: "base",
} as const;

export const KUMO_TABS_STYLING = {
  container: {
    height: 34,
    borderRadius: 8,
    background: "color-accent",
    padding: 1,
  },
  tab: {
    paddingX: 10,
    verticalMargin: 1,
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 8,
    activeColor: "text-color-surface",
    inactiveColor: "text-color-label",
  },
  indicator: {
    background: "color-surface-secondary",
    ring: "color-color-2",
    borderRadius: 6,
    shadow: "shadow-sm",
  },
} as const;

export interface TabsLabels {
  scrollEnd?: string;
  scrollStart?: string;
}

const DEFAULT_LABELS: Required<TabsLabels> = {
  scrollStart: "Scroll tabs left",
  scrollEnd: "Scroll tabs right",
};

export interface KumoTabsVariantsProps {
  size?: (typeof KUMO_TABS_VARIANTS.size)[number];
  variant?: (typeof KUMO_TABS_VARIANTS.variant)[number];
}

export interface TabsTabState {
  active: boolean;
  disabled: boolean;
  orientation: "horizontal" | "vertical";
  tabActivationDirection: "left" | "right" | "up" | "down" | "none";
}

export type TabsItem = {
  className?: string;
  label: OctaneNode;
  nativeButton?: boolean;
  render?:
    | ElementDescriptor
    | ((
        props: JSX.IntrinsicElements["button"],
        state: TabsTabState,
      ) => ElementDescriptor);
  value: string;
};

export type TabsProps = KumoTabsVariantsProps & {
  activateOnFocus?: boolean;
  className?: string;
  indicatorClassName?: string;
  labels?: TabsLabels;
  listClassName?: string;
  onValueChange?: (value: string) => void;
  selectedValue?: string;
  tabs?: TabsItem[];
  value?: string;
};

export function Tabs({
  tabs,
  value,
  selectedValue,
  onValueChange,
  activateOnFocus,
  className,
  listClassName,
  indicatorClassName,
  labels: labelsProp,
  variant = KUMO_TABS_DEFAULT_VARIANTS.variant,
  size = KUMO_TABS_DEFAULT_VARIANTS.size,
}: TabsProps) {
  const items = tabs ?? [];

  if (items.length === 0) {
    return null;
  }

  const fallbackValue = items[0]?.value;
  const isControlled = value !== undefined;
  const isSegmented = variant === "segmented";
  const isUnderline = variant === "underline";
  const isSm = size === "sm";
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const overflowWatchKey = items.map((item) => item.value).join("|");
  const [uncontrolledValue, setUncontrolledValue] = useState(
    selectedValue ?? fallbackValue,
  );
  const activeValue = isControlled ? value : uncontrolledValue;
  const [highlightedValue, setHighlightedValue] = useState(
    items.some((item) => item.value === activeValue)
      ? activeValue
      : fallbackValue,
  );
  const [activationDirection, setActivationDirection] =
    useState<TabsTabState["tabActivationDirection"]>("none");
  const {
    ref: listRef,
    isOverflowing,
    canScrollStart,
    canScrollEnd,
  } = useOverflowDetect(true, overflowWatchKey);
  const dragHandlers = useHorizontalDragScroll(listRef, isOverflowing);

  useLayoutEffect(() => {
    setHighlightedValue(
      items.some((item) => item.value === activeValue)
        ? activeValue
        : fallbackValue,
    );
  }, [activeValue, fallbackValue, overflowWatchKey]);

  function selectTab(
    nextValue: string,
    direction?: TabsTabState["tabActivationDirection"],
  ) {
    if (nextValue === activeValue) return;

    if (direction) {
      setActivationDirection(direction);
    } else {
      const currentIndex = items.findIndex(
        (item) => item.value === activeValue,
      );
      const nextIndex = items.findIndex((item) => item.value === nextValue);
      setActivationDirection(
        currentIndex < 0 || nextIndex === currentIndex
          ? "none"
          : nextIndex > currentIndex
            ? "right"
            : "left",
      );
    }
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function moveFocus(
    currentTab: HTMLElement,
    key: "ArrowLeft" | "ArrowRight" | "End" | "Home",
  ) {
    const tabElements = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>(
        '[data-kumo-part="tab"]',
      ) ?? [],
    );
    if (tabElements.length === 0) return;

    const currentIndex = tabElements.indexOf(currentTab);
    const direction = key === "ArrowLeft" || key === "Home" ? "left" : "right";
    const nextIndex =
      key === "Home"
        ? 0
        : key === "End"
          ? tabElements.length - 1
          : (currentIndex +
              (key === "ArrowLeft" ? -1 : 1) +
              tabElements.length) %
            tabElements.length;
    const nextTab = tabElements[nextIndex];
    const nextValue = items[nextIndex]?.value;
    if (!nextTab || nextValue === undefined) return;

    setHighlightedValue(nextValue);
    nextTab.focus();
    if (activateOnFocus) {
      selectTab(nextValue, direction);
    }
  }

  return (
    <div
      data-kumo-component="Tabs"
      data-kumo-part="root"
      data-orientation="horizontal"
      data-tab-activation-direction={activationDirection}
      className={cn(
        "relative isolate min-w-0 font-medium",
        isSegmented &&
          cn(isSm ? "rounded-md" : "rounded-lg", "ring ring-kumo-hairline/70"),
        className,
      )}
    >
      {isSegmented ? (
        <div
          className={cn(
            "absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-lg bg-kumo-recessed",
            isSm ? "h-6.5" : "h-9",
          )}
        />
      ) : null}
      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        data-orientation="horizontal"
        data-overflowing={isOverflowing ? "" : undefined}
        data-overflow-start={canScrollStart ? "" : undefined}
        data-overflow-end={canScrollEnd ? "" : undefined}
        {...dragHandlers}
        className={cn(
          "kumo-tabs-list relative flex min-w-0 shrink scroll-px-(--scroll-fade-width) items-stretch overflow-x-auto overflow-y-hidden [--scroll-fade-width:3rem]",
          isSegmented && "rounded-lg bg-kumo-recessed px-0.5",
          isSegmented && (isSm ? "h-6.5 rounded-md" : "h-9"),
          isOverflowing && "cursor-grab active:cursor-grabbing",
          isUnderline && "gap-4 border-b border-kumo-hairline pb-2",
          isUnderline && (isSm ? "h-6.5" : "h-7.5"),
          listClassName,
        )}
      >
        {items.map((tab) => {
          const active = tab.value === activeValue;
          return (
            <TabsTrigger
              key={tab.value}
              active={active}
              activationDirection={activationDirection}
              highlighted={tab.value === highlightedValue}
              item={tab}
              onFocus={() => setHighlightedValue(tab.value)}
              onMoveFocus={moveFocus}
              onSelect={() => selectTab(tab.value)}
              className={cn(
                "relative z-2 flex items-center rounded bg-transparent whitespace-nowrap focus:ring-kumo-focus/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand",
                isOverflowing
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-pointer",
                isSm ? "text-xs" : "text-base",
                isSegmented &&
                  "my-0.5 text-kumo-subtle hover:text-kumo-default focus-visible:ring-inset aria-selected:text-kumo-default",
                isSegmented && (isSm ? "rounded-sm px-2" : "rounded-md px-2.5"),
                isUnderline &&
                  "text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default aria-selected:font-medium aria-selected:text-kumo-default aria-selected:hover:bg-kumo-tint",
                isUnderline && (isSm ? "px-1.5 py-2.5" : "px-2 py-3"),
                tab.className,
              )}
            />
          );
        })}
        <TabsIndicator
          className={indicatorClassName}
          listRef={listRef}
          segmented={isSegmented}
          small={isSm}
        />
      </div>
      {isSegmented ? (
        <>
          <TabsOverflowControl
            side="start"
            visible={canScrollStart}
            variant={variant}
            size={size}
            label={labels.scrollStart}
            onClick={() => scrollTabs(listRef, "start")}
          />
          <TabsOverflowControl
            side="end"
            visible={canScrollEnd}
            variant={variant}
            size={size}
            label={labels.scrollEnd}
            onClick={() => scrollTabs(listRef, "end")}
          />
        </>
      ) : null}
    </div>
  );
}

function TabsTrigger({
  active,
  activationDirection,
  className,
  highlighted,
  item,
  onFocus,
  onMoveFocus,
  onSelect,
}: {
  active: boolean;
  activationDirection: TabsTabState["tabActivationDirection"];
  className: string;
  highlighted: boolean;
  item: TabsItem;
  onFocus: () => void;
  onMoveFocus: (
    currentTab: HTMLElement,
    key: "ArrowLeft" | "ArrowRight" | "End" | "Home",
  ) => void;
  onSelect: () => void;
}) {
  const state: TabsTabState = {
    active,
    disabled: false,
    orientation: "horizontal",
    tabActivationDirection: activationDirection,
  };

  return useRender({
    defaultTagName: "button",
    render: item.render,
    state,
    props: {
      "aria-selected": active,
      "data-active": active ? "" : undefined,
      "data-kumo-component": "Tabs",
      "data-kumo-part": "tab",
      "data-orientation": "horizontal",
      "data-tab-activation-direction": activationDirection,
      role: "tab",
      tabIndex: highlighted ? 0 : -1,
      type: item.nativeButton === false ? undefined : "button",
      className,
      children: item.label,
      onClick(event: MouseEvent) {
        onSelect();
        (event.currentTarget as HTMLElement).scrollIntoView?.({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      },
      onFocus,
      onKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          (event.currentTarget as HTMLElement).click();
          return;
        }
        if (
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "Home" &&
          event.key !== "End"
        ) {
          return;
        }
        event.preventDefault();
        onMoveFocus(event.currentTarget as HTMLElement, event.key);
      },
    },
  });
}

type ElementRef<T extends HTMLElement> = { current: T | null };
type IndicatorStyle = Exclude<
  JSX.IntrinsicElements["div"]["style"],
  string | undefined
> &
  Record<`--${string}`, string>;

const EMPTY_INDICATOR_STYLE: IndicatorStyle = {
  "--active-tab-height": "0px",
  "--active-tab-left": "0px",
  "--active-tab-top": "0px",
  "--active-tab-width": "0px",
};

function TabsIndicator({
  className,
  listRef,
  segmented,
  small,
}: {
  className?: string;
  listRef: ElementRef<HTMLDivElement>;
  segmented: boolean;
  small: boolean;
}) {
  const [state, setState] = useState({
    rendered: false,
    style: EMPTY_INDICATOR_STYLE,
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function measure() {
      const activeTab = list?.querySelector<HTMLElement>(
        '[data-kumo-part="tab"][aria-selected="true"]',
      );
      if (!list || !activeTab) return;

      const listRect = list.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const nextStyle: IndicatorStyle = {
        "--active-tab-height": `${tabRect.height}px`,
        "--active-tab-left": `${tabRect.left - listRect.left + list.scrollLeft}px`,
        "--active-tab-top": `${tabRect.top - listRect.top}px`,
        "--active-tab-width": `${tabRect.width}px`,
      };
      setState({ rendered: true, style: nextStyle });
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(list);
    for (const tab of list.querySelectorAll<HTMLElement>(
      '[data-kumo-part="tab"]',
    )) {
      resizeObserver.observe(tab);
    }
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(list, {
      attributeFilter: ["aria-selected"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [listRef]);

  return (
    <div
      aria-hidden="true"
      data-kumo-component="Tabs"
      data-kumo-part="indicator"
      data-rendered={state.rendered ? "true" : "false"}
      style={state.style}
      className={cn(
        "pointer-events-none absolute left-0 z-1",
        "w-(--active-tab-width) translate-x-(--active-tab-left) transition-all duration-200",
        "data-[rendered=false]:scale-90 data-[rendered=false]:opacity-0",
        segmented &&
          cn(
            "top-(--active-tab-top) h-(--active-tab-height) bg-kumo-base shadow-sm ring ring-kumo-line",
            small ? "rounded" : "rounded-md",
          ),
        !segmented && "bottom-0 h-0.5 bg-kumo-brand",
        className,
      )}
    />
  );
}

function TabsOverflowControl({
  side,
  visible,
  variant,
  size,
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
  side: "start" | "end";
  size: NonNullable<TabsProps["size"]>;
  variant: NonNullable<TabsProps["variant"]>;
  visible: boolean;
}) {
  const isStart = side === "start";
  const isSegmented = variant === "segmented";

  return (
    <button
      type="button"
      data-kumo-component="Tabs"
      data-kumo-part="overflow-control"
      data-side={side}
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
      className={cn(
        "absolute inset-y-0 z-3 flex items-center border-0 bg-transparent p-0 transition-opacity duration-150 focus:outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-kumo-brand",
        isStart
          ? "left-0 justify-start bg-linear-to-r"
          : "right-0 justify-end bg-linear-to-l",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        isSegmented
          ? "from-kumo-recessed via-kumo-recessed/95 to-transparent"
          : "from-kumo-base via-kumo-base/95 to-transparent",
        isSegmented && (size === "sm" ? "w-8 rounded-md" : "w-10 rounded-lg"),
        !isSegmented && "w-8",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center text-kumo-subtle transition-colors hover:text-kumo-default",
          size === "sm" ? "size-5" : "size-6",
          isSegmented
            ? size === "sm"
              ? "rounded-sm"
              : "rounded-md"
            : "rounded",
          isStart ? "ml-1" : "mr-1",
        )}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5")}
          aria-hidden="true"
        >
          <path
            d={
              isStart
                ? "M9.25 4.25L5.75 8L9.25 11.75"
                : "M6.75 4.25L10.25 8L6.75 11.75"
            }
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </span>
    </button>
  );
}

function scrollTabs(
  ref: ElementRef<HTMLDivElement>,
  direction: "start" | "end",
) {
  const element = ref.current;
  if (!element) return;

  const tabs = Array.from(
    element.querySelectorAll<HTMLElement>('[data-kumo-part="tab"]'),
  );
  const distance = getTabsScrollSize(element.clientWidth, tabs);

  element.scrollBy({
    left: direction === "start" ? -distance : distance,
    behavior: "smooth",
  });
}

function getTabsScrollSize(containerWidth: number, tabs: HTMLElement[]) {
  let totalWidth = 0;

  for (const tab of tabs) {
    const tabWidth = tab.offsetWidth;
    if (totalWidth + tabWidth > containerWidth) {
      return totalWidth || containerWidth;
    }
    totalWidth += tabWidth;
  }

  return Math.max(80, Math.floor(containerWidth * 0.8));
}

function useHorizontalDragScroll(
  ref: ElementRef<HTMLDivElement>,
  enabled: boolean,
) {
  const dragState = useRef<{
    dragging: boolean;
    pointerId: number;
    scrollLeft: number;
    startX: number;
  } | null>(null);
  const shouldSuppressClick = useRef(false);

  return {
    onPointerDownCapture(event: PointerEvent) {
      const element = ref.current;
      if (!element || !enabled) return;
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        scrollLeft: element.scrollLeft,
        dragging: false,
      };
      shouldSuppressClick.current = false;
    },
    onPointerMoveCapture(event: PointerEvent) {
      const element = ref.current;
      const state = dragState.current;
      if (
        !element ||
        !enabled ||
        !state ||
        state.pointerId !== event.pointerId
      ) {
        return;
      }

      const movementX = event.clientX - state.startX;
      if (!state.dragging) {
        if (Math.abs(movementX) <= 3) return;
        state.dragging = true;
        shouldSuppressClick.current = true;
        element.setPointerCapture(event.pointerId);
      }

      event.preventDefault();
      element.scrollLeft = state.scrollLeft - movementX;
    },
    onPointerUpCapture(event: PointerEvent) {
      const element = ref.current;
      const state = dragState.current;
      if (!element || !state || state.pointerId !== event.pointerId) return;

      dragState.current = null;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      if (shouldSuppressClick.current) {
        window.setTimeout(() => {
          shouldSuppressClick.current = false;
        }, 0);
      }
    },
    onPointerCancelCapture(event: PointerEvent) {
      const element = ref.current;
      const state = dragState.current;
      if (!element || !state || state.pointerId !== event.pointerId) return;

      dragState.current = null;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    },
    onClickCapture(event: MouseEvent) {
      if (!shouldSuppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      shouldSuppressClick.current = false;
    },
  };
}

function useOverflowDetect(enabled: boolean, watchKey: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [overflowState, setOverflowState] = useState({
    isOverflowing: false,
    canScrollStart: false,
    canScrollEnd: false,
  });

  useLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;
    setOverflowState((previousState) =>
      getNextOverflowState(element, previousState),
    );
  }, [enabled, watchKey]);

  useEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const check = () => {
      setOverflowState((previousState) =>
        getNextOverflowState(element, previousState),
      );
    };
    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(element);
    const mutationObserver = new MutationObserver(check);
    mutationObserver.observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    element.addEventListener("scroll", check, { passive: true });
    check();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener("scroll", check);
    };
  }, [enabled]);

  return { ref, ...overflowState };
}

function getNextOverflowState(
  element: HTMLElement,
  previousState: {
    canScrollEnd: boolean;
    canScrollStart: boolean;
    isOverflowing: boolean;
  },
) {
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  const scrollLeft = Math.min(Math.max(0, element.scrollLeft), maxScrollLeft);
  const nextState = {
    isOverflowing: maxScrollLeft > 1,
    canScrollStart: scrollLeft > 1,
    canScrollEnd: maxScrollLeft - scrollLeft > 1,
  };

  return previousState.isOverflowing === nextState.isOverflowing &&
    previousState.canScrollStart === nextState.canScrollStart &&
    previousState.canScrollEnd === nextState.canScrollEnd
    ? previousState
    : nextState;
}
