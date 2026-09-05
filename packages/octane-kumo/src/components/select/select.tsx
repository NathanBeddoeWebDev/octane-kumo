/** @jsxImportSource octane */
import {
  ButtonContext as AriaButtonContext,
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectStateContext as AriaSelectStateContext,
  SelectValue as AriaSelectValue,
  Separator as AriaSeparator,
  useContextProps as useAriaContextProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type Placement,
} from "@octanejs/aria/components";
import { useButton as useAriaButton } from "@octanejs/aria";
import { useRender } from "@octanejs/base-ui/use-render";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { CaretUpDown, Check } from "@octanejs/phosphor-icons";
import {
  createContext,
  flushSync,
  useContext,
  useId,
  useMemo,
  useState,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import {
  resolvePortalContainer,
  SelectionValueRegistry,
  textFromSelectionValue,
} from "../../utils/selection-values";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";
import { buttonVariants } from "../button/button";
import { type FieldErrorMatch } from "../field/field";
import { SelectionFieldPresentation } from "../../utils/selection-field";
import { SelectionFormValues } from "../../utils/selection-form-values";
import { KUMO_INPUT_VARIANTS, type KumoInputSize } from "../input/input";
import { SkeletonLine } from "../loader/skeleton-line";

export const KUMO_SELECT_VARIANTS = {
  size: KUMO_INPUT_VARIANTS.size,
} as const;

export const KUMO_SELECT_DEFAULT_VARIANTS = {
  size: "base",
} as const;

export const KUMO_SELECT_STYLING = {
  trigger: {
    height: 36,
    paddingX: 12,
    borderRadius: 8,
    background: "bg-kumo-control",
    text: "text-color-surface",
    ring: "color-border",
    fontSize: 16,
    fontWeight: 400,
  },
  stateTokens: {
    focus: { ring: "color-active" },
    disabled: { opacity: 0.5 },
  },
  icons: {
    caret: { name: "ph-caret-up-down", size: 20 },
    check: { name: "ph-check", size: 20 },
  },
  popup: {
    background: "bg-kumo-base",
    ring: "border-kumo-line",
    borderRadius: 8,
    padding: 6,
  },
  option: {
    paddingX: 8,
    paddingY: 6,
    borderRadius: 4,
    fontSize: 16,
    highlightBackground: "color-surface-secondary",
  },
} as const;

export type KumoSelectSize = keyof typeof KUMO_SELECT_VARIANTS.size;

export interface KumoSelectVariantsProps {
  size?: KumoSelectSize;
}

export function selectVariants({
  size = KUMO_SELECT_DEFAULT_VARIANTS.size,
}: KumoSelectVariantsProps = {}) {
  return cn(
    buttonVariants({ size }),
    "bg-kumo-control disabled:bg-kumo-control/50 data-[open]:bg-kumo-control",
    "justify-between font-normal",
    "focus:opacity-100 focus:ring-kumo-focus/50 focus-visible:ring-inset *:in-focus:opacity-100",
  );
}

const triggerIconStyles: Record<
  KumoInputSize,
  { iconSize: number; className: string }
> = {
  xs: { iconSize: 12, className: "text-kumo-subtle" },
  sm: { iconSize: 14, className: "text-kumo-subtle" },
  base: { iconSize: 16, className: "text-kumo-subtle" },
  lg: { iconSize: 18, className: "text-kumo-subtle" },
};

export interface SelectItemDescriptor {
  disabled?: boolean;
  label: OctaneNode;
}

export type SelectItemValue = OctaneNode;

export type SelectTriggerState<T = unknown> = {
  dirty: boolean;
  disabled: boolean;
  filled: boolean;
  focused: boolean;
  open: boolean;
  placeholder: boolean;
  popupSide: null;
  readOnly: boolean;
  touched: boolean;
  valid: boolean | null;
  value: T | T[] | null;
};

export type SelectTriggerRender<T = unknown> =
  | ElementDescriptor
  | ((
      props: Record<string, unknown>,
      state: SelectTriggerState<T>,
    ) => ElementDescriptor);

type SelectItem<T> = { label: OctaneNode; value: T };

function isItemDescriptor(
  value: SelectItemValue,
): value is SelectItemDescriptor {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return "label" in candidate && candidate.label !== undefined;
}

function normalizeItems<T>(
  items:
    | Record<string, SelectItemValue>
    | ReadonlyArray<SelectItem<T>>
    | undefined,
): ReadonlyArray<SelectItem<T>> {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Object.entries(items).map(([value, entry]) => ({
    value: value as T,
    label: isItemDescriptor(entry) ? entry.label : entry,
  }));
}

function renderOptionsFromItems<T>(
  items: Record<string, SelectItemValue> | ReadonlyArray<SelectItem<T>>,
  registry: SelectionValueRegistry<T>,
) {
  const disabledItems = new Map<string, boolean>();
  if (!Array.isArray(items)) {
    for (const [key, entry] of Object.entries(items)) {
      if (isItemDescriptor(entry))
        disabledItems.set(key, Boolean(entry.disabled));
    }
  }

  return normalizeItems(items)
    .filter((item) => item.value !== null)
    .map((item) => (
      <Option
        key={registry.keyFor(item.value)}
        value={item.value}
        disabled={
          typeof item.value === "string"
            ? disabledItems.get(item.value)
            : undefined
        }
      >
        {item.label}
      </Option>
    ));
}

type SelectError = string | { message: OctaneNode; match: FieldErrorMatch };
type SelectPositioningProps = {
  align?: "start" | "center" | "end";
  alignItemWithTrigger?: boolean;
  alignOffset?: number;
  anchor?: Element | { current: Element | null };
  arrowPadding?: number;
  collisionAvoidance?: unknown;
  collisionBoundary?: unknown;
  collisionPadding?: unknown;
  disableAnchorTracking?: boolean;
  positionMethod?: "absolute" | "fixed";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  sticky?: boolean;
};

export type SelectPropsGeneric<
  T,
  Multiple extends boolean | undefined = false,
> = KumoSelectVariantsProps &
  SelectPositioningProps & {
    "aria-label"?: string;
    "aria-labelledby"?: string;
    autoComplete?: string;
    children?: OctaneNode;
    className?: string;
    container?: PortalContainer;
    defaultOpen?: boolean;
    defaultValue?: Multiple extends true ? T[] : T | null;
    description?: OctaneNode;
    disabled?: boolean;
    error?: SelectError;
    form?: string;
    hideLabel?: boolean;
    id?: string;
    isItemEqualToValue?: (item: T, value: T) => boolean;
    itemToStringLabel?: (item: T) => string;
    itemToStringValue?: (item: T) => string;
    items?: Record<string, SelectItemValue> | ReadonlyArray<SelectItem<T>>;
    label?: OctaneNode;
    labelTooltip?: OctaneNode;
    loading?: boolean;
    multiple?: Multiple;
    name?: string;
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: Multiple extends true ? T[] : T | null) => void;
    open?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    render?: SelectTriggerRender<T>;
    renderValue?: (value: Multiple extends true ? T[] : T) => OctaneNode;
    required?: boolean;
    value?: Multiple extends true ? T[] : T | null;
  };

export interface SelectProps extends SelectPositioningProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: OctaneNode;
  className?: string;
  defaultValue?: unknown;
  description?: OctaneNode;
  disabled?: boolean;
  error?: SelectError;
  hideLabel?: boolean;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  loading?: boolean;
  multiple?: boolean;
  onValueChange?: (value: unknown) => void;
  placeholder?: string;
  render?: SelectTriggerRender;
  required?: boolean;
  size?: KumoSelectSize;
  value?: unknown;
}

type SelectContextValue = {
  hasError: boolean;
  itemToStringLabel?: (item: unknown) => string;
  readOnly: boolean;
  registry: SelectionValueRegistry<unknown>;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type SelectValueState<T> = {
  defaultChildren: OctaneNode;
  isPlaceholder: boolean;
  selectedItems: (T | null)[];
};

function selectedKey<T>(
  registry: SelectionValueRegistry<T>,
  value: T | T[] | null | undefined,
  multiple: boolean,
) {
  if (value === undefined) return undefined;
  if (multiple) {
    const values = Array.isArray(value) ? value : value === null ? [] : [value];
    return values.map((item) => registry.keyFor(item));
  }
  return value === null ? null : registry.keyFor(value as T);
}

type SelectTriggerProps<T> = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children: OctaneNode;
  className?: string;
  readOnly?: boolean;
  render?: SelectTriggerRender<T>;
};

function SelectTrigger<T>({
  children,
  className,
  readOnly,
  render,
  ...props
}: SelectTriggerProps<T>) {
  const selectState = useContext(AriaSelectStateContext);
  const context = useContext(SelectContext)!;
  const [contextProps, ref] = useAriaContextProps(
    props,
    undefined,
    AriaButtonContext,
  );
  const { buttonProps } = useAriaButton(contextProps, ref);
  const isOpen = Boolean(
    (contextProps as typeof contextProps & { isPressed?: boolean }).isPressed,
  );
  const stateValue = selectState?.value;
  const selectedValue =
    stateValue != null
      ? Array.isArray(stateValue)
        ? stateValue.map((key) => context.registry.valueFor(key) ?? key)
        : (context.registry.valueFor(stateValue as string | number) ??
          stateValue)
      : null;
  const isDisabled = Boolean(
    (contextProps as typeof contextProps & { isDisabled?: boolean }).isDisabled,
  );
  const state: SelectTriggerState<T> = {
    dirty: false,
    disabled: isDisabled,
    filled: Array.isArray(selectedValue)
      ? selectedValue.length > 0
      : selectedValue !== null,
    focused: false,
    open: isOpen,
    placeholder: Array.isArray(selectedValue)
      ? selectedValue.length === 0
      : selectedValue === null,
    popupSide: null,
    readOnly: Boolean(readOnly),
    touched: false,
    valid: context.hasError ? false : null,
    value: selectedValue as T | T[] | null,
  };

  const element = useRender({
    defaultTagName: "button",
    render,
    ref,
    state,
    props: [
      buttonProps,
      {
        role: "combobox",
        // Kumo names the control from its label, not the selected value that
        // React Aria includes in the default button naming relationship.
        "aria-label": props["aria-label"],
        "aria-labelledby": props["aria-labelledby"],
        "aria-invalid": context.hasError || undefined,
        "aria-readonly": readOnly || undefined,
        "data-kumo-component": "Select",
        "data-kumo-part": "trigger",
        "data-open": isOpen ? "" : undefined,
        className,
        children,
      },
    ],
  });
  return selectState ? element : null;
}

type SelectPopoverProps = {
  alignOffset: number;
  children: OctaneNode;
  container?: Element;
  placement: Placement;
  sideOffset: number;
};

function SelectPopover({
  alignOffset,
  children,
  container,
  placement,
  sideOffset,
}: SelectPopoverProps) {
  const state = useContext(AriaSelectStateContext);
  const isHydrating = useIsHydrating();
  return (
    <AriaPopover
      UNSTABLE_portalContainer={container}
      placement={placement}
      offset={sideOffset}
      crossOffset={alignOffset}
      isExiting={isHydrating}
      className={cn(
        "flex max-h-[min(var(--available-height),24rem)] min-w-(--trigger-width) flex-col rounded-lg bg-kumo-base py-1.5 text-kumo-default shadow-lg ring ring-kumo-line",
      )}
    >
      {!state || state.isOpen ? (
        <div
          className={cn("contents")}
          onKeyDown={(event) => {
            if (
              !event.defaultPrevented ||
              ![
                "Home",
                "End",
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
              ].includes(event.key)
            )
              return;
            // Aria updates its roving key before passively moving DOM focus.
            // Commit navigation before rapid Enter can activate the old option.
            // This wrapper receives the event after Aria; selection stays there.
            flushSync(() => {});
            const option = event.currentTarget.querySelector<HTMLElement>(
              '[role="option"][tabindex="0"]',
            );
            if (option && option !== option.ownerDocument.activeElement)
              option.focus({ preventScroll: true });
          }}
        >
          {children}
        </div>
      ) : null}
    </AriaPopover>
  );
}

function SelectRoot<T, Multiple extends boolean | undefined = false>({
  children,
  className,
  render,
  renderValue,
  label,
  hideLabel,
  placeholder,
  loading,
  size = KUMO_SELECT_DEFAULT_VARIANTS.size,
  labelTooltip,
  description,
  error,
  required,
  name,
  container: containerProp,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  items,
  isItemEqualToValue,
  itemToStringLabel,
  itemToStringValue,
  multiple,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  readOnly,
  ...props
}: SelectPropsGeneric<T, Multiple>) {
  const labelId = useId();
  const ariaLabel =
    props["aria-label"] ??
    (!label && !props["aria-labelledby"] ? placeholder : undefined);
  const labelledBy = ariaLabel
    ? undefined
    : (props["aria-labelledby"] ?? (label ? labelId : undefined));
  const normalizedItems = useMemo(() => normalizeItems(items), [items]);
  const values = useMemo(
    () => normalizedItems.map((item) => item.value),
    [normalizedItems],
  );
  const [internalValue, setInternalValue] = useState<T | T[] | null>(
    defaultValue ?? (multiple ? [] : null),
  );
  const applicationValue = value === undefined ? internalValue : value;
  const registry = useMemo(() => new SelectionValueRegistry<T>([]), []);
  registry.update(isItemEqualToValue, itemToStringValue);
  const selectedValues = (
    multiple
      ? applicationValue
      : applicationValue == null
        ? []
        : [applicationValue]
  ) as T[];
  for (const item of selectedValues) registry.register(item);
  for (const item of values) registry.register(item);
  const context: SelectContextValue = {
    hasError: Boolean(error),
    itemToStringLabel: itemToStringLabel as
      | ((item: unknown) => string)
      | undefined,
    readOnly: Boolean(readOnly),
    registry: registry as SelectionValueRegistry<unknown>,
  };
  const contextContainer = usePortalContainer();
  const container = resolvePortalContainer(containerProp ?? contextContainer);
  const selectionMode = multiple ? "multiple" : "single";
  const placement =
    `${side}${align === "center" ? "" : ` ${align}`}` as Placement;
  const normalizedError = error
    ? typeof error === "string"
      ? { message: error, match: true as const }
      : error
    : undefined;
  const renderedChildren =
    children ?? (items ? renderOptionsFromItems(items, registry) : null);
  const nullItem = normalizedItems.find((item) => item.value === null);
  const hasExplicitNullValue = value === null || defaultValue === null;

  if (process.env.NODE_ENV !== "production" && hideLabel !== undefined) {
    console.warn(
      "[Kumo Select]: `hideLabel` is deprecated. Use `aria-label` for an accessibility-only label.",
    );
  }

  const control = (
    <SelectContext.Provider value={context}>
      <AriaSelect
        {...props}
        className={cn("grid gap-2")}
        aria-label={ariaLabel}
        isDisabled={loading || disabled}
        isInvalid={Boolean(error)}
        isOpen={open}
        defaultOpen={defaultOpen}
        isRequired={required}
        selectionMode={selectionMode}
        value={selectedKey(
          registry,
          applicationValue as T | T[] | null,
          Boolean(multiple),
        )}
        onOpenChange={onOpenChange}
        onChange={(nextValue) => {
          const resolve = (key: string | number) =>
            selectedValues.find((item) => registry.keyFor(item) === key) ??
            registry.valueFor(key);
          const next = (
            Array.isArray(nextValue)
              ? nextValue.map(resolve)
              : nextValue === null
                ? null
                : resolve(nextValue)
          ) as Multiple extends true ? T[] : T;
          if (value === undefined) setInternalValue(next);
          onValueChange?.(next);
        }}
        placeholder={placeholder}
      >
        <SelectionFieldPresentation
          label={label}
          labelId={labelId}
          hideLabel={hideLabel}
          labelTooltip={labelTooltip}
          required={required}
          description={description}
          error={normalizedError}
        >
          <SelectTrigger<T>
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            className={cn(
              selectVariants({ size }),
              disabled && "cursor-not-allowed opacity-50",
              error &&
                "!ring-kumo-danger focus:ring-[1.5px] focus:ring-kumo-danger/50",
              className,
            )}
            readOnly={readOnly}
            render={render}
          >
            {loading ? (
              <SkeletonLine className={cn("w-32")} />
            ) : renderValue && selectedValues.length > 0 ? (
              renderValue(applicationValue as Multiple extends true ? T[] : T)
            ) : (
              <AriaSelectValue
                className={cn(
                  "min-w-0 truncate data-[placeholder]:text-kumo-placeholder",
                )}
              >
                {nullItem && hasExplicitNullValue
                  ? ({
                      isPlaceholder,
                      defaultChildren,
                    }: SelectValueState<T>) =>
                      isPlaceholder
                        ? (nullItem?.label ?? defaultChildren)
                        : defaultChildren
                  : undefined}
              </AriaSelectValue>
            )}
            <span
              className={cn(
                "flex shrink-0 items-center",
                triggerIconStyles[size].className,
              )}
            >
              <CaretUpDown
                aria-hidden="true"
                className={cn("fill-current")}
                size={triggerIconStyles[size].iconSize}
              />
            </span>
          </SelectTrigger>
        </SelectionFieldPresentation>
        <SelectionFormValues
          name={name}
          form={props.form}
          disabled={disabled}
          values={
            multiple
              ? selectedValues
              : selectedValues.length
                ? selectedValues
                : [null]
          }
          serialize={
            itemToStringValue as ((value: T | null) => string) | undefined
          }
          onReset={() => {
            if (value === undefined)
              setInternalValue(defaultValue ?? (multiple ? [] : null));
          }}
        />
        <SelectPopover
          container={container}
          placement={placement}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
        >
          <AriaListBox
            className={cn(
              "min-h-0 flex-1 scroll-pt-2 scroll-pb-2 overflow-y-auto overscroll-none",
            )}
          >
            {renderedChildren}
          </AriaListBox>
        </SelectPopover>
      </AriaSelect>
    </SelectContext.Provider>
  );

  return <div className={cn("grid gap-2")}>{control}</div>;
}

export type SelectOptionProps<T = unknown> = Omit<
  AriaListBoxItemProps<object>,
  "children" | "id" | "isDisabled" | "textValue" | "value"
> & {
  children: OctaneNode;
  disabled?: boolean;
  id?: string | number;
  textValue?: string;
  value: T;
};

function Option<T>({
  children,
  className,
  disabled,
  id,
  textValue,
  value,
  ...props
}: SelectOptionProps<T>) {
  const context = useContext(SelectContext)!;
  const key = context.registry.register(value, id);
  return (
    <AriaListBoxItem
      {...props}
      id={key}
      value={value as object}
      isDisabled={disabled || context.readOnly}
      textValue={
        textValue ??
        (typeof children === "string"
          ? children
          : (context.itemToStringLabel?.(value) ??
            textFromSelectionValue(value)))
      }
      data-kumo-component="Select"
      data-kumo-part="option"
      className={cn(
        "group mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-base outline-none",
        "focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:ring-inset",
        "data-[focused]:bg-kumo-tint",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
    >
      {({ isSelected }: { isSelected: boolean }) => (
        <>
          <span className={cn("contents")}>{children}</span>
          {isSelected ? <Check aria-hidden="true" /> : null}
        </>
      )}
    </AriaListBoxItem>
  );
}

export type SelectGroupProps<T = object> = {
  children: OctaneNode;
  className?: string;
  id?: string | number;
  items?: readonly T[];
  value?: T;
};

function Group<T extends object = object>({
  className,
  ...props
}: SelectGroupProps<T>) {
  return <AriaListBoxSection {...props} className={cn(className)} />;
}

export type SelectGroupLabelProps = Omit<
  JSX.IntrinsicElements["header"],
  "children"
> & { children: OctaneNode };

function GroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <AriaHeader
      {...props}
      className={cn(
        "px-3.5 py-1.5 text-sm font-semibold text-kumo-subtle",
        className,
      )}
    />
  );
}

export type SelectSeparatorProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
  ref?: { current: HTMLDivElement | null };
};

function Separator({ className, ...props }: SelectSeparatorProps) {
  return (
    <AriaSeparator
      {...props}
      className={cn("-mx-1 my-1 h-px bg-kumo-hairline", className)}
    />
  );
}

export const Select = Object.assign(SelectRoot, {
  Group,
  GroupLabel,
  Option,
  Separator,
});

Object.assign(SelectRoot, { displayName: "Select.Root" });
Object.assign(Option, { displayName: "Select.Option" });
Object.assign(Group, { displayName: "Select.Group" });
Object.assign(GroupLabel, { displayName: "Select.GroupLabel" });
Object.assign(Separator, { displayName: "Select.Separator" });
