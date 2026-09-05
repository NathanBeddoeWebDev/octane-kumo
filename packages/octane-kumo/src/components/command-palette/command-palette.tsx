/** @jsxImportSource octane */
import {
  Autocomplete,
  AutocompleteStateContext,
  SearchField,
  Input as AriaInput,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Header,
} from "@octanejs/aria/components";
import { Dialog as DialogBase } from "@octanejs/base-ui/dialog";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import {
  MagnifyingGlass,
  ArrowRight,
  ArrowSquareOut,
  CaretRight,
} from "@octanejs/phosphor-icons";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { LayerCard } from "../layer-card";
import { Loader } from "../loader";
import { cn } from "../../utils/cn";
import { usePortalContainer } from "../../utils/portal-provider";
import {
  SelectionValueRegistry,
  flattenSelectionItems,
  textFromSelectionValue,
} from "../../utils/selection-values";
import type {
  CommandPaletteRootProps,
  CommandPalettePanelProps,
  CommandPaletteInputProps,
  CommandPaletteListProps,
  CommandPaletteGroupProps,
  CommandPaletteGroupLabelProps,
  CommandPaletteItemProps,
  CommandPaletteEmptyProps,
  CommandPaletteLoadingProps,
  CommandPaletteFooterProps,
  CommandPaletteResultItemProps,
  HighlightRange,
} from "./types";

const DialogContext = createContext<{ onClose?: () => void }>({});
type DialogProps = Pick<
  CommandPaletteRootProps<unknown>,
  "open" | "onOpenChange" | "onBackdropClick" | "children" | "container"
>;
function Dialog({
  open,
  onOpenChange,
  onBackdropClick,
  children,
  container: explicitContainer,
}: DialogProps) {
  const inheritedContainer = usePortalContainer();
  const container = explicitContainer ?? inheritedContainer ?? undefined;
  const hydrating = useIsHydrating();
  const wasOpen = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  if (open && !wasOpen.current && typeof document !== "undefined") {
    returnFocus.current = document.activeElement as HTMLElement | null;
  }
  wasOpen.current = open;
  return (
    <DialogBase.Root
      open={open}
      onOpenChange={(
        next: boolean,
        details: { reason: string; cancel(): void },
      ) => {
        if (onBackdropClick && details.reason === "outside-press") {
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}
      modal
    >
      <DialogBase.Portal container={container} keepMounted={hydrating}>
        <DialogBase.Backdrop
          className={cn(
            "fixed inset-0 bg-kumo-overlay opacity-80 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          )}
          onClick={onBackdropClick}
        />
        <LayerCard
          render={
            <DialogBase.Popup
              aria-label="Command palette"
              finalFocus={returnFocus}
            />
          }
          className={cn(
            "fixed top-[10vh] left-1/2 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-lg text-base duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
          )}
          style={{ transitionProperty: "scale, opacity" }}
        >
          <DialogContext.Provider
            value={{ onClose: () => onOpenChange(false) }}
          >
            {children}
          </DialogContext.Provider>
        </LayerCard>
      </DialogBase.Portal>
    </DialogBase.Root>
  );
}
function Root<TGroup, TItem = TGroup>({
  open,
  onOpenChange,
  onBackdropClick,
  container,
  ...props
}: CommandPaletteRootProps<TGroup, TItem>) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onBackdropClick={onBackdropClick}
      container={container}
    >
      <Panel {...props} />
    </Dialog>
  );
}

type PanelContextValue = {
  items: unknown[];
  visibleItems: unknown[];
  filtering: boolean;
  registry: SelectionValueRegistry<unknown>;
  itemToStringValue?: (item: unknown) => string;
  onSelect?: (item: unknown, options: { newTab: boolean }) => void;
  open: boolean;
};
const PanelContext = createContext<PanelContextValue | null>(null);
const GroupContext = createContext<unknown[] | null>(null);
function Panel<TGroup, TItem = TGroup>({
  children,
  items,
  value,
  onValueChange,
  onItemHighlighted,
  itemToStringValue,
  filter,
  open = true,
  className,
  onSelect,
  getSelectableItems,
}: CommandPalettePanelProps<TGroup, TItem>) {
  const registry = useMemo(
    () => new SelectionValueRegistry<unknown>([], undefined, () => "command"),
    [],
  );
  // Filter values rather than labels: distinct objects may have the same text.
  return (
    <Autocomplete inputValue={value} onInputChange={onValueChange}>
      <PanelBody
        items={items}
        registry={registry}
        filter={filter}
        itemToStringValue={itemToStringValue}
        onItemHighlighted={onItemHighlighted}
        onSelect={onSelect}
        getSelectableItems={getSelectableItems}
        open={open}
        className={className}
      >
        {children}
      </PanelBody>
    </Autocomplete>
  );
}
function PanelBody<TGroup, TItem>({
  items,
  registry,
  filter,
  itemToStringValue,
  onItemHighlighted,
  onSelect,
  getSelectableItems,
  open,
  className,
  children,
}: CommandPalettePanelProps<TGroup, TItem> & {
  registry: SelectionValueRegistry<unknown>;
  open: boolean;
}) {
  const state = useContext(AutocompleteStateContext)!;
  const filtered = filter
    ? items.filter((item) => filter(item, state.inputValue))
    : items;
  const selectable: unknown[] =
    getSelectableItems?.(filtered) ?? flattenSelectionItems(filtered);
  const host = useRef<HTMLDivElement | null>(null);
  const lastEvent = useRef<Event | null>(null);
  const highlightCallback = useRef(onItemHighlighted);
  highlightCallback.current = onItemHighlighted;
  useEffect(() => {
    const options = Array.from(
      host.current?.querySelectorAll<HTMLElement>("[data-command-key]") ?? [],
    );
    const index = options.findIndex(
      (option) => option.id === state.focusedNodeId,
    );
    const key = options[index]?.getAttribute("data-command-key");
    const event = lastEvent.current ?? new Event("highlight");
    highlightCallback.current?.(
      key == null ? undefined : (registry.valueFor(key) as TGroup),
      {
        index,
        event,
        reason: event.type.startsWith("key")
          ? "keyboard"
          : event.type.startsWith("pointer")
            ? "pointer"
            : "none",
      },
    );
  }, [state.focusedNodeId, registry]);
  const context: PanelContextValue = {
    items: filtered,
    visibleItems: selectable,
    filtering: !!filter,
    registry,
    open,
    itemToStringValue:
      itemToStringValue as PanelContextValue["itemToStringValue"],
    onSelect:
      onSelect && getSelectableItems
        ? (item, options) => {
            if (selectable?.includes(item as TItem))
              onSelect(item as TItem, options);
          }
        : undefined,
  };
  return (
    <PanelContext.Provider value={context}>
      <div
        ref={host}
        onKeyDownCapture={(event) => {
          lastEvent.current = event;
        }}
        onPointerMoveCapture={(event) => {
          lastEvent.current = event;
        }}
        hidden={!open}
        style={{ display: open ? undefined : "none" }}
        className={cn(
          "flex max-h-[60vh] flex-col overflow-hidden rounded-lg bg-kumo-elevated text-base",
          className,
        )}
      >
        {children}
      </div>
    </PanelContext.Provider>
  );
}

function PanelInput({
  autoFocus = true,
  placeholder,
  className,
  onKeyDown,
  leading,
  trailing,
  ...props
}: CommandPaletteInputProps) {
  const context = useContext(PanelContext)!;
  const state = useContext(AutocompleteStateContext)!;
  const { onClose } = useContext(DialogContext);
  return (
    <SearchField
      aria-label={props["aria-label"] ?? "Search commands"}
      className={cn(
        "flex items-center gap-3 bg-kumo-base px-4 py-3 focus-within:ring-2 focus-within:ring-kumo-brand",
      )}
    >
      {leading ?? (
        <MagnifyingGlass
          className={cn("h-4 w-4 shrink-0 text-kumo-subtle")}
          weight="bold"
        />
      )}
      <AriaInput
        {...props}
        placeholder={placeholder}
        className={cn(
          "kumo-input-placeholder min-w-0 flex-1 border-none bg-transparent text-base outline-none",
          className,
        )}
        autoFocus={autoFocus && context.open}
        onKeyDownCapture={(event: KeyboardEvent) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) {
            event.stopPropagation();
            return;
          }
          if (event.key === "Escape" && onClose) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
          }
          if (event.key === "Enter" && !event.isComposing) {
            const option = state.focusedNodeId
              ? document.getElementById(state.focusedNodeId)
              : null;
            if (!option || option.getAttribute("aria-disabled") === "true")
              return;
            event.preventDefault();
            event.stopPropagation();
            const key = option.getAttribute("data-command-key");
            if (
              (event.metaKey || event.ctrlKey) &&
              context.onSelect &&
              key !== null
            ) {
              context.onSelect(context.registry.valueFor(key), {
                newTab: true,
              });
            } else {
              option.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                }),
              );
            }
          }
        }}
      />
      {trailing}
    </SearchField>
  );
}
function List({
  children,
  className,
  ref,
}: CommandPaletteListProps & {
  className?: string;
  ref?: JSX.IntrinsicElements["div"]["ref"];
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative min-h-0 flex-1 scroll-py-2 overflow-y-auto rounded-b-lg bg-kumo-base px-2 py-2 ring-1 ring-kumo-hairline",
        className,
      )}
    >
      {children}
    </div>
  );
}
type CollectionChildren<T> =
  | ElementDescriptor
  | readonly OctaneNode[]
  | string
  | number
  | boolean
  | null
  | undefined
  | ((item: T, index: number) => OctaneNode);
function Results<T = unknown>({
  children,
  className,
}: {
  children: CollectionChildren<T>;
  className?: string;
}) {
  const context = useContext(PanelContext)!;
  return (
    <ListBox
      aria-label="Commands"
      selectionMode="none"
      disabledBehavior="all"
      autoFocus={context.open ? "first" : false}
      className={cn("space-y-3 outline-none", className)}
    >
      {typeof children === "function"
        ? context.items.map((item, index) => (
            <Fragment key={context.registry.register(item)}>
              {children(item as T, index)}
            </Fragment>
          ))
        : children}
    </ListBox>
  );
}
function Group({
  children,
  className,
  items,
}: CommandPaletteGroupProps & { className?: string; items?: unknown[] }) {
  return (
    <ListBoxSection className={cn("space-y-0.5", className)}>
      <GroupContext.Provider value={items ?? null}>
        {children}
      </GroupContext.Provider>
    </ListBoxSection>
  );
}
function GroupLabel({
  children,
  className,
}: CommandPaletteGroupLabelProps & { className?: string }) {
  return (
    <Header
      className={cn(
        "mb-2 px-2 pt-1 text-base font-semibold text-kumo-subtle",
        className,
      )}
    >
      {children}
    </Header>
  );
}
function Items<T = unknown>({ children }: { children: CollectionChildren<T> }) {
  const group = useContext(GroupContext);
  const context = useContext(PanelContext)!;
  return (
    <>
      {typeof children === "function"
        ? (group ?? context.items).map((item, index) => (
            <Fragment key={context.registry.register(item)}>
              {children(item as T, index)}
            </Fragment>
          ))
        : children}
    </>
  );
}
function Item<T>({
  value,
  disabled,
  children,
  className,
  onClick,
  textValue: explicitText,
}: CommandPaletteItemProps<T> & { className?: string; textValue?: string }) {
  const context = useContext(PanelContext)!;
  const key = String(context.registry.register(value));
  const textValue =
    explicitText ??
    (typeof children === "string"
      ? children
      : (context.itemToStringValue?.(value) ?? textFromSelectionValue(value)));
  if (context.filtering && !context.visibleItems.includes(value)) return null;
  return (
    <ListBoxItem
      id={key}
      value={value as object}
      onClickCapture={(event: MouseEvent) => {
        if (!disabled) onClick?.(event);
      }}
      textValue={textValue || "Command"}
      aria-label={explicitText}
      isDisabled={disabled}
      data-command-key={key}
      className={({ isFocused }: { isFocused: boolean }) =>
        cn(
          "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-base outline-none",
          "cursor-pointer",
          isFocused && !disabled && "bg-kumo-overlay",
          disabled && "cursor-default opacity-50",
          className,
        )
      }
    >
      {({ isFocused }: { isFocused: boolean }) => (
        <div
          className={cn("group flex w-full min-w-0 items-center gap-3")}
          data-highlighted={isFocused ? "" : undefined}
        >
          {children}
        </div>
      )}
    </ListBoxItem>
  );
}
function Empty({ children }: CommandPaletteEmptyProps) {
  const { visibleItems } = useContext(PanelContext)!;
  if (visibleItems.length) return null;
  return (
    <div
      role="status"
      className={cn("p-8 text-center text-base text-kumo-subtle")}
    >
      {children ?? "No results found"}
    </div>
  );
}
function Loading({ children }: CommandPaletteLoadingProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center p-8")}
    >
      {children ?? <Loader size={24} />}
    </div>
  );
}
function Footer({ children }: CommandPaletteFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-b-lg bg-kumo-elevated px-4 py-3 text-base text-kumo-subtle",
      )}
    >
      {children}
    </div>
  );
}
function HighlightedText({
  text,
  highlights,
  className,
}: {
  text: string;
  highlights?: HighlightRange[];
  className?: string;
}) {
  const ranges: HighlightRange[] = [];
  for (const [start, end] of [...(highlights ?? [])].sort(
    (a, b) => a[0] - b[0],
  )) {
    const last = ranges.at(-1);
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else ranges.push([start, end]);
  }
  const parts: OctaneNode[] = [];
  let offset = 0;
  for (const [start, end] of ranges) {
    if (start > offset) parts.push(text.slice(offset, start));
    parts.push(
      <mark
        key={start}
        className={cn("rounded-sm bg-kumo-warning/50 text-kumo-default")}
      >
        {text.slice(start, end + 1)}
      </mark>,
    );
    offset = end + 1;
  }
  parts.push(text.slice(offset));
  return <span className={cn(className)}>{parts}</span>;
}
function ResultItem<T>({
  title,
  breadcrumbs,
  titleHighlights,
  breadcrumbHighlights,
  description,
  icon,
  value,
  onClick,
  showArrow = true,
  external = false,
  nonInteractive = false,
}: CommandPaletteResultItemProps<T>) {
  return (
    <Item
      value={value}
      disabled={nonInteractive}
      onClick={onClick}
      textValue={[...(breadcrumbs ?? []), title, description]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <span className={cn("flex shrink-0 items-center text-kumo-subtle")}>
          {icon}
        </span>
      )}
      <div className={cn("min-w-0 flex-1")}>
        <div className={cn("flex items-center gap-2 overflow-hidden")}>
          {breadcrumbs?.map((crumb, index) => (
            <span key={index} className={cn("flex min-w-0 items-center gap-2")}>
              <HighlightedText
                text={crumb}
                highlights={breadcrumbHighlights?.[index]}
                className={cn("truncate text-base text-kumo-default")}
              />
              <CaretRight
                className={cn("h-3 w-3 shrink-0 text-kumo-subtle")}
                weight="bold"
              />
            </span>
          ))}
          <HighlightedText
            text={title}
            highlights={titleHighlights}
            className={cn("truncate text-base text-kumo-default")}
          />
          {external && (
            <ArrowSquareOut
              className={cn("h-3.5 w-3.5 shrink-0 text-kumo-subtle")}
            />
          )}
          {description && (
            <>
              <span className={cn("text-kumo-subtle")}>—</span>
              <span className={cn("truncate text-base text-kumo-subtle")}>
                {description}
              </span>
            </>
          )}
        </div>
      </div>
      {showArrow && !external && !nonInteractive && (
        <ArrowRight
          className={cn(
            "h-4 w-4 shrink-0 text-kumo-subtle opacity-0 transition-opacity group-data-[highlighted]:opacity-100",
          )}
        />
      )}
    </Item>
  );
}
export const KUMO_COMMAND_PALETTE_VARIANTS = {} as const;
export const KUMO_COMMAND_PALETTE_DEFAULT_VARIANTS = {} as const;
export const CommandPalette = {
  Dialog,
  Root,
  Panel,
  Input: PanelInput,
  List,
  Results,
  Items,
  Group,
  GroupLabel,
  Item,
  ResultItem,
  HighlightedText,
  Empty,
  Loading,
  Footer,
};
