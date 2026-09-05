/** @jsxImportSource octane */
import {
  DatePicker,
  type DatePickerProps,
  type DayPickerProps,
} from "../src/components/date-picker";

// @ts-expect-error single mode cannot accept an array.
const wrongSelection: DatePickerProps = { mode: "single", selected: [] };
// @ts-expect-error Kumo renames onSelect to onChange.
const wrongCallback: DatePickerProps = { mode: "single", onSelect: () => {} };
// @ts-expect-error the calendar-only mode is not part of Kumo's six-way API.
const missingMode: DatePickerProps = {};

const nativeEvents = (
  <DatePicker
    mode="single"
    onChange={(value, day, modifiers, event) => {
      value?.getDate();
      day.getDate();
      void modifiers.selected;
      const native: MouseEvent | KeyboardEvent = event;
      native.preventDefault();
      // @ts-expect-error callbacks do not receive React synthetic events.
      event.persist();
    }}
    components={{
      DayButton: ({
        day: _day,
        modifiers: _modifiers,
        children,
        onClick,
        ...props
      }) => (
        <button {...props} onClick={(event) => onClick?.(event)}>
          {children}
        </button>
      ),
    }}
  />
);

const requiredMulti: DatePickerProps = {
  mode: "multiple",
  required: true,
  selected: [],
  onChange: (value) => value.map((day) => day.getDate()),
};
const requiredRange: DatePickerProps = {
  mode: "range",
  required: true,
  selected: undefined,
  onChange: (value) => value.from?.getDate(),
};
const engine: DayPickerProps = {
  mode: "single",
  selected: new Date(),
  onSelect: (value) => value?.getDate(),
};

export const __typeSpec = {
  wrongSelection,
  wrongCallback,
  missingMode,
  nativeEvents,
  requiredMulti,
  requiredRange,
  engine,
};
