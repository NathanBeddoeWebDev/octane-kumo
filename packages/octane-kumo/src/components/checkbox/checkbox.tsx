/** @jsxImportSource octane */
import {
  Checkbox as BaseCheckbox,
  type CheckboxIndicatorState,
} from "@octanejs/base-ui/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@octanejs/base-ui/checkbox-group";
import { Field as FieldBase } from "@octanejs/base-ui/field";
import { Fieldset } from "@octanejs/base-ui/fieldset";
import { Check, Minus } from "@octanejs/phosphor-icons";
import { createContext, useContext, useId, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Label } from "../label/label";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export interface CheckboxChangeEventDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  reason: "none";
  trigger: Element | undefined;
}

export const KUMO_CHECKBOX_VARIANTS = {
  variant: {
    default: {
      classes:
        "[&:focus-within>span]:ring-kumo-focus [&:hover>span]:ring-kumo-hairline",
      description: "Default checkbox appearance",
    },
    error: {
      classes: "[&>span]:ring-kumo-danger",
      description: "Error state for validation failures",
    },
  },
} as const;

export const KUMO_CHECKBOX_DEFAULT_VARIANTS = {
  variant: "default",
} as const;

export type KumoCheckboxVariant = keyof typeof KUMO_CHECKBOX_VARIANTS.variant;

export interface KumoCheckboxVariantsProps {
  variant?: KumoCheckboxVariant;
}

export function checkboxVariants({
  variant = KUMO_CHECKBOX_DEFAULT_VARIANTS.variant,
}: KumoCheckboxVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_CHECKBOX_VARIANTS.variant,
      variant,
      KUMO_CHECKBOX_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

export type CheckboxVariant = KumoCheckboxVariant;

type CheckboxRef = JSX.IntrinsicElements["button"]["ref"];

export interface CheckboxProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  checked?: boolean;
  className?: string;
  controlFirst?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  name?: string;
  onCheckedChange?: (
    checked: boolean,
    eventDetails: CheckboxChangeEventDetails,
  ) => void;
  readOnly?: boolean;
  ref?: CheckboxRef;
  required?: boolean;
  value?: string;
  variant?: CheckboxVariant;
}

export interface CheckboxLegendProps {
  children: OctaneNode;
  className?: string;
}

export interface CheckboxGroupProps {
  allValues?: string[];
  children: OctaneNode;
  className?: string;
  controlFirst?: boolean;
  defaultValue?: string[];
  description?: OctaneNode;
  disabled?: boolean;
  error?: string;
  legend?: string;
  onValueChange?: (value: string[]) => void;
  value?: string[];
}

export interface CheckboxItemProps {
  checked?: boolean;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label: string;
  name?: string;
  onCheckedChange?: (
    checked: boolean,
    eventDetails: CheckboxChangeEventDetails,
  ) => void;
  readOnly?: boolean;
  ref?: CheckboxRef;
  value?: string;
  variant?: CheckboxVariant;
}

const CheckboxGroupContext = createContext<{ controlFirst: boolean }>({
  controlFirst: true,
});

function activateCheckboxFromLabel(event: MouseEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest("button,input")) return;

  (event.currentTarget as HTMLElement)
    .querySelector<HTMLButtonElement>("[role=checkbox]")
    ?.click();
}

function CheckboxIndicator({ indeterminate }: { indeterminate?: boolean }) {
  return (
    <BaseCheckbox.Indicator
      keepMounted
      className={cn(
        "flex items-center justify-center text-kumo-inverse data-[unchecked]:invisible",
      )}
      render={(
        renderProps: JSX.IntrinsicElements["span"],
        state: CheckboxIndicatorState,
      ) => (
        <span {...renderProps}>
          {state.indeterminate || indeterminate ? (
            <Minus size={12} weight="bold" />
          ) : (
            <Check size={12} weight="bold" />
          )}
        </span>
      )}
    />
  );
}

function checkboxControlClasses({
  className,
  disabled,
  hasLabel,
  variant,
}: {
  className?: string;
  disabled?: boolean;
  hasLabel?: boolean;
  variant: CheckboxVariant;
}) {
  return cn(
    "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-0 bg-kumo-base ring after:absolute after:-inset-x-3 after:-inset-y-2 focus:outline-none",
    hasLabel && "mt-0.5",
    variant === "error" ? "ring-kumo-danger" : "ring-kumo-hairline",
    !disabled &&
      "hover:ring-kumo-hairline focus:ring-2 focus:ring-kumo-focus focus-visible:ring-2 focus-visible:ring-kumo-brand",
    "data-[checked]:bg-kumo-contrast data-[checked]:ring-kumo-contrast data-[indeterminate]:bg-kumo-contrast data-[indeterminate]:ring-kumo-contrast",
    disabled && "cursor-not-allowed",
    className,
  );
}

export function CheckboxRoot({
  checked,
  className,
  controlFirst = true,
  defaultChecked,
  disabled,
  indeterminate,
  label,
  labelTooltip,
  name,
  onCheckedChange,
  readOnly,
  ref,
  required,
  value,
  variant = KUMO_CHECKBOX_DEFAULT_VARIANTS.variant,
  ...props
}: CheckboxProps) {
  const hasAccessibleName =
    Boolean(label) ||
    Boolean(props["aria-label"]) ||
    Boolean(props["aria-labelledby"]);

  if (process.env.NODE_ENV !== "production" && !hasAccessibleName) {
    console.warn(
      "[Kumo Checkbox]: Checkbox must have an accessible name. Provide either:\n" +
        "  - label prop: <Checkbox label='Accept terms' />\n" +
        "  - aria-label: <Checkbox aria-label='Select item' />\n" +
        "  - aria-labelledby for custom label association\n" +
        "  Note: When used inside Checkbox.Group, label is optional",
    );
  }

  const control = (
    <BaseCheckbox.Root
      {...props}
      checked={checked}
      className={checkboxControlClasses({
        className: cn(disabled && "opacity-50", className),
        disabled,
        hasLabel: Boolean(label),
        variant,
      })}
      data-kumo-component="Checkbox"
      defaultChecked={defaultChecked}
      disabled={disabled}
      indeterminate={indeterminate}
      name={name}
      nativeButton
      onCheckedChange={onCheckedChange}
      readOnly={readOnly}
      ref={ref}
      render={<button type="button" />}
      required={required}
      value={value}
    >
      <CheckboxIndicator indeterminate={indeterminate} />
    </BaseCheckbox.Root>
  );

  if (!label) return control;

  return (
    <FieldBase.Root className={cn("inline-flex")}>
      <FieldBase.Label
        className={cn(
          "!m-0 inline-flex !min-h-0 items-start gap-2 !text-base",
          controlFirst ? "flex-row" : "flex-row-reverse justify-end",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
        nativeLabel={false}
        onClick={activateCheckboxFromLabel}
        render={<span />}
      >
        {control}
        <Label
          asContent
          showOptional={required === false}
          tooltip={labelTooltip}
        >
          {label}
        </Label>
      </FieldBase.Label>
    </FieldBase.Root>
  );
}

export function CheckboxItem({
  checked,
  className,
  defaultChecked,
  disabled,
  indeterminate,
  label,
  name,
  onCheckedChange,
  readOnly,
  ref,
  value,
  variant = KUMO_CHECKBOX_DEFAULT_VARIANTS.variant,
}: CheckboxItemProps) {
  const { controlFirst } = useContext(CheckboxGroupContext);
  const labelId = useId();

  return (
    <span
      className={cn(
        "relative m-0 inline-flex items-start gap-2",
        !controlFirst && "flex-row-reverse justify-end",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
      data-kumo-component="Checkbox"
      data-kumo-part="item-label"
      onClick={activateCheckboxFromLabel}
    >
      <BaseCheckbox.Root
        aria-labelledby={labelId}
        checked={checked}
        className={checkboxControlClasses({
          className: "peer",
          disabled,
          hasLabel: true,
          variant,
        })}
        data-kumo-component="Checkbox"
        data-kumo-part="item"
        defaultChecked={defaultChecked}
        disabled={disabled}
        indeterminate={indeterminate}
        name={name}
        nativeButton
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        ref={ref}
        render={<button type="button" />}
        value={value}
      >
        <CheckboxIndicator indeterminate={indeterminate} />
      </BaseCheckbox.Root>
      <span className={cn("text-base text-kumo-default")} id={labelId}>
        {label}
      </span>
    </span>
  );
}

export function CheckboxLegend({ children, className }: CheckboxLegendProps) {
  return (
    <Fieldset.Legend
      className={cn("text-base font-medium text-kumo-default", className)}
    >
      {children}
    </Fieldset.Legend>
  );
}

export function CheckboxGroup({
  allValues,
  children,
  className,
  controlFirst = true,
  defaultValue,
  description,
  disabled,
  error,
  legend,
  onValueChange,
  value,
}: CheckboxGroupProps) {
  return (
    <CheckboxGroupContext.Provider value={{ controlFirst }}>
      <BaseCheckboxGroup
        allValues={allValues}
        defaultValue={defaultValue}
        disabled={disabled}
        onValueChange={onValueChange}
        value={value}
      >
        <Fieldset.Root className={cn("flex flex-col gap-4", className)}>
          {legend ? <CheckboxLegend>{legend}</CheckboxLegend> : null}
          <div className={cn("flex flex-col gap-2")}>{children}</div>
          {error ? (
            <p className={cn("text-sm text-kumo-danger")}>{error}</p>
          ) : null}
          {description ? (
            <p className={cn("text-sm text-kumo-subtle")}>{description}</p>
          ) : null}
        </Fieldset.Root>
      </BaseCheckboxGroup>
    </CheckboxGroupContext.Provider>
  );
}

export const Checkbox = Object.assign(CheckboxRoot, {
  Group: CheckboxGroup,
  Item: CheckboxItem,
  Legend: CheckboxLegend,
});
