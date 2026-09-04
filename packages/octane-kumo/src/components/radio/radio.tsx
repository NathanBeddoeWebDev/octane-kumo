/** @jsxImportSource octane */
import {
  Radio as BaseRadio,
  type RadioRootState,
} from "@octanejs/base-ui/radio";
import { RadioGroup as BaseRadioGroup } from "@octanejs/base-ui/radio-group";
import { Fieldset } from "@octanejs/base-ui/fieldset";
import { createContext, useContext, useId, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { activateControlFromLabel } from "../../utils/activate-control-from-label";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export interface RadioGroupChangeEventDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  reason: "none";
  trigger: Element | undefined;
}

export const KUMO_RADIO_VARIANTS = {
  variant: {
    default: {
      classes: "ring-kumo-hairline",
      description: "Default radio appearance",
    },
    error: {
      classes: "ring-kumo-danger",
      description: "Error state for validation failures",
    },
  },
  appearance: {
    default: {
      classes: "",
      description: "Standard inline radio item",
    },
    card: {
      classes:
        "rounded-lg border border-kumo-hairline bg-kumo-base p-3 transition-colors hover:bg-kumo-tint has-[[data-checked]]:border-kumo-interact has-[[data-checked]]:bg-kumo-tint",
      description:
        "Choice card appearance with border, padding, and highlighted selection state",
    },
  },
} as const;

export const KUMO_RADIO_DEFAULT_VARIANTS = {
  variant: "default",
  appearance: "default",
} as const;

export type KumoRadioVariant = keyof typeof KUMO_RADIO_VARIANTS.variant;
export type KumoRadioAppearance = keyof typeof KUMO_RADIO_VARIANTS.appearance;

export interface KumoRadioVariantsProps {
  appearance?: KumoRadioAppearance;
  variant?: KumoRadioVariant;
}

export function radioVariants({
  appearance = KUMO_RADIO_DEFAULT_VARIANTS.appearance,
  variant = KUMO_RADIO_DEFAULT_VARIANTS.variant,
}: KumoRadioVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_RADIO_VARIANTS.variant,
      variant,
      KUMO_RADIO_DEFAULT_VARIANTS.variant,
    ).classes,
    resolveVariant(
      KUMO_RADIO_VARIANTS.appearance,
      appearance,
      KUMO_RADIO_DEFAULT_VARIANTS.appearance,
    ).classes,
  );
}

export type RadioVariant = KumoRadioVariant;
export type RadioControlPosition = "start" | "end";

export interface RadioLegendProps {
  children: OctaneNode;
  className?: string;
}

export interface RadioGroupProps<Value = string> {
  appearance?: KumoRadioAppearance;
  children: OctaneNode;
  className?: string;
  controlPosition?: RadioControlPosition;
  defaultValue?: Value;
  description?: OctaneNode;
  disabled?: boolean;
  error?: string;
  form?: string;
  legend?: string;
  name?: string;
  onValueChange?: (
    value: Value,
    eventDetails: RadioGroupChangeEventDetails,
  ) => void;
  orientation?: "vertical" | "horizontal";
  readOnly?: boolean;
  required?: boolean;
  value?: Value;
}

type RadioRef = JSX.IntrinsicElements["button"]["ref"];

export interface RadioItemProps<Value = string> {
  appearance?: KumoRadioAppearance;
  className?: string;
  description?: OctaneNode;
  disabled?: boolean;
  label: OctaneNode;
  ref?: RadioRef;
  value: Value;
  variant?: RadioVariant;
}

const RadioGroupContext = createContext<{
  appearance: KumoRadioAppearance;
  controlPosition: RadioControlPosition | undefined;
  disabled: boolean;
}>({
  appearance: KUMO_RADIO_DEFAULT_VARIANTS.appearance,
  controlPosition: undefined,
  disabled: false,
});

interface RadioControlProps<Value> {
  "aria-describedby"?: string;
  "aria-labelledby": string;
  disabled?: boolean;
  expandHitArea?: boolean;
  ref?: RadioRef;
  value: Value;
  variant: RadioVariant;
}

function RadioControl<Value>({
  disabled,
  expandHitArea,
  ref,
  value,
  variant,
  ...ariaProps
}: RadioControlProps<Value>) {
  return (
    <BaseRadio.Root
      {...ariaProps}
      className={cn(
        "relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-0 bg-kumo-base ring focus:outline-none",
        expandHitArea && "after:absolute after:-inset-x-3 after:-inset-y-2",
        variant === "error" ? "ring-kumo-danger" : "ring-kumo-line",
        !disabled &&
          variant !== "error" &&
          "group-hover:ring-kumo-hairline focus:ring-2 focus:ring-kumo-focus focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:outline-offset-3",
        !disabled &&
          variant === "error" &&
          "focus:ring-2 focus:ring-kumo-focus focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:outline-offset-3",
        "data-[checked]:bg-kumo-contrast",
      )}
      data-kumo-component="Radio"
      data-kumo-part="item"
      disabled={disabled}
      nativeButton
      ref={ref}
      render={<button type="button" />}
      value={value}
    >
      <BaseRadio.Indicator
        keepMounted
        className={(state: RadioRootState) =>
          cn("flex items-center justify-center", !state.checked && "invisible")
        }
      >
        <span className={cn("h-2 w-2 rounded-full bg-kumo-base")} />
      </BaseRadio.Indicator>
    </BaseRadio.Root>
  );
}

export function RadioItem<Value = string>({
  appearance: appearanceProp,
  className,
  description,
  disabled: disabledProp,
  label,
  ref,
  value,
  variant = KUMO_RADIO_DEFAULT_VARIANTS.variant,
}: RadioItemProps<Value>) {
  const {
    appearance: groupAppearance,
    controlPosition,
    disabled: groupDisabled,
  } = useContext(RadioGroupContext);
  const appearance = appearanceProp ?? groupAppearance;
  const disabled = groupDisabled || disabledProp;
  const isCard = appearance === "card";
  const effectiveControlPosition =
    controlPosition ?? (isCard ? "end" : "start");
  const labelId = useId();
  const descriptionId = useId();
  const control = (
    <RadioControl
      aria-describedby={description && isCard ? descriptionId : undefined}
      aria-labelledby={labelId}
      disabled={disabled}
      expandHitArea={!isCard}
      ref={ref}
      value={value}
      variant={variant}
    />
  );

  if (isCard) {
    return (
      <span
        className={cn(
          "group relative m-0 flex items-start gap-3 rounded-lg border border-kumo-hairline bg-kumo-base p-3 transition-colors has-[[data-checked]]:border-kumo-interact has-[[data-checked]]:bg-kumo-tint",
          effectiveControlPosition === "start" && "flex-row-reverse",
          variant === "error" &&
            "border-kumo-danger has-data-checked:border-kumo-danger has-data-checked:bg-kumo-base",
          disabled
            ? "cursor-not-allowed opacity-50"
            : cn(
                "cursor-pointer has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50",
                variant !== "error" &&
                  "hover:not-has-data-disabled:bg-kumo-tint",
              ),
          className,
        )}
        data-kumo-component="Radio"
        data-kumo-part="item-label"
        onClick={activateControlFromLabel}
      >
        <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5")}>
          <span
            className={cn("text-base font-medium text-kumo-default")}
            id={labelId}
          >
            {label}
          </span>
          {description ? (
            <span className={cn("text-sm text-kumo-subtle")} id={descriptionId}>
              {description}
            </span>
          ) : null}
        </div>
        {control}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "group relative m-0 inline-flex items-start gap-2",
        effectiveControlPosition === "end" && "flex-row-reverse justify-end",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
      data-kumo-component="Radio"
      data-kumo-part="item-label"
      onClick={activateControlFromLabel}
    >
      {control}
      <span className={cn("text-base text-kumo-default")} id={labelId}>
        {label}
      </span>
    </span>
  );
}

export function RadioLegend({ children, className }: RadioLegendProps) {
  return (
    <Fieldset.Legend
      className={cn(
        "col-span-full text-base font-medium text-kumo-default",
        className,
      )}
    >
      {children}
    </Fieldset.Legend>
  );
}

export function RadioGroup<Value = string>({
  appearance = KUMO_RADIO_DEFAULT_VARIANTS.appearance,
  children,
  className,
  controlPosition,
  defaultValue,
  description,
  disabled = false,
  error,
  form,
  legend,
  name,
  onValueChange,
  orientation = "vertical",
  readOnly,
  required,
  value,
}: RadioGroupProps<Value>) {
  return (
    <RadioGroupContext.Provider
      value={{ appearance, controlPosition, disabled }}
    >
      <Fieldset.Root
        className={cn("flex flex-col gap-4", className)}
        disabled={disabled}
      >
        {legend ? <RadioLegend>{legend}</RadioLegend> : null}
        <BaseRadioGroup<Value>
          className={cn(
            orientation === "vertical"
              ? cn("flex flex-col", appearance === "card" ? "gap-3" : "gap-2")
              : appearance === "card"
                ? "grid grid-cols-2 gap-3"
                : "flex flex-row flex-wrap gap-2",
          )}
          data-kumo-component="Radio"
          data-kumo-part="group"
          defaultValue={defaultValue}
          disabled={disabled}
          form={form}
          name={name}
          onValueChange={onValueChange}
          readOnly={readOnly}
          render={<div>{children}</div>}
          required={required}
          value={value}
        />
        {error ? (
          <p className={cn("text-sm text-kumo-danger")}>{error}</p>
        ) : null}
        {description ? (
          <p className={cn("text-sm text-kumo-subtle")}>{description}</p>
        ) : null}
      </Fieldset.Root>
    </RadioGroupContext.Provider>
  );
}

export const Radio = Object.assign(RadioGroup, {
  Group: RadioGroup,
  Item: RadioItem,
  Legend: RadioLegend,
});
