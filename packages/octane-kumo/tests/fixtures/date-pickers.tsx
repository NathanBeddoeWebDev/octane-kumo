/** @jsxImportSource octane */
import { useState } from "octane";
import { DatePicker, type DateRange } from "../../src/components/date-picker";
import { DateRangePicker } from "../../src/components/date-range-picker";

export function DatePickerFixture({
  mode = "single",
}: {
  mode?: "single" | "multiple" | "range";
}) {
  const [single, setSingle] = useState<Date | undefined>(new Date(2024, 8, 10));
  const [multiple, setMultiple] = useState<Date[] | undefined>([
    new Date(2024, 8, 10),
  ]);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2024, 8, 10),
    to: new Date(2024, 8, 14),
  });
  const common = {
    defaultMonth: new Date(2024, 8, 1),
    today: new Date(2024, 8, 5),
    startMonth: new Date(2024, 7, 1),
    endMonth: new Date(2024, 10, 1),
    disabled: new Date(2024, 8, 20),
  };
  return (
    <>
      {mode === "single" ? (
        <DatePicker
          {...common}
          mode="single"
          selected={single}
          onChange={setSingle}
        />
      ) : mode === "multiple" ? (
        <DatePicker
          {...common}
          mode="multiple"
          selected={multiple}
          onChange={setMultiple}
          max={3}
        />
      ) : (
        <DatePicker
          {...common}
          mode="range"
          selected={range}
          onChange={setRange}
          numberOfMonths={2}
        />
      )}
      <output data-testid="date-selection">
        {mode === "single"
          ? String(single?.getDate() ?? "none")
          : mode === "multiple"
            ? (multiple?.map((date) => date.getDate()).join(",") ?? "none")
            : `${range?.from?.getDate() ?? "none"}–${range?.to?.getDate() ?? "none"}`}
      </output>
    </>
  );
}

export function LegacyDatePickerFixture({
  size = "base",
  variant = "default",
}: {
  size?: "sm" | "base" | "lg";
  variant?: "default" | "subtle";
}) {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  return (
    <>
      <DateRangePicker
        size={size}
        variant={variant}
        timezone="UTC"
        onStartDateChange={setStart}
        onEndDateChange={setEnd}
      />
      <output data-testid="legacy-selection">
        {start?.getDate() ?? "none"}–{end?.getDate() ?? "none"}
      </output>
    </>
  );
}
