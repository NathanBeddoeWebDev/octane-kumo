/** @jsxImportSource octane */
import {
  Collapsible as BaseCollapsible,
  type CollapsiblePanelState,
  type CollapsibleRootState,
} from "@octanejs/base-ui/collapsible";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { CaretDown } from "@octanejs/phosphor-icons";
import type { ElementDescriptor, OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";

export const KUMO_COLLAPSIBLE_VARIANTS = {} as const;
export const KUMO_COLLAPSIBLE_DEFAULT_VARIANTS = {} as const;

export interface KumoCollapsibleVariantsProps {}

export function collapsibleVariants(_props: KumoCollapsibleVariantsProps = {}) {
  return cn();
}

export interface CollapsibleOpenChangeDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  reason: "trigger-press" | "none";
  trigger: Element | undefined;
}

type StateClassName<State> = string | ((state: State) => string | undefined);
type StateStyle<State, Style> = Style | ((state: State) => Style | undefined);
type StateRender<Props, State> =
  | ElementDescriptor
  | ((props: Props, state: State) => ElementDescriptor);

type NativeRootProps = Omit<
  JSX.IntrinsicElements["div"],
  "children" | "className" | "style"
>;
type RootStyle = JSX.IntrinsicElements["div"]["style"];

export interface CollapsibleRootProps extends NativeRootProps {
  children?: OctaneNode;
  className?: StateClassName<CollapsibleRootState>;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (
    open: boolean,
    eventDetails: CollapsibleOpenChangeDetails,
  ) => void;
  open?: boolean;
  render?: StateRender<JSX.IntrinsicElements["div"], CollapsibleRootState>;
  style?: StateStyle<CollapsibleRootState, RootStyle>;
}

type NativeTriggerProps = Omit<
  JSX.IntrinsicElements["button"],
  "children" | "className" | "style"
>;
type TriggerStyle = JSX.IntrinsicElements["button"]["style"];

export interface CollapsibleTriggerProps extends NativeTriggerProps {
  children?: OctaneNode;
  className?: StateClassName<CollapsibleRootState>;
  nativeButton?: boolean;
  render?: StateRender<JSX.IntrinsicElements["button"], CollapsibleRootState>;
  style?: StateStyle<CollapsibleRootState, TriggerStyle>;
}

type NativePanelProps = Omit<
  JSX.IntrinsicElements["div"],
  "children" | "className" | "style"
>;
type PanelStyle = JSX.IntrinsicElements["div"]["style"];

export interface CollapsiblePanelProps extends NativePanelProps {
  children?: OctaneNode;
  className?: StateClassName<CollapsiblePanelState>;
  hiddenUntilFound?: boolean;
  keepMounted?: boolean;
  render?: StateRender<JSX.IntrinsicElements["div"], CollapsiblePanelState>;
  style?: StateStyle<CollapsiblePanelState, PanelStyle>;
}

function withClassName<State>(
  baseClassName: string,
  className?: StateClassName<State>,
): StateClassName<State> {
  if (typeof className === "function") {
    return (state) => cn(baseClassName, className(state));
  }
  return cn(baseClassName, className);
}

function useHydrationSafeKeepMounted(keepMounted = false) {
  const isHydrating = useIsHydrating();
  return keepMounted || isHydrating;
}

function CollapsibleRoot({ className, ...props }: CollapsibleRootProps) {
  return (
    <BaseCollapsible.Root
      className={withClassName(collapsibleVariants(), className)}
      {...props}
    />
  );
}

CollapsibleRoot.displayName = "Collapsible.Root";

function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      className={withClassName("cursor-pointer", className)}
      data-kumo-component="Collapsible"
      data-kumo-part="trigger"
      {...props}
    />
  );
}

CollapsibleTrigger.displayName = "Collapsible.Trigger";

function CollapsiblePanel({
  className,
  keepMounted,
  ...props
}: CollapsiblePanelProps) {
  const resolvedKeepMounted = useHydrationSafeKeepMounted(keepMounted);
  return (
    <BaseCollapsible.Panel
      className={withClassName("", className)}
      data-kumo-part="panel"
      keepMounted={resolvedKeepMounted}
      {...props}
    />
  );
}

CollapsiblePanel.displayName = "Collapsible.Panel";

export interface CollapsibleDefaultTriggerProps {
  children: OctaneNode;
  className?: string;
  ref?: JSX.IntrinsicElements["button"]["ref"];
}

function CollapsibleDefaultTrigger({
  children,
  className,
  ref,
}: CollapsibleDefaultTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        "m-0 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-base font-medium text-kumo-default shadow-none select-none",
        className,
      )}
      data-kumo-component="Collapsible"
      data-kumo-part="default-trigger"
      ref={ref}
    >
      <span>{children}</span>
      <span className={cn("inline-grid w-4 shrink-0 place-items-center")}>
        <CaretDown
          aria-hidden="true"
          className={cn(
            "block size-3 origin-center transition-transform duration-100 ease-out [[data-panel-open]_&]:rotate-180",
          )}
          size={12}
          weight="bold"
        />
      </span>
    </BaseCollapsible.Trigger>
  );
}

CollapsibleDefaultTrigger.displayName = "Collapsible.DefaultTrigger";

export interface CollapsibleDefaultPanelProps extends Omit<
  CollapsiblePanelProps,
  "children" | "className"
> {
  children: OctaneNode;
  className?: string;
}

function CollapsibleDefaultPanel({
  children,
  className,
  keepMounted,
  ...props
}: CollapsibleDefaultPanelProps) {
  const resolvedKeepMounted = useHydrationSafeKeepMounted(keepMounted);
  return (
    <BaseCollapsible.Panel
      className={cn(
        "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height,opacity] duration-100 ease-out data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 [&[hidden]:not([hidden='until-found'])]:hidden",
        className,
      )}
      data-kumo-part="default-panel"
      keepMounted={resolvedKeepMounted}
      {...props}
    >
      <div
        className={cn(
          "my-2 space-y-4 border-l-2 border-kumo-fill py-1 pr-1 pl-4",
        )}
      >
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

CollapsibleDefaultPanel.displayName = "Collapsible.DefaultPanel";

export const Collapsible = Object.assign(CollapsibleRoot, {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
  DefaultTrigger: CollapsibleDefaultTrigger,
  DefaultPanel: CollapsibleDefaultPanel,
});

export type CollapsibleProps = CollapsibleRootProps;
