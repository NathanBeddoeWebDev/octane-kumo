/** @jsxImportSource octane */
import {
  DayPicker,
  type CustomComponents,
  type DayPickerProps as EngineProps,
} from "@octanejs/day-picker";
import { CaretLeft, CaretRight } from "@octanejs/phosphor-icons";
import type { OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";

// Stock TS tooling cannot resolve the engine's .tsrx component export. Keep its
// declaration tied to the engine's own props; runtime bundling and tsrx-tsc
// independently verify the actual export and native implementation.
declare module "@octanejs/day-picker" {
  function DayPicker(props: EngineProps): OctaneNode;
}

// The native engine still publishes React DOM event types. Its runtime passes
// DOM events and Octane children, so translate those contracts at this boundary.
type NativeEvent<T> = T extends {
  nativeEvent: infer Event;
  currentTarget: infer Target;
}
  ? Event & { readonly currentTarget: Target }
  : T;
type NativeCallback<T> = T extends (...args: infer Args) => infer Result
  ? (...args: { [K in keyof Args]: NativeEvent<Args[K]> }) => Result
  : T;
type NativeProps<T> = {
  [K in keyof T]: K extends "children" | "footer"
    ? OctaneNode
    : K extends "style"
      ? JSX.IntrinsicElements["div"]["style"]
      : K extends "rootRef"
        ? JSX.IntrinsicElements["div"]["ref"]
        : NativeCallback<T[K]>;
};
type NativeComponents = {
  [K in keyof CustomComponents]: (
    props: NativeProps<Parameters<CustomComponents[K]>[0]>,
  ) => OctaneNode;
};

type NavigationAliases = {
  /** @deprecated Use autoFocus. */
  initialFocus?: boolean;
  /** @deprecated Use startMonth. */
  fromMonth?: Date;
  /** @deprecated Use endMonth. */
  toMonth?: Date;
  /** @deprecated Use startMonth. */
  fromYear?: number;
  /** @deprecated Use endMonth. */
  toYear?: number;
};

type NativeDayPicker<T> = T extends unknown
  ? NativeProps<Omit<T, "components">> & {
      components?: Partial<NativeComponents>;
    }
  : never;

/** DayPicker's selection API with native events, children, refs and components. */
export type DayPickerProps = NativeDayPicker<EngineProps>;

type SelectionProps<T> = T extends { mode: "single" | "multiple" | "range" }
  ? NativeProps<Omit<T, "onSelect" | "components">> &
      NavigationAliases & {
        components?: Partial<NativeComponents>;
        onChange?: NativeCallback<T extends { onSelect?: infer F } ? F : never>;
      }
  : never;

/** Kumo's six optional/required selection modes, using onChange, not onSelect. */
export type DatePickerProps = SelectionProps<EngineProps>;

function Chevron({
  orientation,
  style,
  ...props
}: Parameters<NativeComponents["Chevron"]>[0]) {
  const Icon = orientation === "left" ? CaretLeft : CaretRight;
  return (
    <Icon
      size={16}
      {...props}
      style={typeof style === "string" ? style : { ...style }}
    />
  );
}

export function DatePicker({
  className,
  classNames,
  components,
  onChange,
  initialFocus,
  fromMonth,
  toMonth,
  fromYear,
  toYear,
  ...props
}: DatePickerProps) {
  const nativeProps = {
    showOutsideDays: true,
    animate: true,
    ...props,
    autoFocus: props.autoFocus ?? initialFocus,
    startMonth:
      props.startMonth ??
      fromMonth ??
      (fromYear === undefined ? undefined : new Date(fromYear, 0, 1)),
    endMonth:
      props.endMonth ??
      toMonth ??
      (toYear === undefined ? undefined : new Date(toYear, 11, 1)),
    onSelect: onChange,
    classNames: {
      ...classNames,
      root: cn(
        "rdp-root rounded-xl bg-kumo-base select-none",
        classNames?.root,
        className,
      ),
    },
    components: { Chevron, ...components },
  };
  return <DayPicker {...(nativeProps as unknown as EngineProps)} />;
}
