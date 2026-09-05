/** @jsxImportSource octane */
import {
  CaretLeft,
  CaretRight,
  GlobeHemisphereWest,
} from "@octanejs/phosphor-icons";
import { useState } from "octane";
import { cn } from "../../utils/cn";

export const KUMO_DATE_RANGE_PICKER_VARIANTS = {
  size: {
    sm: {
      classes: "p-3 gap-2",
      cellHeight: "h-[22px]",
      cellWidth: "w-6",
      calendarWidth: "w-[168px]",
      textSize: "text-xs",
      iconSize: 14,
      description: "Compact calendar for tight spaces",
    },
    base: {
      classes: "p-4 gap-2.5",
      cellHeight: "h-[26px]",
      cellWidth: "w-7",
      calendarWidth: "w-[196px]",
      textSize: "text-sm",
      iconSize: 16,
      description: "Default calendar size",
    },
    lg: {
      classes: "p-5 gap-3",
      cellHeight: "h-[32px]",
      cellWidth: "w-9",
      calendarWidth: "w-[252px]",
      textSize: "text-base",
      iconSize: 18,
      description: "Large calendar for prominent date selection",
    },
  },
  variant: {
    default: {
      classes: "bg-kumo-overlay",
      description: "Default calendar appearance",
    },
    subtle: {
      classes: "bg-kumo-base",
      description: "Subtle calendar with minimal background",
    },
  },
} as const;

export const KUMO_DATE_RANGE_PICKER_DEFAULT_VARIANTS = {
  size: "base",
  variant: "default",
} as const;

export type KumoDateRangePickerSize =
  keyof typeof KUMO_DATE_RANGE_PICKER_VARIANTS.size;
export type KumoDateRangePickerVariant =
  keyof typeof KUMO_DATE_RANGE_PICKER_VARIANTS.variant;

export interface KumoDateRangePickerVariantsProps {
  size?: KumoDateRangePickerSize;
  variant?: KumoDateRangePickerVariant;
}

export function dateRangePickerVariants({
  size = KUMO_DATE_RANGE_PICKER_DEFAULT_VARIANTS.size,
  variant = KUMO_DATE_RANGE_PICKER_DEFAULT_VARIANTS.variant,
}: KumoDateRangePickerVariantsProps = {}) {
  return cn(
    "flex w-fit flex-col rounded-xl select-none",
    KUMO_DATE_RANGE_PICKER_VARIANTS.variant[variant].classes,
    KUMO_DATE_RANGE_PICKER_VARIANTS.size[size].classes,
  );
}

enum CellMode {
  OutOfRange,
  Enabled,
  Start,
  End,
  Selected,
  SelectedOutOfRange,
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function localDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstOfMonth(date: Date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function datesEqual(left: Date | null, right: Date | null) {
  return Boolean(left && right && left.getTime() === right.getTime());
}

function monthDays(month: Date) {
  const first = firstOfMonth(month);
  return Array.from({ length: 42 }, (_, index) =>
    localDay(
      new Date(
        first.getFullYear(),
        first.getMonth(),
        index - first.getDay() + 1,
      ),
    ),
  );
}

function monthLabel(month: Date) {
  return `${month.toLocaleString("default", { month: "long" })} ${month.getFullYear()}`;
}

export interface DateRangePickerProps extends KumoDateRangePickerVariantsProps {
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  timezone?: string;
  className?: string;
}

/** @deprecated Use DatePicker with `mode="range"` instead. */
export function DateRangePicker({
  onStartDateChange,
  onEndDateChange,
  size = KUMO_DATE_RANGE_PICKER_DEFAULT_VARIANTS.size,
  variant = KUMO_DATE_RANGE_PICKER_DEFAULT_VARIANTS.variant,
  timezone = "New York, NY, USA (GMT-4)",
  className,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewingMonth, setViewingMonth] = useState(() =>
    firstOfMonth(new Date()),
  );
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const sizeConfig = KUMO_DATE_RANGE_PICKER_VARIANTS.size[size];

  const chooseDate = (value: Date) => {
    const date = localDay(value);
    if (!startDate || date < startDate) {
      setStartDate(date);
      setPreviewDate(date);
      onStartDateChange(date);
    } else {
      setEndDate(date);
      onEndDateChange(date);
    }
  };

  const preview = (date: Date) => {
    if (startDate && !endDate && date > startDate) setPreviewDate(date);
  };

  const modeFor = (date: Date, outside: boolean) => {
    const inCompleteRange = Boolean(
      startDate && endDate && date >= startDate && date <= endDate,
    );
    if (outside && inCompleteRange) return CellMode.SelectedOutOfRange;
    if (outside) return CellMode.OutOfRange;
    if (datesEqual(date, startDate)) return CellMode.Start;
    if (datesEqual(date, endDate)) return CellMode.End;
    if (inCompleteRange) return CellMode.Selected;
    if (
      startDate &&
      !endDate &&
      previewDate &&
      previewDate > startDate &&
      date > startDate &&
      date <= previewDate
    )
      return CellMode.Selected;
    return CellMode.Enabled;
  };

  const updateMonth = (text: string, renderedOffset: number) => {
    if (!text.trim()) return;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return;
    setViewingMonth(
      new Date(parsed.getFullYear(), parsed.getMonth() - renderedOffset, 1),
    );
  };

  return (
    <div
      data-kumo-component="DateRangePicker"
      className={cn(dateRangePickerVariants({ size, variant }), className)}
    >
      <div className={cn("flex gap-4")}>
        {[0, 1].map((offset) => {
          const month = firstOfMonth(viewingMonth, offset);
          const days = monthDays(month);
          return (
            <div
              key={offset}
              className={cn("relative", sizeConfig.calendarWidth)}
            >
              {offset === 0 && (
                <button
                  type="button"
                  aria-label="Previous month"
                  className={cn(
                    "absolute top-0 left-0 cursor-pointer rounded bg-kumo-interact/85 p-1.5 hover:bg-kumo-interact",
                  )}
                  onClick={() =>
                    setViewingMonth(firstOfMonth(viewingMonth, -1))
                  }
                >
                  <CaretLeft size={sizeConfig.iconSize} />
                </button>
              )}
              {offset === 1 && (
                <button
                  type="button"
                  aria-label="Next month"
                  className={cn(
                    "absolute top-0 right-0 cursor-pointer rounded bg-kumo-interact/85 p-1.5 hover:bg-kumo-interact",
                  )}
                  onClick={() => setViewingMonth(firstOfMonth(viewingMonth, 1))}
                >
                  <CaretRight size={sizeConfig.iconSize} />
                </button>
              )}
              <MonthHeader
                month={month}
                size={size}
                update={(text) => updateMonth(text, offset)}
              />
              <div className={cn("grid grid-cols-7 gap-0 gap-y-0.5")}>
                {days.map((date, index) => (
                  <DayCell
                    key={index}
                    date={date}
                    mode={modeFor(date, date.getMonth() !== month.getMonth())}
                    size={size}
                    choose={chooseDate}
                    preview={preview}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={cn(
          "flex items-center gap-2 text-kumo-subtle",
          sizeConfig.textSize,
        )}
      >
        <GlobeHemisphereWest size={sizeConfig.iconSize} />
        <span className={cn("flex-1")}>Timezone: {timezone}</span>
        <button
          type="button"
          className={cn(
            "cursor-pointer font-semibold text-kumo-default underline underline-offset-2",
          )}
          onClick={() => {
            setStartDate(null);
            setEndDate(null);
            setPreviewDate(null);
            onStartDateChange(null);
            onEndDateChange(null);
          }}
        >
          Reset Dates
        </button>
      </div>
    </div>
  );
}

function DayCell({
  date,
  mode,
  size,
  choose,
  preview,
}: {
  date: Date;
  mode: CellMode;
  size: KumoDateRangePickerSize;
  choose: (date: Date) => void;
  preview: (date: Date) => void;
}) {
  const config = KUMO_DATE_RANGE_PICKER_VARIANTS.size[size];
  const dateText = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const label =
    mode === CellMode.Start
      ? `${dateText}, selected as start date`
      : mode === CellMode.End
        ? `${dateText}, selected as end date`
        : mode === CellMode.Selected
          ? `${dateText}, within selected range`
          : dateText;
  const background =
    mode === CellMode.Start
      ? "!bg-kumo-contrast rounded-tl-[5px] rounded-bl-[5px]"
      : mode === CellMode.End
        ? "!bg-kumo-contrast rounded-tr-[5px] rounded-br-[5px]"
        : mode === CellMode.Selected
          ? "bg-kumo-interact"
          : mode === CellMode.SelectedOutOfRange
            ? "bg-kumo-fill"
            : "bg-transparent";
  const text =
    mode === CellMode.Start || mode === CellMode.End
      ? "!text-kumo-inverse"
      : mode === CellMode.OutOfRange || mode === CellMode.SelectedOutOfRange
        ? "!text-kumo-subtle"
        : "text-kumo-default";
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        config.cellHeight,
        config.cellWidth,
        config.textSize,
        "cursor-pointer text-center",
        `leading-[${config.cellHeight.replace("h-[", "").replace("]", "")}]`,
        mode !== CellMode.OutOfRange &&
          mode !== CellMode.SelectedOutOfRange &&
          "hover:bg-kumo-interact",
        background,
        text,
      )}
      onClick={() => choose(date)}
      onMouseOver={() => preview(date)}
      onFocus={() => preview(date)}
    >
      {date.getDate()}
    </button>
  );
}

function MonthHeader({
  month,
  size,
  update,
}: {
  month: Date;
  size: KumoDateRangePickerSize;
  update: (text: string) => void;
}) {
  const config = KUMO_DATE_RANGE_PICKER_VARIANTS.size[size];
  const label = monthLabel(month);
  return (
    <div>
      <div className={cn("mb-3 text-center")}>
        <input
          key={label}
          aria-label="Edit month and year"
          defaultValue={label}
          className={cn(
            "w-full rounded-md border-none bg-transparent py-1.5 text-center font-semibold text-kumo-default focus:ring-[1.5px] focus:ring-kumo-focus/50 focus:outline-none",
            config.textSize,
          )}
          onBlur={(event) => update(event.currentTarget.value)}
        />
      </div>
      <div className={cn("mt-2 grid grid-cols-7 gap-1")}>
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className={cn(
              "h-[22px] text-center text-kumo-subtle",
              config.cellWidth,
              config.textSize,
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use DatePicker with `mode="range"` instead. */
export default DateRangePicker;
