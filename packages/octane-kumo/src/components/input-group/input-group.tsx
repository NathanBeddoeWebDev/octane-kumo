/** @jsxImportSource octane */
import type { Icon } from "@octanejs/phosphor-icons";
import {
  Children,
  cloneElement,
  createContext,
  createElement,
  descriptorChildren,
  isValidElement,
  useContext,
  useId,
  type ComponentBody,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Button as ExternalButton, type ButtonProps } from "../button/button";
import { Field, type FieldError } from "../field/field";
import {
  Input as ExternalInput,
  inputVariants,
  type InputProps,
  type KumoInputSize,
} from "../input/input";
import { Tooltip, type KumoTooltipSide } from "../tooltip/tooltip";
import { cn } from "../../utils/cn";

export const KUMO_INPUT_GROUP_VARIANTS = {
  size: {
    xs: { classes: "h-6 text-xs", description: "Extra small size." },
    sm: { classes: "h-7 text-xs", description: "Small size." },
    base: { classes: "h-9 text-base", description: "Default size." },
    lg: { classes: "h-11 text-base", description: "Large size." },
  },
} as const;

export const KUMO_INPUT_GROUP_DEFAULT_VARIANTS = {
  size: "base",
} as const;

interface InputGroupSizeTokens {
  addonButtonOuterEnd: string;
  addonButtonOuterStart: string;
  addonOuterEnd: string;
  addonOuterStart: string;
  fontSize: string;
  iconSize: number;
  inputOuter: string;
  suffixPad: string;
}

export const INPUT_GROUP_SIZE: Record<KumoInputSize, InputGroupSizeTokens> = {
  xs: {
    addonButtonOuterEnd: "pr-1",
    addonButtonOuterStart: "pl-1",
    addonOuterEnd: "pr-1.5",
    addonOuterStart: "pl-1.5",
    fontSize: "text-xs",
    iconSize: 10,
    inputOuter: "px-1.5",
    suffixPad: "pr-1.5",
  },
  sm: {
    addonButtonOuterEnd: "pr-1",
    addonButtonOuterStart: "pl-1",
    addonOuterEnd: "pr-1.5",
    addonOuterStart: "pl-1.5",
    fontSize: "text-xs",
    iconSize: 13,
    inputOuter: "px-2",
    suffixPad: "pr-2",
  },
  base: {
    addonButtonOuterEnd: "pr-1",
    addonButtonOuterStart: "pl-1",
    addonOuterEnd: "pr-2",
    addonOuterStart: "pl-2",
    fontSize: "text-base",
    iconSize: 18,
    inputOuter: "px-3",
    suffixPad: "pr-3",
  },
  lg: {
    addonButtonOuterEnd: "pr-0.5",
    addonButtonOuterStart: "pl-1.5",
    addonOuterEnd: "pr-2.5",
    addonOuterStart: "pl-2.5",
    fontSize: "text-base",
    iconSize: 20,
    inputOuter: "px-4",
    suffixPad: "pr-4",
  },
};

export const INPUT_GROUP_HAS_CLASSES: Record<KumoInputSize, string> = {
  xs: [
    "has-[[data-slot=input-group-addon-start]]:[&_input]:pl-1",
    "has-[[data-slot=input-group-addon-end]]:[&_input]:pr-1",
  ].join(" "),
  sm: [
    "has-[[data-slot=input-group-addon-start]]:[&_input]:pl-1.5",
    "has-[[data-slot=input-group-addon-end]]:[&_input]:pr-1.5",
  ].join(" "),
  base: [
    "has-[[data-slot=input-group-addon-start]]:[&_input]:pl-2",
    "has-[[data-slot=input-group-addon-end]]:[&_input]:pr-2",
  ].join(" "),
  lg: [
    "has-[[data-slot=input-group-addon-start]]:[&_input]:pl-2.5",
    "has-[[data-slot=input-group-addon-end]]:[&_input]:pr-2.5",
  ].join(" "),
};

type FocusMode = "container" | "hybrid" | "individual";

interface InputGroupContextValue {
  disabled: boolean;
  error?: FieldError;
  focusMode: FocusMode;
  inputId: string;
  size: KumoInputSize;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);
const InputGroupAddonContext = createContext(false);

function useInputGroupContext(componentName: string) {
  const context = useContext(InputGroupContext);
  if (process.env.NODE_ENV !== "production" && !context) {
    console.warn(
      `<InputGroup.${componentName}> must be used within <InputGroup>. Falling back to default values.`,
    );
  }
  return context;
}

function componentDisplayName(element: ElementDescriptor) {
  const type = element.type;
  if (typeof type !== "function" && typeof type !== "object") return undefined;
  return (type as ComponentBody & { displayName?: string }).displayName;
}

function detectFocusMode(children: OctaneNode): FocusMode {
  let hasAddon = false;
  let hasNonGhostDirectButton = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const displayName = componentDisplayName(child);
    if (
      displayName === "InputGroup.Addon" ||
      displayName === "InputGroup.Label"
    ) {
      hasAddon = true;
      return;
    }
    if (displayName !== "InputGroup.Button") return;
    const variant = (child.props as { variant?: string }).variant;
    if (variant !== undefined && variant !== "ghost") {
      hasNonGhostDirectButton = true;
    }
  });

  if (hasAddon && hasNonGhostDirectButton) return "hybrid";
  return hasNonGhostDirectButton ? "individual" : "container";
}

function partitionChildren(children: OctaneNode) {
  const containerZone: OctaneNode[] = [];
  const individualZone: OctaneNode[] = [];

  Children.forEach(children, (child, index) => {
    const partitionedChild =
      isValidElement(child) && child.key == null
        ? cloneElement(child, { key: `input-group-${index}` })
        : child;
    if (
      isValidElement(child) &&
      componentDisplayName(child) === "InputGroup.Button"
    ) {
      individualZone.push(partitionedChild);
    } else {
      containerZone.push(partitionedChild);
    }
  });

  return { containerZone, individualZone };
}

type NativeGroupProps = Omit<
  JSX.IntrinsicElements["div"],
  "children" | "ref" | "size"
>;

type InputGroupRef =
  | ((instance: HTMLElement | null) => void | (() => void))
  | { current: HTMLElement | null }
  | readonly (InputGroupRef | undefined)[]
  | null;

export type InputGroupRootProps = NativeGroupProps & {
  children?: OctaneNode;
  description?: OctaneNode;
  disabled?: boolean;
  error?: FieldError;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  ref?: InputGroupRef;
  required?: boolean;
  size?: KumoInputSize;
};

export type InputGroupInputProps = Omit<
  InputProps,
  "description" | "disabled" | "error" | "label" | "labelTooltip" | "size"
>;

type MisplacedInputProps = InputGroupInputProps & {
  description?: unknown;
  disabled?: boolean;
  label?: unknown;
  size?: unknown;
};

function InputGroupInputComponent(props: InputGroupInputProps) {
  const context = useInputGroupContext("Input");
  const misplacedProps = props as MisplacedInputProps;

  if (process.env.NODE_ENV !== "production" && context) {
    if (misplacedProps.size !== undefined) {
      console.warn(
        "InputGroup.Input: Set `size` on <InputGroup> instead of <InputGroup.Input>.",
      );
    }
    if (misplacedProps.disabled !== undefined) {
      console.warn(
        "InputGroup.Input: Set `disabled` on <InputGroup> instead of <InputGroup.Input>.",
      );
    }
    if (misplacedProps.label !== undefined) {
      console.warn(
        "InputGroup.Input: Use the `label` prop on <InputGroup> instead of <InputGroup.Input>.",
      );
    }
    if (misplacedProps.description !== undefined) {
      console.warn(
        "InputGroup.Input: Use <InputGroup.Suffix> instead of passing `description` to <InputGroup.Input>.",
      );
    }
  }

  const {
    "aria-invalid": ariaInvalid,
    className,
    id,
    ref,
    ...inputProps
  } = props;
  const size = context?.size ?? KUMO_INPUT_GROUP_DEFAULT_VARIANTS.size;
  const isIndividual = context?.focusMode === "individual";

  return (
    <ExternalInput
      {...inputProps}
      aria-invalid={Boolean(context?.error) || ariaInvalid}
      className={cn(
        "relative flex h-full min-w-0 grow items-center rounded-none border-0 bg-transparent font-sans text-ellipsis",
        INPUT_GROUP_SIZE[size].inputOuter,
        isIndividual
          ? [
              "border border-kumo-line ring-0 focus:ring-0",
              "first:rounded-l-[inherit] last:rounded-r-[inherit]",
              "not-first:-ml-px hover:z-1 hover:border-kumo-line",
              "focus:z-2 focus:border-kumo-focus/50",
            ]
          : "z-1 shadow-none ring-0! outline-none focus:ring-0! focus:outline-none",
        className,
      )}
      disabled={context?.disabled || misplacedProps.disabled}
      id={id ?? context?.inputId}
      ref={ref}
      size={size}
    />
  );
}

const InputGroupInput = Object.assign(InputGroupInputComponent, {
  displayName: "InputGroup.Input",
});

export interface InputGroupAddonProps {
  align?: "end" | "start";
  children?: OctaneNode;
  className?: string;
  ref?: JSX.IntrinsicElements["div"]["ref"];
}

function InputGroupAddonComponent({
  align = "start",
  children,
  className,
  ref,
}: InputGroupAddonProps) {
  const context = useInputGroupContext("Addon");
  const tokens =
    INPUT_GROUP_SIZE[context?.size ?? KUMO_INPUT_GROUP_DEFAULT_VARIANTS.size];
  let containsButton = false;
  const sizedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (componentDisplayName(child) === "InputGroup.Button") {
      containsButton = true;
      return child;
    }
    if ((child.props as { size?: unknown }).size !== undefined) return child;
    return cloneElement(child, { size: tokens.iconSize });
  });

  return (
    <div
      className={cn(
        "pointer-events-none relative z-1 flex shrink-0 items-center gap-1.5 text-kumo-subtle *:pointer-events-auto",
        tokens.fontSize,
        align === "start"
          ? [
              "-order-1 pr-0",
              containsButton
                ? tokens.addonButtonOuterStart
                : tokens.addonOuterStart,
            ]
          : [
              "order-1 pl-0",
              containsButton
                ? tokens.addonButtonOuterEnd
                : tokens.addonOuterEnd,
            ],
        className,
      )}
      data-slot={
        align === "start" ? "input-group-addon-start" : "input-group-addon-end"
      }
      ref={ref}
    >
      <InputGroupAddonContext.Provider value={true}>
        {sizedChildren}
      </InputGroupAddonContext.Provider>
    </div>
  );
}

const InputGroupAddon = Object.assign(InputGroupAddonComponent, {
  displayName: "InputGroup.Addon",
});

export interface InputGroupSuffixProps {
  children?: OctaneNode;
  className?: string;
  ref?: JSX.IntrinsicElements["div"]["ref"];
}

function InputGroupSuffixComponent({
  children,
  className,
  ref,
}: InputGroupSuffixProps) {
  const context = useInputGroupContext("Suffix");
  const tokens =
    INPUT_GROUP_SIZE[context?.size ?? KUMO_INPUT_GROUP_DEFAULT_VARIANTS.size];

  return (
    <div
      className={cn(
        "pointer-events-none flex min-w-0 grow items-center text-kumo-subtle select-none",
        tokens.fontSize,
        tokens.suffixPad,
        className,
      )}
      data-slot="input-group-suffix"
      ref={ref}
    >
      <span className={cn("truncate")}>{children}</span>
    </div>
  );
}

const InputGroupSuffix = Object.assign(InputGroupSuffixComponent, {
  displayName: "InputGroup.Suffix",
});

type LoosenedButtonProps = Omit<
  ButtonProps,
  "aria-label" | "aria-labelledby" | "title"
> & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  title?: OctaneNode;
};

export type InputGroupButtonProps = LoosenedButtonProps & {
  tooltip?: OctaneNode;
  tooltipSide?: KumoTooltipSide;
};

const COMPACT_BUTTON_SIZE: Record<KumoInputSize, KumoInputSize> = {
  xs: "xs",
  sm: "xs",
  base: "sm",
  lg: "base",
};

function InputGroupButtonComponent({
  children,
  className,
  disabled,
  icon,
  ref,
  size,
  tooltip,
  tooltipSide = "bottom",
  variant,
  ...buttonProps
}: InputGroupButtonProps) {
  const context = useInputGroupContext("Button");
  const isInsideAddon = useContext(InputGroupAddonContext);
  const effectiveVariant = variant ?? "ghost";
  const isIndividual =
    context?.focusMode === "individual" || context?.focusMode === "hybrid";

  if (
    process.env.NODE_ENV !== "production" &&
    context &&
    effectiveVariant === "ghost" &&
    !isInsideAddon
  ) {
    console.warn(
      "InputGroup.Button: Ghost buttons should be wrapped in <InputGroup.Addon> for correct spacing.",
    );
  }
  if (process.env.NODE_ENV !== "production" && context && size !== undefined) {
    console.warn(
      "InputGroup.Button: Set `size` on <InputGroup> instead of <InputGroup.Button>.",
    );
  }

  const ariaLabel =
    buttonProps["aria-label"] ??
    (typeof tooltip === "string" ? tooltip : undefined);
  const contextIconSize = context
    ? INPUT_GROUP_SIZE[context.size].iconSize
    : undefined;
  const sizedIcon =
    icon && contextIconSize && !isValidElement(icon)
      ? createElement(icon as Icon, { size: contextIconSize })
      : icon;
  const button = createElement(ExternalButton, {
    ...buttonProps,
    "aria-label": ariaLabel,
    children,
    className: cn(
      "pointer-events-auto shadow-none focus:ring-0",
      !isIndividual &&
        "focus-visible:ring-[1.5px] focus-visible:ring-kumo-focus/50",
      isIndividual && [
        "relative h-full! rounded-none border border-kumo-line ring-0 focus-visible:ring-0",
        "first:rounded-l-[inherit] last:rounded-r-[inherit]",
        "not-first:-ml-px hover:z-1 focus:z-2 focus-visible:border-kumo-focus/50",
        "disabled:bg-kumo-overlay disabled:text-kumo-inactive!",
      ],
      className,
    ),
    disabled: disabled ?? context?.disabled,
    icon: sizedIcon,
    ref,
    size:
      size ??
      (isIndividual
        ? (context?.size ?? "sm")
        : COMPACT_BUTTON_SIZE[context?.size ?? "base"]),
    type: "button",
    variant: effectiveVariant,
  } as ButtonProps);

  return tooltip ? (
    <Tooltip asChild content={tooltip} side={tooltipSide}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}

const InputGroupButton = Object.assign(InputGroupButtonComponent, {
  displayName: "InputGroup.Button",
});

function InputGroupLabel(props: InputGroupAddonProps) {
  return <InputGroupAddon align="start" {...props} />;
}

const DeprecatedInputGroupLabel = Object.assign(InputGroupLabel, {
  displayName: "InputGroup.Label",
});

function InputGroupDescription(props: InputGroupSuffixProps) {
  return <InputGroupSuffix {...props} />;
}

const DeprecatedInputGroupDescription = Object.assign(InputGroupDescription, {
  displayName: "InputGroup.Description",
});

function containerClasses(
  size: KumoInputSize,
  focusMode: FocusMode,
  className: InputGroupRootProps["className"],
) {
  return cn(
    "relative w-full cursor-text",
    inputVariants({ size }),
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    focusMode === "container"
      ? "overflow-hidden focus-within:ring-[1.5px] focus-within:ring-kumo-focus/50"
      : "isolate overflow-visible shadow-none ring-0",
    "has-[input[aria-invalid=true]]:ring-kumo-danger",
    "flex items-center gap-0 px-0",
    "has-[[data-slot=input-group-suffix]]:[&_input]:[field-sizing:content]",
    "has-[[data-slot=input-group-suffix]]:[&_input]:max-w-full",
    "has-[[data-slot=input-group-suffix]]:[&_input]:grow-0",
    "has-[[data-slot=input-group-suffix]]:[&_input]:pr-0",
    INPUT_GROUP_HAS_CLASSES[size],
    "!mb-0",
    className,
  );
}

function InputGroupRoot({
  children,
  className,
  description,
  disabled = false,
  error,
  label,
  labelTooltip,
  ref,
  required,
  size = KUMO_INPUT_GROUP_DEFAULT_VARIANTS.size,
  ...groupProps
}: InputGroupRootProps) {
  const inputId = useId();
  const focusMode = detectFocusMode(children);
  const context: InputGroupContextValue = {
    disabled,
    error,
    focusMode,
    inputId,
    size,
  };
  const dataProps = {
    "data-disabled": disabled ? "" : undefined,
    "data-focus-mode": focusMode,
    "data-slot": "input-group",
  };
  const divRef = ref as JSX.IntrinsicElements["div"]["ref"];
  const labelRef = ref as JSX.IntrinsicElements["label"]["ref"];
  const labelProps = groupProps as Omit<
    JSX.IntrinsicElements["label"],
    "children" | "className" | "ref"
  >;
  const classes = containerClasses(size, focusMode, className);
  let container: OctaneNode;

  if (focusMode === "hybrid") {
    const { containerZone, individualZone } = partitionChildren(children);
    const zoneContext = { ...context, focusMode: "container" as const };
    container = (
      <InputGroupContext.Provider value={context}>
        <div {...groupProps} {...dataProps} className={classes} ref={divRef}>
          <InputGroupContext.Provider value={zoneContext}>
            <div
              className={cn(
                inputVariants({ size }),
                "relative overflow-hidden px-0 has-[input[aria-invalid=true]]:ring-kumo-danger",
                "flex min-w-0 flex-1 items-center gap-0 shadow-none ring-0",
                "border border-kumo-line focus-within:z-2 focus-within:border-kumo-focus/50",
                "rounded-none not-first:-ml-px first:rounded-l-[inherit] last:rounded-r-[inherit]",
                INPUT_GROUP_HAS_CLASSES[size],
                "has-data-[slot=input-group-suffix]:[&_input]:field-sizing-content",
                "has-data-[slot=input-group-suffix]:[&_input]:max-w-full",
                "has-data-[slot=input-group-suffix]:[&_input]:grow-0",
                "has-data-[slot=input-group-suffix]:[&_input]:pr-0",
              )}
              data-slot="input-group-container-zone"
            >
              {label ? (
                <label
                  aria-hidden="true"
                  className={cn("absolute inset-0 z-0 mb-0! cursor-text")}
                  htmlFor={inputId}
                />
              ) : null}
              {containerZone}
            </div>
          </InputGroupContext.Provider>
          {individualZone}
        </div>
      </InputGroupContext.Provider>
    );
  } else {
    container = (
      <InputGroupContext.Provider value={context}>
        {label ? (
          <div {...groupProps} {...dataProps} className={classes} ref={divRef}>
            <label
              aria-hidden="true"
              className={cn("absolute inset-0 z-0 mb-0! cursor-text")}
              htmlFor={inputId}
            />
            {children}
          </div>
        ) : focusMode === "container" ? (
          <label
            {...labelProps}
            {...dataProps}
            className={cn(classes, "mb-0!")}
            ref={labelRef}
          >
            {children}
          </label>
        ) : (
          <div {...groupProps} {...dataProps} className={classes} ref={divRef}>
            {children}
          </div>
        )}
      </InputGroupContext.Provider>
    );
  }

  return label ? (
    <Field
      description={description}
      error={error}
      label={label}
      labelTooltip={labelTooltip}
      required={required}
    >
      {container}
    </Field>
  ) : (
    container
  );
}

export const InputGroup = descriptorChildren(
  Object.assign(InputGroupRoot, {
    Addon: InputGroupAddon,
    Button: InputGroupButton,
    Description: DeprecatedInputGroupDescription,
    Input: InputGroupInput,
    Label: DeprecatedInputGroupLabel,
    Suffix: InputGroupSuffix,
    displayName: "InputGroup",
  }),
);
