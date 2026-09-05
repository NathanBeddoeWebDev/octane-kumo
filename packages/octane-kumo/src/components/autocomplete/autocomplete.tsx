/** @jsxImportSource octane */
import {
  Collection as AriaCollection,
  ComboBox as AriaComboBox,
  ComboBoxStateContext as AriaComboBoxStateContext,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  Separator as AriaSeparator,
  type InputProps as AriaInputProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type Placement,
} from "@octanejs/aria/components";
import { Check } from "@octanejs/phosphor-icons";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { createContext, useContext, useMemo, type OctaneNode } from "octane";
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
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";
import { type FieldErrorMatch } from "../field/field";
import { SelectionFieldPresentation } from "../../utils/selection-field";
import { inputVariants, KUMO_INPUT_VARIANTS } from "../input/input";

export const KUMO_AUTOCOMPLETE_VARIANTS = {
  size: KUMO_INPUT_VARIANTS.size,
} as const;

export const KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS = {
  size: "base",
} as const;

export type KumoAutocompleteSize = keyof typeof KUMO_AUTOCOMPLETE_VARIANTS.size;

export interface KumoAutocompleteVariantsProps {
  size?: KumoAutocompleteSize;
}

export type AutocompleteFilter = SelectionFilter;

export function autocompleteVariants({
  size = KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS.size,
}: KumoAutocompleteVariantsProps = {}) {
  return cn(KUMO_AUTOCOMPLETE_VARIANTS.size[size].classes);
}

type AutocompleteError =
  | string
  | { message: OctaneNode; match: FieldErrorMatch };

type AutocompleteContextValue = {
  hasError: boolean;
  itemToStringValue?: (value: unknown) => string;
  registry: SelectionValueRegistry<unknown>;
};

const AutocompleteContext = createContext<AutocompleteContextValue | null>(
  null,
);

export type AutocompleteProps<ItemValue = unknown> = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  autoFocus?: boolean;
  children: OctaneNode;
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string | number | string[];
  description?: OctaneNode;
  disabled?: boolean;
  error?: AutocompleteError;
  filter?: (
    item: ItemValue,
    query: string,
    itemToString?: (item: ItemValue) => string,
  ) => boolean;
  form?: string;
  id?: string;
  itemToStringValue?: (item: ItemValue) => string;
  items: readonly ItemValue[];
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  name?: string;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  openOnInputClick?: boolean;
  readOnly?: boolean;
  required?: boolean;
  value?: string | number | string[];
};

function valueAsString(value: string | number | string[] | undefined) {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function Root<ItemValue>({
  label,
  required,
  labelTooltip,
  description,
  error,
  children,
  items,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  readOnly,
  itemToStringValue,
  filter,
  openOnInputClick,
  ...props
}: AutocompleteProps<ItemValue>) {
  const flatItems = useMemo(() => flattenSelectionItems(items), [items]);
  const registry = useMemo(
    () => new SelectionValueRegistry(flatItems),
    [flatItems],
  );
  const context: AutocompleteContextValue = {
    hasError: Boolean(error),
    itemToStringValue: itemToStringValue as
      | ((value: unknown) => string)
      | undefined,
    registry: registry as SelectionValueRegistry<unknown>,
  };
  const normalizedError = error
    ? typeof error === "string"
      ? { message: error, match: true as const }
      : error
    : undefined;
  const control = (
    <AutocompleteContext.Provider value={context}>
      <AriaComboBox
        {...props}
        allowsCustomValue
        className={cn("grid min-w-0 gap-2", props.className)}
        defaultItems={items as readonly object[]}
        isDisabled={disabled}
        isInvalid={Boolean(error)}
        isOpen={open}
        defaultOpen={defaultOpen}
        isReadOnly={readOnly}
        isRequired={required}
        inputValue={valueAsString(value)}
        defaultInputValue={valueAsString(defaultValue)}
        menuTrigger={openOnInputClick ? "focus" : "input"}
        onInputChange={onValueChange}
        onOpenChange={onOpenChange}
        defaultFilter={
          filter
            ? (text, query) => {
                const item = registry.valueForText(text);
                return item === undefined
                  ? false
                  : filter(item, query, itemToStringValue);
              }
            : undefined
        }
      >
        <SelectionFieldPresentation
          label={label}
          labelTooltip={labelTooltip}
          required={required}
          description={description}
          error={normalizedError}
        >
          {children}
        </SelectionFieldPresentation>
      </AriaComboBox>
    </AutocompleteContext.Provider>
  );

  return control;
}

export type AutocompleteInputGroupProps = Omit<AriaInputProps, "className"> & {
  className?: string;
  size?: KumoAutocompleteSize;
};

function InputGroup({
  className,
  size = KUMO_AUTOCOMPLETE_DEFAULT_VARIANTS.size,
  ...props
}: AutocompleteInputGroupProps) {
  const context = useContext(AutocompleteContext)!;
  return (
    <AriaInput
      {...props}
      className={cn(
        inputVariants({
          size,
          variant: context.hasError ? "error" : "default",
          focusIndicator: true,
        }),
        "w-full",
        className,
      )}
    />
  );
}

export type AutocompleteContentProps = {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  children?: OctaneNode;
  className?: string;
  container?: PortalContainer;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
};

function Content({
  children,
  className,
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  side = "bottom",
  container: containerProp,
}: AutocompleteContentProps) {
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
        "flex max-h-[min(var(--available-height),24rem)] min-w-(--trigger-width) flex-col rounded-lg bg-kumo-control py-1.5 text-kumo-default shadow-lg ring ring-kumo-line",
        state?.collection.size === 0 && "hidden",
        className,
      )}
    >
      {!state || state.isOpen ? children : null}
    </AriaPopover>
  );
}

export type AutocompleteListProps<T = object> = {
  children?: OctaneNode;
  className?: string;
  dependencies?: readonly unknown[];
  items?: readonly T[];
};

function List<T extends object = object>({
  className,
  ...props
}: AutocompleteListProps<T>) {
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

export type AutocompleteItemProps<T = unknown> = Omit<
  AriaListBoxItemProps<object>,
  "children" | "id" | "isDisabled" | "textValue" | "value"
> & {
  children: OctaneNode;
  disabled?: boolean;
  id?: string | number;
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
}: AutocompleteItemProps<T>) {
  const context = useContext(AutocompleteContext)!;
  const resolvedText =
    textValue ??
    (typeof children === "string"
      ? children
      : (context.itemToStringValue?.(value) ?? textFromSelectionValue(value)));
  const key = context.registry.register(value, id);
  context.registry.registerText(value, resolvedText);
  return (
    <AriaListBoxItem
      {...props}
      id={key}
      value={value as object}
      textValue={resolvedText}
      isDisabled={disabled}
      data-kumo-component="Autocomplete"
      data-kumo-part="item"
      className={cn(
        "group mx-1.5 grid cursor-pointer grid-cols-[1fr_16px] gap-2 rounded px-2 py-1.5 text-base outline-none",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[focused]:bg-kumo-overlay data-[selected]:font-medium",
        className,
      )}
    >
      {({ isSelected }: { isSelected: boolean }) => (
        <>
          <div className={cn("col-start-1")}>{children}</div>
          {isSelected ? (
            <span className={cn("col-start-2 flex items-center")}>
              <Check aria-hidden="true" size={14} />
            </span>
          ) : null}
        </>
      )}
    </AriaListBoxItem>
  );
}

export type AutocompleteGroupLabelProps = Omit<
  JSX.IntrinsicElements["header"],
  "children"
> & { children: OctaneNode };

function GroupLabel({ className, ...props }: AutocompleteGroupLabelProps) {
  return (
    <AriaHeader
      {...props}
      className={cn("mx-1.5 px-2 py-1.5 text-sm text-kumo-strong", className)}
    />
  );
}

export type AutocompleteGroupProps<T = object> = {
  children: OctaneNode;
  className?: string;
  id?: string | number;
  items?: readonly T[];
  value?: T;
};

function Group<T extends object = object>({
  className,
  ...props
}: AutocompleteGroupProps<T>) {
  return (
    <AriaListBoxSection
      {...props}
      className={cn(
        "mt-2 border-t border-kumo-line pt-2 first:mt-0 first:border-t-0 first:pt-0",
        className,
      )}
    />
  );
}

export type AutocompleteSeparatorProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

function Separator({ className, ...props }: AutocompleteSeparatorProps) {
  return (
    <AriaSeparator
      {...props}
      className={cn("mx-0 my-1 h-px bg-kumo-line", className)}
    />
  );
}

export type AutocompleteEmptyProps = {
  children?: OctaneNode;
  className?: string;
};

function Empty({ children, className }: AutocompleteEmptyProps) {
  const state = useContext(AriaComboBoxStateContext);
  if (state && state.collection.size > 0) return null;
  return (
    <div
      role="option"
      className={cn("px-4 py-2 text-sm text-kumo-subtle", className)}
    >
      {children}
    </div>
  );
}

function useFilter(options?: SelectionFilterOptions): AutocompleteFilter {
  return getSelectionFilter(options);
}

export const Autocomplete = Object.assign(Root, {
  Collection: AriaCollection,
  Content,
  Empty,
  Group,
  GroupLabel,
  InputGroup,
  Item,
  List,
  Separator,
  useFilter,
});

for (const [component, displayName] of [
  [Root, "Autocomplete.Root"],
  [InputGroup, "Autocomplete.InputGroup"],
  [Content, "Autocomplete.Content"],
  [List, "Autocomplete.List"],
  [Item, "Autocomplete.Item"],
  [Group, "Autocomplete.Group"],
  [GroupLabel, "Autocomplete.GroupLabel"],
  [Separator, "Autocomplete.Separator"],
] as const) {
  Object.assign(component, { displayName });
}
