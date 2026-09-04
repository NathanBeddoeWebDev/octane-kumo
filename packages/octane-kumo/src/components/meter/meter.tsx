/** @jsxImportSource octane */
import {
  Meter as BaseMeter,
  type MeterRootProps,
} from "@octanejs/base-ui/meter";
import { cn } from "../../utils/cn";

export const KUMO_METER_VARIANTS = {} as const;
export const KUMO_METER_DEFAULT_VARIANTS = {} as const;

export interface KumoMeterVariantsProps {}

export function meterVariants(_props: KumoMeterVariantsProps = {}) {
  return cn("flex w-full flex-col gap-2");
}

export interface MeterProps
  extends
    Omit<MeterRootProps, "children" | "className">,
    KumoMeterVariantsProps {
  className?: string;
  customValue?: string;
  indicatorClassName?: string;
  label: string;
  showValue?: boolean;
  trackClassName?: string;
}

export function Meter({
  value,
  customValue,
  label,
  showValue = true,
  className,
  trackClassName,
  indicatorClassName,
  ...props
}: MeterProps) {
  return (
    <BaseMeter.Root
      value={value}
      {...props}
      className={cn(meterVariants(), className)}
      data-kumo-component="Meter"
    >
      <div className={cn("flex items-center justify-between gap-4")}>
        <BaseMeter.Label className={cn("text-xs text-kumo-subtle")}>
          {label}
        </BaseMeter.Label>
        {customValue ? (
          <span
            className={cn("text-sm font-medium text-kumo-default tabular-nums")}
          >
            {customValue}
          </span>
        ) : showValue ? (
          <BaseMeter.Value
            className={cn("text-sm font-medium text-kumo-default tabular-nums")}
          />
        ) : null}
      </div>
      <BaseMeter.Track
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-kumo-fill",
          trackClassName,
        )}
        data-kumo-part="track"
      >
        <BaseMeter.Indicator
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-kumo-brand via-kumo-brand to-kumo-brand transition-[width] duration-300 ease-out",
            indicatorClassName,
          )}
          data-kumo-part="indicator"
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
