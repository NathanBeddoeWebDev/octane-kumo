/** @jsxImportSource octane */
import { createRoot } from "octane";
import { DatePicker } from "../../src/components/date-picker";
import {
  DatePickerFixture,
  LegacyDatePickerFixture,
} from "../fixtures/date-pickers";
import { cn } from "../../src/utils/cn";

function Preview() {
  return (
    <main>
      {(["light", "dark"] as const).map((mode) => (
        <section key={mode} data-mode={mode}>
          <h1>{mode === "light" ? "Light" : "Dark"} date pickers</h1>
          <div className={cn("examples")}>
            {(["single", "multiple", "range"] as const).map((selection) => (
              <div
                key={selection}
                className={cn("example")}
                data-testid={`${mode}-${selection}`}
              >
                <h2>
                  {selection === "single"
                    ? "Single date"
                    : selection === "multiple"
                      ? "Multiple dates"
                      : "Date range"}
                </h2>
                <DatePickerFixture mode={selection} />
              </div>
            ))}
            <div className={cn("example")} data-testid={`${mode}-dropdown`}>
              <h2>Month and year dropdowns</h2>
              <DatePicker
                mode="single"
                defaultMonth={new Date(2024, 8, 1)}
                today={new Date(2024, 8, 5)}
                captionLayout="dropdown"
                startMonth={new Date(2024, 0, 1)}
                endMonth={new Date(2025, 11, 1)}
              />
            </div>
          </div>
          <div className={cn("legacy-examples")}>
            {(["sm", "base", "lg"] as const).map((size) => (
              <div
                key={size}
                className={cn("example")}
                data-testid={`${mode}-legacy-${size}`}
              >
                <h2>
                  Legacy range · {size}
                  {size === "sm" ? " · subtle" : ""}
                </h2>
                <LegacyDatePickerFixture
                  size={size}
                  variant={size === "sm" ? "subtle" : "default"}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
createRoot(document.getElementById("app")!).render(Preview);
