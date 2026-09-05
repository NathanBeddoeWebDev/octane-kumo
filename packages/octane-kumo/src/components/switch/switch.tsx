/** @jsxImportSource octane */
import {
  Switch as BaseSwitch,
  type SwitchRootState,
} from "@octanejs/base-ui/switch";
import { Field as FieldBase } from "@octanejs/base-ui/field";
import { Fieldset } from "@octanejs/base-ui/fieldset";
import { createContext, useContext, useId, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Label } from "../label/label";
import { activateControlFromLabel } from "../../utils/activate-control-from-label";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export const KUMO_SWITCH_VARIANTS = {
  size: {
    sm: {
      classes: "h-5.5 w-8.5",
      description: "Small switch for compact UIs",
    },
    base: {
      classes: "h-6.5 w-10.5",
      description: "Default switch size",
    },
    lg: {
      classes: "h-7.5 w-12.5",
      description: "Large switch for prominent toggles",
    },
  },
  variant: {
    default: {
      classes: "",
      description: "Default switch with squircle shape and brand color",
    },
    neutral: {
      classes: "",
      description: "Monochrome switch with squircle shape for subtle toggles",
    },
  },
} as const;

export const KUMO_SWITCH_DEFAULT_VARIANTS = {
  size: "base",
  variant: "default",
} as const;

export type KumoSwitchSize = keyof typeof KUMO_SWITCH_VARIANTS.size;
export type KumoSwitchVariant = keyof typeof KUMO_SWITCH_VARIANTS.variant;

export interface KumoSwitchVariantsProps {
  size?: KumoSwitchSize;
  variant?: KumoSwitchVariant;
}

export function switchVariants({
  size = KUMO_SWITCH_DEFAULT_VARIANTS.size,
  variant = KUMO_SWITCH_DEFAULT_VARIANTS.variant,
}: KumoSwitchVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_SWITCH_VARIANTS.size,
      size,
      KUMO_SWITCH_DEFAULT_VARIANTS.size,
    ).classes,
    resolveVariant(
      KUMO_SWITCH_VARIANTS.variant,
      variant,
      KUMO_SWITCH_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

export type SwitchSize = KumoSwitchSize;
export type SwitchVariant = KumoSwitchVariant;

type NativeButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "children" | "value"
>;
type NativeButtonValue = JSX.IntrinsicElements["button"]["value"];
type SwitchRef = NativeButtonProps["ref"];

export type SwitchProps = NativeButtonProps & {
  checked?: boolean;
  controlFirst?: boolean;
  defaultChecked?: boolean;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  onCheckedChange?: (checked: boolean) => void;
  readOnly?: boolean;
  required?: boolean;
  size?: KumoSwitchSize;
  transitioning?: boolean;
  uncheckedValue?: string;
  value?: NativeButtonValue;
  variant?: SwitchVariant;
};

export interface SwitchLegendProps {
  children: OctaneNode;
  className?: string;
}

export interface SwitchGroupProps {
  children: OctaneNode;
  className?: string;
  controlFirst?: boolean;
  description?: OctaneNode;
  disabled?: boolean;
  error?: string;
  legend?: string;
}

export interface SwitchItemProps {
  checked?: boolean;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  label: string;
  name?: string;
  onCheckedChange?: (checked: boolean) => void;
  readOnly?: boolean;
  ref?: SwitchRef;
  size?: KumoSwitchSize;
  transitioning?: boolean;
  uncheckedValue?: string;
  value?: string;
  variant?: SwitchVariant;
}

const SWITCH_CONTROL_SIZES = {
  sm: { slide: "left-4", thumb: "h-4 w-4", track: "h-4 w-8" },
  base: {
    slide: "left-4.5",
    thumb: "h-4.5 w-4.5",
    track: "h-4.5 w-9",
  },
  lg: { slide: "left-5", thumb: "h-5 w-5", track: "h-5 w-10" },
} as const;

const SwitchGroupContext = createContext({
  controlFirst: true,
  disabled: false,
});

interface SwitchControlProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  checked?: boolean;
  className?: JSX.IntrinsicElements["button"]["className"];
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  name?: string;
  onCheckedChange?: (checked: boolean) => void;
  readOnly?: boolean;
  ref?: SwitchRef;
  required?: boolean;
  size: KumoSwitchSize;
  transitioning?: boolean;
  uncheckedValue?: string;
  value?: NativeButtonValue;
  variant: SwitchVariant;
  [key: string]: unknown;
}

function SwitchControl({
  checked,
  className,
  defaultChecked,
  disabled,
  form,
  name,
  onCheckedChange,
  readOnly,
  ref,
  required,
  size,
  transitioning,
  uncheckedValue,
  value,
  variant,
  ...buttonProps
}: SwitchControlProps) {
  const styles = SWITCH_CONTROL_SIZES[size];

  return (
    <BaseSwitch.Root
      {...buttonProps}
      checked={checked}
      className={(state: SwitchRootState) =>
        cn(
          "relative inline-flex shrink-0 cursor-pointer items-center border-none p-0 ring",
          "rounded-[5px] [corner-shape:squircle] supports-[corner-shape:squircle]:rounded-[10px]",
          "transition-colors duration-150 ease-out motion-reduce:transition-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          styles.track,
          state.checked
            ? variant === "neutral"
              ? "bg-kumo-contrast ring-kumo-contrast"
              : "bg-kumo-brand ring-kumo-brand"
            : "bg-kumo-fill ring-kumo-interact",
          className,
        )
      }
      data-kumo-component="Switch"
      defaultChecked={defaultChecked}
      disabled={disabled}
      form={form}
      name={name}
      nativeButton
      onCheckedChange={onCheckedChange}
      readOnly={readOnly}
      ref={ref}
      render={<button type="button" value={value} />}
      required={required}
      uncheckedValue={uncheckedValue}
      value={value === undefined ? undefined : String(value)}
      aria-busy={transitioning || undefined}
    >
      <BaseSwitch.Thumb
        className={(state: SwitchRootState) =>
          cn(
            "absolute top-0 bottom-0 bg-kumo-base",
            "rounded-[5px] [corner-shape:squircle] supports-[corner-shape:squircle]:rounded-[10px]",
            "shadow-[0_0_1px_0.5px_var(--color-kumo-shadow-edge),0_1px_2px_var(--color-kumo-shadow-drop)]",
            "transition-all duration-150 ease-out motion-reduce:transition-none",
            styles.thumb,
            state.checked ? styles.slide : "left-0",
          )
        }
      />
    </BaseSwitch.Root>
  );
}

export function SwitchRoot({
  checked,
  className,
  controlFirst = true,
  defaultChecked,
  disabled,
  form,
  label,
  labelTooltip,
  name,
  onCheckedChange,
  readOnly,
  ref,
  required,
  size = KUMO_SWITCH_DEFAULT_VARIANTS.size,
  transitioning,
  uncheckedValue,
  value,
  variant = KUMO_SWITCH_DEFAULT_VARIANTS.variant,
  ...buttonProps
}: SwitchProps) {
  const control = (
    <SwitchControl
      {...buttonProps}
      aria-label={buttonProps["aria-label"] ?? (!label ? "Switch" : undefined)}
      checked={checked}
      className={className}
      defaultChecked={defaultChecked}
      disabled={disabled}
      form={form}
      name={name}
      onCheckedChange={onCheckedChange}
      readOnly={readOnly}
      ref={ref}
      required={required}
      size={size}
      transitioning={transitioning}
      uncheckedValue={uncheckedValue}
      value={value}
      variant={variant}
    />
  );

  if (!label) return control;

  return (
    <FieldBase.Root className={cn("flex")}>
      <FieldBase.Label
        className={cn(
          "!m-0 inline-flex !min-h-0 items-center gap-2 !text-base",
          controlFirst ? "flex-row" : "flex-row-reverse justify-end",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
        nativeLabel={false}
        onClick={activateControlFromLabel}
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

export function SwitchItem({
  checked,
  className,
  defaultChecked,
  disabled: disabledProp,
  form,
  label,
  name,
  onCheckedChange,
  readOnly,
  ref,
  size = KUMO_SWITCH_DEFAULT_VARIANTS.size,
  transitioning,
  uncheckedValue,
  value,
  variant = KUMO_SWITCH_DEFAULT_VARIANTS.variant,
}: SwitchItemProps) {
  const { controlFirst, disabled: groupDisabled } =
    useContext(SwitchGroupContext);
  const disabled = groupDisabled || disabledProp;
  const labelId = useId();

  return (
    <span
      className={cn(
        "relative m-0 inline-flex items-center gap-2",
        !controlFirst && "flex-row-reverse justify-end",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
      data-kumo-component="Switch"
      data-kumo-part="item-label"
      onClick={activateControlFromLabel}
    >
      <SwitchControl
        aria-labelledby={labelId}
        checked={checked}
        data-kumo-part="item"
        defaultChecked={defaultChecked}
        disabled={disabled}
        form={form}
        name={name}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        ref={ref}
        size={size}
        transitioning={transitioning}
        uncheckedValue={uncheckedValue}
        value={value}
        variant={variant}
      />
      <span
        className={cn("text-base font-medium text-kumo-default")}
        id={labelId}
      >
        {label}
      </span>
    </span>
  );
}

export function SwitchLegend({ children, className }: SwitchLegendProps) {
  return (
    <Fieldset.Legend
      className={cn("text-base font-medium text-kumo-default", className)}
    >
      {children}
    </Fieldset.Legend>
  );
}

export function SwitchGroup({
  children,
  className,
  controlFirst = true,
  description,
  disabled = false,
  error,
  legend,
}: SwitchGroupProps) {
  return (
    <SwitchGroupContext.Provider value={{ controlFirst, disabled }}>
      <Fieldset.Root
        className={cn("flex flex-col gap-4", className)}
        disabled={disabled}
      >
        {legend ? <SwitchLegend>{legend}</SwitchLegend> : null}
        <div className={cn("flex flex-col gap-2")}>{children}</div>
        {error ? (
          <p className={cn("text-sm text-kumo-danger")}>{error}</p>
        ) : null}
        {description ? (
          <p className={cn("text-sm text-kumo-subtle")}>{description}</p>
        ) : null}
      </Fieldset.Root>
    </SwitchGroupContext.Provider>
  );
}

export const Switch = Object.assign(SwitchRoot, {
  Group: SwitchGroup,
  Item: SwitchItem,
  Legend: SwitchLegend,
});
