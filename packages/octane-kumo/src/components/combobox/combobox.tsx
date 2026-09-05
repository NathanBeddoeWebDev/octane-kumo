/** @jsxImportSource octane */
import {
  Button as AriaButton,
  ButtonContext as AriaButtonContext,
  Collection as AriaCollection,
  ComboBox as AriaComboBox,
  ComboBoxStateContext as AriaComboBoxStateContext,
  ComboBoxValue as AriaComboBoxValue,
  Header as AriaHeader,
  Input as AriaInput,
  InputContext as AriaInputContext,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  useContextProps as useAriaContextProps,
  type ButtonProps as AriaButtonProps,
  type InputProps as AriaInputProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type Placement,
} from "@octanejs/aria/components";
import { useButton as useAriaButton } from "@octanejs/aria";
import { useRender } from "@octanejs/base-ui/use-render";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { CaretDown, Check, X } from "@octanejs/phosphor-icons";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import {
  flattenSelectionItems,
  getSelectionFilter,
  resolvePortalContainer,
  type SelectionFilter,
  type SelectionFilterOptions,
  SelectionValueRegistry,
  textFromSelectionValue,
} from "../../utils/selection-values";
import { SelectionFieldPresentation } from "../../utils/selection-field";
import { SelectionFormValues } from "../../utils/selection-form-values";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";
import type { FieldErrorMatch } from "../field/field";
import {
  inputVariants,
  KUMO_INPUT_VARIANTS,
  type KumoInputSize,
} from "../input/input";

export const KUMO_COMBOBOX_VARIANTS = {
  size: KUMO_INPUT_VARIANTS.size,
  inputSide: {
    right: {
      classes: "",
      description: "Input positioned inline to the right of chips",
    },
    top: {
      classes: "",
      description: "Input positioned above chips",
    },
  },
} as const;

export const KUMO_COMBOBOX_DEFAULT_VARIANTS = {
  size: "base",
  inputSide: "right",
} as const;

export type KumoComboboxSize = keyof typeof KUMO_COMBOBOX_VARIANTS.size;
export type KumoComboboxInputSide =
  keyof typeof KUMO_COMBOBOX_VARIANTS.inputSide;
export type ComboboxInputSide = KumoComboboxInputSide;
export type ComboboxSize = KumoComboboxSize;
export type ComboboxFilter = SelectionFilter;

export type ComboboxFilterOptions = SelectionFilterOptions & {
  multiple?: boolean;
  value?: unknown;
};

export type ComboboxTriggerState = {
  dirty: boolean;
  disabled: boolean;
  filled: boolean;
  focused: boolean;
  listEmpty: boolean;
  open: boolean;
  placeholder: boolean;
  popupSide: null;
  touched: boolean;
  valid: boolean | null;
};

export type ComboboxTriggerRender =
  | ElementDescriptor
  | ((
      props: Record<string, unknown>,
      state: ComboboxTriggerState,
    ) => ElementDescriptor);

export interface KumoComboboxVariantsProps {
  inputSide?: KumoComboboxInputSide;
  size?: KumoComboboxSize;
}

export function comboboxVariants({
  inputSide = KUMO_COMBOBOX_DEFAULT_VARIANTS.inputSide,
}: KumoComboboxVariantsProps = {}) {
  return cn(KUMO_COMBOBOX_VARIANTS.inputSide[inputSide].classes);
}

type SelectionKey = string | number;
type ComboboxError = string | { message: OctaneNode; match: FieldErrorMatch };

type ComboboxContextValue = {
  disabled: boolean;
  hasError: boolean;
  itemToStringLabel?: (value: unknown) => string;
  multiple: boolean;
  readOnly: boolean;
  registry: SelectionValueRegistry<unknown>;
  value: unknown;
  size: KumoInputSize;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);
const ChipValueContext = createContext<unknown>(undefined);

export type ComboboxRootProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  allowsCustomValue?: boolean;
  autoComplete?: string;
  children: OctaneNode;
  className?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: Multiple extends true ? Value[] : Value | null;
  description?: OctaneNode;
  disabled?: boolean;
  error?: ComboboxError;
  filter?: (
    item: Value,
    query: string,
    itemToString?: (item: Value) => string,
  ) => boolean;
  form?: string;
  id?: string;
  inputValue?: string;
  isItemEqualToValue?: (item: Value, value: Value) => boolean;
  itemToStringLabel?: (value: Value) => string;
  itemToStringValue?: (value: Value) => string;
  items: readonly Value[];
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  menuTrigger?: "focus" | "input" | "manual";
  multiple?: Multiple;
  name?: string;
  onInputValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (
    value: Multiple extends true ? Value[] : Value | null,
  ) => void;
  open?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: KumoComboboxSize;
  value?: Multiple extends true ? Value[] : Value | null;
};

export interface ComboboxProps extends KumoComboboxVariantsProps {
  children: OctaneNode;
  className?: string;
  description?: OctaneNode;
  disabled?: boolean;
  error?: ComboboxError;
  items: readonly unknown[];
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  multiple?: boolean;
  onValueChange?: (value: unknown) => void;
  required?: boolean;
  value?: unknown;
}

function keyValue<Value>(
  registry: SelectionValueRegistry<Value>,
  value: Value | Value[] | null | undefined,
  multiple: boolean,
): SelectionKey | SelectionKey[] | null | undefined {
  if (value === undefined) return undefined;
  if (multiple) {
    const values = Array.isArray(value) ? value : value === null ? [] : [value];
    return values.map((item) => registry.keyFor(item));
  }
  return value === null ? null : registry.keyFor(value as Value);
}

function Root<Value, Multiple extends boolean | undefined = false>({
  label,
  required,
  labelTooltip,
  description,
  error,
  children,
  size = KUMO_COMBOBOX_DEFAULT_VARIANTS.size,
  items,
  multiple,
  value,
  defaultValue,
  onValueChange,
  itemToStringLabel,
  itemToStringValue,
  isItemEqualToValue,
  filter,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  readOnly,
  name,
  ...props
}: ComboboxRootProps<Value, Multiple>) {
  const flatItems = useMemo(() => flattenSelectionItems(items), [items]);
  const registry = useMemo(
    () => new SelectionValueRegistry([], isItemEqualToValue, itemToStringValue),
    [],
  );
  registry.update(isItemEqualToValue, itemToStringValue);
  for (const item of flatItems) registry.register(item);
  const [uncontrolledValue, setUncontrolledValue] = useState<
    Value | Value[] | null
  >(() => defaultValue ?? (multiple ? [] : null));
  const applicationValue = value === undefined ? uncontrolledValue : value;
  if (Array.isArray(applicationValue)) {
    for (const item of applicationValue) registry.register(item);
  } else if (applicationValue !== null && applicationValue !== undefined) {
    registry.register(applicationValue as Value);
  }
  const normalizedError = error
    ? typeof error === "string"
      ? { message: error, match: true as const }
      : error
    : undefined;
  const context: ComboboxContextValue = {
    disabled: Boolean(disabled),
    hasError: Boolean(error),
    itemToStringLabel: itemToStringLabel as
      | ((value: unknown) => string)
      | undefined,
    multiple: Boolean(multiple),
    readOnly: Boolean(readOnly),
    registry: registry as SelectionValueRegistry<unknown>,
    size,
    value: applicationValue,
  };
  const control = (
    <ComboboxContext.Provider value={context}>
      <AriaComboBox
        {...props}
        className={cn("grid min-w-0 gap-2", props.className)}
        defaultItems={items as readonly object[]}
        isDisabled={disabled}
        isInvalid={Boolean(error)}
        isOpen={open}
        defaultOpen={defaultOpen}
        isReadOnly={readOnly}
        isRequired={required}
        selectionMode={multiple ? "multiple" : "single"}
        value={keyValue(
          registry,
          applicationValue as Value | Value[] | null,
          Boolean(multiple),
        )}
        inputValue={inputValue}
        defaultInputValue={defaultInputValue}
        onInputChange={onInputValueChange}
        onOpenChange={onOpenChange}
        defaultFilter={
          filter
            ? (text, query) => {
                const item = registry.valueForText(text);
                return item === undefined
                  ? false
                  : filter(item, query, itemToStringLabel);
              }
            : undefined
        }
        onChange={(nextValue) => {
          const selected = (
            multiple
              ? applicationValue
              : applicationValue == null
                ? []
                : [applicationValue]
          ) as Value[];
          const resolve = (key: SelectionKey | null) =>
            key === null
              ? null
              : (selected.find((item) => registry.keyFor(item) === key) ??
                registry.valueFor(key));
          const nextApplicationValue = Array.isArray(nextValue)
            ? nextValue.map(resolve)
            : resolve(nextValue);
          if (value === undefined)
            setUncontrolledValue(
              nextApplicationValue as Value | Value[] | null,
            );
          onValueChange?.(
            nextApplicationValue as Multiple extends true
              ? Value[]
              : Value | null,
          );
        }}
      >
        <SelectionFieldPresentation
          description={description}
          error={normalizedError}
          label={label}
          labelTooltip={labelTooltip}
          required={required}
        >
          {children}
        </SelectionFieldPresentation>
        <SelectionFormValues
          name={name}
          form={props.form}
          disabled={disabled}
          values={
            (multiple
              ? applicationValue
              : [applicationValue]) as (Value | null)[]
          }
          serialize={
            itemToStringValue as ((value: Value | null) => string) | undefined
          }
          onReset={() => {
            if (value === undefined)
              setUncontrolledValue(defaultValue ?? (multiple ? [] : null));
          }}
        />
      </AriaComboBox>
    </ComboboxContext.Provider>
  );

  return control;
}

export interface ComboboxContentProps {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  anchor?: Element | { current: Element | null };
  children?: OctaneNode;
  className?: string;
  collisionAvoidance?: unknown;
  collisionBoundary?: unknown;
  collisionPadding?: unknown;
  container?: PortalContainer;
  disableAnchorTracking?: boolean;
  positionMethod?: "absolute" | "fixed";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  sticky?: boolean;
}

function Content({
  children,
  className,
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  side = "bottom",
  container: containerProp,
}: ComboboxContentProps) {
  const contextContainer = usePortalContainer();
  const container = resolvePortalContainer(containerProp ?? contextContainer);
  const placement =
    `${side}${align === "center" ? "" : ` ${align}`}` as Placement;
  const state = useContext(AriaComboBoxStateContext);
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
        className,
      )}
    >
      {!state || state.isOpen ? children : null}
    </AriaPopover>
  );
}

const triggerValueIconStyles: Record<
  KumoComboboxSize,
  { padding: string; iconSize: number; iconRight: string }
> = {
  xs: { padding: "pr-5", iconSize: 12, iconRight: "right-1" },
  sm: { padding: "pr-6", iconSize: 14, iconRight: "right-1.5" },
  base: { padding: "pr-8", iconSize: 16, iconRight: "right-2" },
  lg: { padding: "pr-10", iconSize: 18, iconRight: "right-3" },
};

export type ComboboxTriggerValueProps = Omit<
  AriaButtonProps,
  "children" | "className"
> & {
  children?: OctaneNode;
  className?: string;
  placeholder?: OctaneNode;
  render?: ComboboxTriggerRender;
};

type NativeComboboxTriggerProps = Omit<
  AriaButtonProps,
  "children" | "className"
> & {
  children?: OctaneNode;
  className?: string;
  render?: ComboboxTriggerRender;
  role?: string;
};

function NativeComboboxTrigger({
  children,
  className,
  render,
  role,
  ...props
}: NativeComboboxTriggerProps) {
  const comboBoxState = useContext(AriaComboBoxStateContext);
  const [contextProps, ref] = useAriaContextProps(
    props,
    props.ref,
    AriaButtonContext,
  );
  const { buttonProps } = useAriaButton(
    { ...contextProps, excludeFromTabOrder: false },
    ref,
  );
  const wasOpen = useRef(false);
  useEffect(() => {
    const trigger = ref.current;
    if (!trigger) return;

    if (comboBoxState?.isOpen) {
      const listboxId = trigger.getAttribute("aria-controls");
      const listbox = listboxId
        ? trigger.ownerDocument.getElementById(listboxId)
        : null;
      listbox?.parentElement?.querySelector<HTMLInputElement>("input")?.focus();
    } else if (wasOpen.current) {
      trigger.focus();
    }
    wasOpen.current = Boolean(comboBoxState?.isOpen);
  }, [comboBoxState?.isOpen, ref]);
  const state: ComboboxTriggerState = {
    dirty: false,
    disabled: Boolean(contextProps.isDisabled),
    filled: Boolean(
      comboBoxState?.inputValue || comboBoxState?.selectedItems.length,
    ),
    focused: false,
    listEmpty: comboBoxState?.collection.size === 0,
    open: Boolean(comboBoxState?.isOpen),
    placeholder: !(
      comboBoxState?.inputValue || comboBoxState?.selectedItems.length
    ),
    popupSide: null,
    touched: false,
    valid: null,
  };

  const element = useRender({
    defaultTagName: "button",
    render,
    ref,
    state,
    props: [
      buttonProps,
      {
        role,
        className,
        children,
      },
    ],
  });
  return comboBoxState ? element : null;
}

function TriggerValue({
  className,
  children,
  placeholder,
  render,
  ...props
}: ComboboxTriggerValueProps) {
  const context = useContext(ComboboxContext)!;
  const iconStyles = triggerValueIconStyles[context.size];
  const renderedValue =
    typeof children === "function" ? () => children(context.value) : children;
  return (
    <NativeComboboxTrigger
      {...props}
      role="combobox"
      data-kumo-component="Combobox"
      data-kumo-part="trigger"
      render={render}
      className={cn(
        inputVariants({
          size: context.size,
          variant: context.hasError ? "error" : "default",
        }),
        "relative flex items-center data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        "data-[placeholder]:text-kumo-placeholder",
        iconStyles.padding,
        className,
      )}
    >
      <AriaComboBoxValue placeholder={placeholder}>
        {renderedValue}
      </AriaComboBoxValue>
      <span
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 items-center text-kumo-subtle",
          iconStyles.iconRight,
        )}
      >
        <CaretDown aria-hidden="true" size={iconStyles.iconSize} />
      </span>
    </NativeComboboxTrigger>
  );
}

const triggerInputIconStyles: Record<
  KumoComboboxSize,
  { padding: string; iconSize: number; clearRight: string; caretRight: string }
> = {
  xs: {
    padding: "pr-7",
    iconSize: 12,
    clearRight: "right-5",
    caretRight: "right-1",
  },
  sm: {
    padding: "pr-9",
    iconSize: 14,
    clearRight: "right-6",
    caretRight: "right-1.5",
  },
  base: {
    padding: "pr-12",
    iconSize: 16,
    clearRight: "right-8",
    caretRight: "right-2",
  },
  lg: {
    padding: "pr-14",
    iconSize: 18,
    clearRight: "right-9",
    caretRight: "right-3",
  },
};

export type ComboboxInputProps = Omit<AriaInputProps, "className"> & {
  className?: string;
};

export type ComboboxTriggerInputProps = ComboboxInputProps & {
  clearLabel?: string;
  render?: ElementDescriptor;
  showOptionsLabel?: string;
};

function TriggerInput({
  clearLabel = "Clear selection",
  showOptionsLabel = "Show options",
  className,
  render,
  ref: callerRef,
  ...props
}: ComboboxTriggerInputProps) {
  const context = useContext(ComboboxContext)!;
  const state = useContext(AriaComboBoxStateContext);
  const iconStyles = triggerInputIconStyles[context.size];
  const hasValue =
    Boolean(state?.inputValue) ||
    (Array.isArray(context.value)
      ? context.value.length > 0
      : context.value !== null);
  const [inputProps, inputRef] = useAriaContextProps(
    props,
    callerRef,
    AriaInputContext,
  );
  const input = useRender({
    defaultTagName: "input",
    render,
    ref: inputRef,
    props: [
      inputProps,
      {
        className: cn(
          inputVariants({
            size: context.size,
            variant: context.hasError ? "error" : "default",
          }),
          "w-full disabled:cursor-not-allowed",
          iconStyles.padding,
        ),
      },
    ],
  });
  return (
    <div
      className={cn(
        "relative inline-block w-full has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      {input}
      <button
        type="button"
        disabled={context.disabled || context.readOnly}
        data-kumo-component="Combobox"
        data-kumo-part="clear"
        aria-label={clearLabel}
        tabIndex={-1}
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0",
          !hasValue && "pointer-events-none opacity-0",
          iconStyles.clearRight,
        )}
        onClick={() => {
          state?.setInputValue("");
          state?.setValue(context.multiple ? [] : null);
        }}
      >
        <X aria-hidden="true" size={iconStyles.iconSize} />
      </button>
      <AriaButton
        data-kumo-component="Combobox"
        data-kumo-part="trigger"
        aria-label={showOptionsLabel}
        className={cn(
          "absolute top-1/2 m-0 flex -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-kumo-subtle",
          iconStyles.caretRight,
        )}
      >
        <CaretDown aria-hidden="true" size={iconStyles.iconSize} />
      </AriaButton>
    </div>
  );
}

export type ComboboxItemProps<T = unknown> = Omit<
  AriaListBoxItemProps<object>,
  "children" | "id" | "isDisabled" | "textValue" | "value"
> & {
  children: OctaneNode;
  disabled?: boolean;
  id?: SelectionKey;
  textValue?: string;
  value: T;
};

function Item<T>({
  children,
  className,
  disabled,
  id,
  textValue,
  value,
  ...props
}: ComboboxItemProps<T>) {
  const context = useContext(ComboboxContext)!;
  const resolvedText =
    textValue ??
    (typeof children === "string"
      ? children
      : (context.itemToStringLabel?.(value) ?? textFromSelectionValue(value)));
  const key = context.registry.register(value, id);
  context.registry.registerText(value, resolvedText);

  return (
    <AriaListBoxItem
      {...props}
      id={key}
      value={value as object}
      textValue={resolvedText}
      isDisabled={disabled}
      data-kumo-component="Combobox"
      data-kumo-part="item"
      className={cn(
        "group mx-1.5 grid cursor-pointer grid-cols-[1fr_16px] gap-2 rounded px-2 py-1.5 text-base outline-none",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-kumo-subtle data-[disabled]:opacity-60 data-[focused]:bg-kumo-tint",
        className,
      )}
    >
      {({ isSelected }: { isSelected: boolean }) => (
        <>
          <div className={cn("col-start-1")}>{children}</div>
          {isSelected ? (
            <span className={cn("col-start-2 flex items-center")}>
              <Check aria-hidden="true" />
            </span>
          ) : null}
        </>
      )}
    </AriaListBoxItem>
  );
}

export type ComboboxListProps<T = object> = {
  children?: OctaneNode;
  className?: string;
  dependencies?: readonly unknown[];
  items?: readonly T[];
};

function List<T extends object = object>({
  className,
  ...props
}: ComboboxListProps<T>) {
  return (
    <AriaListBox
      {...props}
      className={cn(
        "min-h-0 flex-1 scroll-pt-2 scroll-pb-2 overflow-y-auto overscroll-contain",
        className,
      )}
    />
  );
}

export type ComboboxEmptyProps = {
  children?: OctaneNode;
  className?: string;
};

function Empty({
  children = "No labels found.",
  className,
}: ComboboxEmptyProps) {
  const state = useContext(AriaComboBoxStateContext);
  if (state && state.collection.size > 0) return null;
  return (
    <div
      role="option"
      className={cn(
        "mx-1.5 shrink-0 px-4 py-2 text-[0.925rem] leading-4 text-kumo-subtle empty:m-0 empty:p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Input({ className, ...props }: ComboboxInputProps) {
  return (
    <AriaInput
      {...props}
      className={cn(
        inputVariants(),
        "mx-0 -mt-1.5 w-full shrink-0 rounded-b-none first:mb-2",
        className,
      )}
    />
  );
}

export type ComboboxGroupLabelProps = Omit<
  JSX.IntrinsicElements["header"],
  "children"
> & { children: OctaneNode };

function GroupLabel({ className, ...props }: ComboboxGroupLabelProps) {
  return (
    <AriaHeader
      {...props}
      className={cn("mx-1.5 px-2 py-1.5 text-sm text-kumo-subtle", className)}
    />
  );
}

export type ComboboxGroupProps<T = object> = {
  children: OctaneNode;
  className?: string;
  id?: SelectionKey;
  items?: readonly T[];
  value?: T;
};

function Group<T extends object = object>({
  className,
  ...props
}: ComboboxGroupProps<T>) {
  return (
    <AriaListBoxSection
      {...props}
      className={cn(
        "mt-2 border-t border-kumo-hairline pt-2 first:mt-0 first:border-t-0 first:pt-0",
        className,
      )}
    />
  );
}

const sizeToMinHeight: Record<KumoComboboxSize, string> = {
  xs: "min-h-5",
  sm: "min-h-6.5",
  base: "min-h-9",
  lg: "min-h-10",
};

export type TriggerMultipleWithInputProps<Value> = {
  className?: string;
  inputSide?: KumoComboboxInputSide;
  placeholder?: string;
  renderItem: (value: Value) => OctaneNode;
  value?: Value[];
};

function TriggerMultipleWithInput<Value>({
  placeholder,
  renderItem,
  className,
  inputSide = KUMO_COMBOBOX_DEFAULT_VARIANTS.inputSide,
  value,
}: TriggerMultipleWithInputProps<Value>) {
  const context = useContext(ComboboxContext)!;
  const applicationValues = Array.isArray(context.value)
    ? (context.value as Value[])
    : [];
  const state = useContext(AriaComboBoxStateContext);
  const renderInput = (inputClassName: string) => (
    <AriaInput
      placeholder={placeholder}
      className={cn(inputClassName)}
      onKeyDown={(
        event: KeyboardEvent & { currentTarget: HTMLInputElement },
      ) => {
        if (context.disabled || context.readOnly || event.currentTarget.value)
          return;
        if (event.key === "Backspace" && applicationValues.length) {
          event.preventDefault();
          state?.setValue(
            applicationValues
              .slice(0, -1)
              .map((item) => context.registry.keyFor(item)),
          );
        } else if (event.key === "ArrowLeft") {
          const chips = event.currentTarget
            .closest("[data-kumo-chips]")
            ?.querySelectorAll<HTMLElement>("[data-kumo-combobox-chip]");
          chips?.[chips.length - 1]?.focus();
          event.preventDefault();
        }
      }}
    />
  );
  return (
    <div
      data-kumo-chips=""
      className={cn(
        inputVariants({
          size: context.size,
          variant: context.hasError ? "error" : "default",
        }),
        "flex h-auto flex-col gap-1 px-1.5 py-1 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        sizeToMinHeight[context.size],
        className,
      )}
    >
      {inputSide === "top"
        ? renderInput("w-full border-0 bg-inherit px-2 py-1")
        : null}
      <div className={cn("flex flex-1 flex-wrap items-center gap-1.5")}>
        <AriaComboBoxValue<Value> className={cn("contents")}>
          {() =>
            (value ?? applicationValues).map((item) => (
              <ChipValueContext.Provider
                key={context.registry.keyFor(item)}
                value={item}
              >
                {renderItem(item)}
              </ChipValueContext.Provider>
            ))
          }
        </AriaComboBoxValue>
        {inputSide === "right"
          ? renderInput("min-w-[100px] flex-1 border-0 bg-inherit px-2 py-1")
          : null}
      </div>
    </div>
  );
}

export type ComboboxChipProps = Omit<
  JSX.IntrinsicElements["span"],
  "children"
> & {
  children?: OctaneNode;
  removeLabel?: string;
  value?: unknown;
};

function Chip({
  children,
  className,
  removeLabel = "Remove",
  value: valueProp,
  ...props
}: ComboboxChipProps) {
  const context = useContext(ComboboxContext)!;
  const contextValue = useContext(ChipValueContext);
  const value = valueProp ?? contextValue;
  const state = useContext(AriaComboBoxStateContext);
  return (
    <span
      {...props}
      data-kumo-combobox-chip=""
      tabIndex={-1}
      className={cn(
        "flex h-6 items-center gap-2.5 rounded-sm bg-kumo-overlay pr-[3px] pl-2 text-sm ring-1 ring-kumo-hairline",
        className,
      )}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || context.disabled || context.readOnly)
          return;
        const chip = event.currentTarget;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const chips = Array.from(
            chip.parentElement?.querySelectorAll<HTMLElement>(
              "[data-kumo-combobox-chip]",
            ) ?? [],
          );
          const offset = event.key === "ArrowLeft" ? -1 : 1;
          const next = chips[chips.indexOf(chip) + offset];
          if (next) next.focus();
          else if (offset > 0)
            chip
              .closest("[data-kumo-chips]")
              ?.querySelector<HTMLInputElement>("input")
              ?.focus();
          event.preventDefault();
        }
        if (event.key === "Backspace" || event.key === "Delete") {
          if (value === undefined || !state) return;
          const sibling = (
            event.key === "Backspace"
              ? chip.previousElementSibling
              : chip.nextElementSibling
          ) as HTMLElement | null;
          const removeKey = context.registry.keyFor(value);
          const keys = Array.isArray(state.value) ? state.value : [];
          state.setValue(keys.filter((key) => key !== removeKey));
          sibling?.focus();
          event.preventDefault();
        }
      }}
    >
      <span className={cn("contents")}>{children}</span>
      <button
        type="button"
        disabled={context.disabled || context.readOnly}
        data-kumo-component="Combobox"
        data-kumo-part="chip-remove"
        aria-label={removeLabel}
        className={cn(
          "flex cursor-pointer rounded-md border-0 bg-transparent p-1 hover:bg-kumo-fill-hover",
        )}
        onClick={(event) => {
          event.stopPropagation();
          if (value === undefined || !state) return;
          const removeKey = context.registry.keyFor(value);
          const keys = Array.isArray(state.value) ? state.value : [];
          state.setValue(keys.filter((key) => key !== removeKey));
        }}
      >
        <X aria-hidden="true" size={10} />
      </button>
    </span>
  );
}

export type ComboboxTriggerProps = Omit<
  AriaButtonProps,
  "children" | "className"
> & {
  children?: OctaneNode;
  className?: string;
  render?: ComboboxTriggerRender;
};

function Trigger({ children, render, ...props }: ComboboxTriggerProps) {
  return (
    <NativeComboboxTrigger {...props} render={render}>
      {children}
    </NativeComboboxTrigger>
  );
}

function Value<Value>({
  children,
  ...props
}: {
  children?: OctaneNode;
  className?: string;
  placeholder?: OctaneNode;
}) {
  const context = useContext(ComboboxContext)!;
  const renderedChildren =
    typeof children === "function" ? () => children(context.value) : children;
  return (
    <AriaComboBoxValue<Value> {...props}>{renderedChildren}</AriaComboBoxValue>
  );
}

function Icon({
  children,
  className,
}: {
  children?: OctaneNode;
  className?: string;
}) {
  return <span className={cn("flex items-center", className)}>{children}</span>;
}

function useFilter(options: ComboboxFilterOptions = {}): ComboboxFilter {
  const { multiple: _multiple, value: _value, ...collatorOptions } = options;
  return getSelectionFilter(collatorOptions);
}

export const Combobox = Object.assign(Root, {
  Chip,
  Collection: AriaCollection,
  Content,
  Empty,
  Group,
  GroupLabel,
  Icon,
  Input,
  Item,
  List,
  Trigger,
  TriggerInput,
  TriggerMultipleWithInput,
  TriggerValue,
  Value,
  useFilter,
});

for (const [component, displayName] of [
  [Root, "Combobox.Root"],
  [Content, "Combobox.Content"],
  [TriggerValue, "Combobox.TriggerValue"],
  [TriggerInput, "Combobox.TriggerInput"],
  [TriggerMultipleWithInput, "Combobox.TriggerMultipleWithInput"],
  [Item, "Combobox.Item"],
  [Chip, "Combobox.Chip"],
  [Input, "Combobox.Input"],
  [Empty, "Combobox.Empty"],
  [Group, "Combobox.Group"],
  [GroupLabel, "Combobox.GroupLabel"],
  [List, "Combobox.List"],
] as const) {
  Object.assign(component, { displayName });
}
