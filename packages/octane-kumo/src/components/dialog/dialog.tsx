/** @jsxImportSource octane */
import {
  AlertDialog as AlertDialogBase,
  type AlertDialogHandle,
} from "@octanejs/base-ui/alert-dialog";
import {
  Dialog as DialogBase,
  type DialogHandle,
} from "@octanejs/base-ui/dialog";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import {
  createContext,
  useContext,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { LayerCard } from "../layer-card/layer-card";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";

export const KUMO_DIALOG_VARIANTS = {
  size: {
    base: {
      classes: "sm:w-96",
      description: "Default dialog width (384px)",
    },
    sm: {
      classes: "sm:w-72",
      description: "Small dialog for simple confirmations (288px)",
    },
    lg: {
      classes: "sm:w-[32rem]",
      description: "Large dialog for complex content (512px)",
    },
    xl: {
      classes: "sm:w-[48rem]",
      description: "Extra large dialog for detailed views (768px)",
    },
  },
  role: {
    dialog: {
      classes: "",
      description: "Standard dialog for general-purpose modals",
    },
    alertdialog: {
      classes: "",
      description:
        "Alert dialog for confirmation flows requiring explicit user acknowledgment",
    },
  },
} as const;

export const KUMO_DIALOG_DEFAULT_VARIANTS = {
  size: "base",
  role: "dialog",
} as const;

export const KUMO_DIALOG_STYLING = {
  dimensions: {
    sm: {
      width: 350,
      titleSize: 20,
      descSize: 16,
      padding: 16,
      gap: 8,
      buttonSize: "sm",
    },
    base: {
      width: 384,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
    lg: {
      width: 512,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
    xl: {
      width: 768,
      titleSize: 20,
      descSize: 16,
      padding: 24,
      gap: 16,
      buttonSize: "base",
    },
  },
  baseTokens: {
    background: "color-surface",
    text: "text-color-surface",
    borderRadius: 12,
    shadow: "shadow-m",
  },
  backdrop: { background: "color-surface-secondary", opacity: 0.8 },
  header: {
    title: { fontWeight: 600, color: "text-color-surface" },
    closeIcon: { name: "ph-x", size: 20, color: "text-color-muted" },
  },
  description: {
    fontWeight: 400,
    color: "text-color-muted",
  },
  buttons: {
    primary: { background: "color-primary", text: "white" },
    secondary: { ring: "color-border", text: "text-color-surface" },
  },
} as const;

export type KumoDialogSize = keyof typeof KUMO_DIALOG_VARIANTS.size;
export type KumoDialogRole = keyof typeof KUMO_DIALOG_VARIANTS.role;

export interface KumoDialogVariantsProps {
  size?: KumoDialogSize;
}

export type DialogOpenChangeReason =
  | "trigger-press"
  | "outside-press"
  | "escape-key"
  | "close-press"
  | "focus-out"
  | "imperative-action"
  | "none";

export interface DialogOpenChangeDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  preventUnmountOnClose(): void;
  reason: DialogOpenChangeReason;
  trigger: Element | undefined;
}

export interface DialogActions {
  close(): void;
  unmount(): void;
}

type ActionsRef<T> = { current: T | null } | ((value: T | null) => void) | null;
type ButtonProps = JSX.IntrinsicElements["button"];
type HeadingProps = JSX.IntrinsicElements["h2"];
type ParagraphProps = JSX.IntrinsicElements["p"];
type NativeStyle = Exclude<
  JSX.IntrinsicElements["div"]["style"],
  string | undefined
>;
type DialogStyle = NativeStyle & Partial<Record<`--${string}`, string>>;

export interface DialogRootBaseProps {
  actionsRef?: ActionsRef<DialogActions>;
  children?: OctaneNode;
  defaultOpen?: boolean;
  defaultTriggerId?: string | null;
  disablePointerDismissal?: boolean;
  modal?: boolean | "trap-focus";
  onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  open?: boolean;
  triggerId?: string | null;
}

export type DialogRootProps = DialogRootBaseProps &
  (
    | { handle?: DialogHandle<unknown>; role?: "dialog" }
    | { handle?: AlertDialogHandle<unknown>; role: "alertdialog" }
  );

export interface DialogTriggerState {
  disabled: boolean;
  open: boolean;
}

export type DialogTriggerRender =
  | ElementDescriptor
  | ((props: ButtonProps, state: DialogTriggerState) => ElementDescriptor);

export type DialogTriggerProps = Omit<ButtonProps, "children"> & {
  children?: OctaneNode;
  handle?: DialogHandle<unknown> | AlertDialogHandle<unknown>;
  nativeButton?: boolean;
  payload?: unknown;
  render?: DialogTriggerRender;
};

export type DialogTitleProps = Omit<HeadingProps, "children"> & {
  children?: OctaneNode;
  render?: ElementDescriptor | ((props: HeadingProps) => ElementDescriptor);
};

export type DialogDescriptionProps = Omit<ParagraphProps, "children"> & {
  children?: OctaneNode;
  render?: ElementDescriptor | ((props: ParagraphProps) => ElementDescriptor);
};

export type DialogCloseProps = Omit<ButtonProps, "children"> & {
  children?: OctaneNode;
  nativeButton?: boolean;
  render?: ElementDescriptor | ((props: ButtonProps) => ElementDescriptor);
};

export interface DialogProps extends KumoDialogVariantsProps {
  children: OctaneNode;
  className?: string;
  container?: PortalContainer;
  style?: DialogStyle;
}

const DialogRoleContext = createContext<KumoDialogRole>("dialog");

function useDialogRole() {
  return useContext(DialogRoleContext);
}

export function dialogVariants({
  size = KUMO_DIALOG_DEFAULT_VARIANTS.size,
}: KumoDialogVariantsProps = {}) {
  return cn(
    "shadow-m fixed top-8 left-1/2 w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-kumo-base text-kumo-default ring ring-kumo-line duration-150 data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 sm:top-16",
    resolveVariant(
      KUMO_DIALOG_VARIANTS.size,
      size,
      KUMO_DIALOG_DEFAULT_VARIANTS.size,
    ).classes,
  );
}

function DialogContent({
  className,
  children,
  style,
  size = KUMO_DIALOG_DEFAULT_VARIANTS.size,
  container: containerProp,
}: DialogProps) {
  const role = useDialogRole();
  const isHydrating = useIsHydrating();
  const contextContainer = usePortalContainer();
  const container = containerProp ?? contextContainer ?? undefined;
  const BasePortal =
    role === "alertdialog" ? AlertDialogBase.Portal : DialogBase.Portal;
  const BaseBackdrop =
    role === "alertdialog" ? AlertDialogBase.Backdrop : DialogBase.Backdrop;
  const BasePopup =
    role === "alertdialog" ? AlertDialogBase.Popup : DialogBase.Popup;
  const mergedStyle: DialogStyle = {
    transitionProperty: "scale, opacity",
    transitionTimingFunction: "var(--default-transition-timing-function)",
    "--tw-shadow":
      "0 20px 25px -5px rgb(0 0 0 / 0.03), 0 8px 10px -6px rgb(0 0 0 / 0.03)",
    ...style,
  };

  return (
    // Stabilize the empty shell only during hydration; normal closed dialogs still unmount.
    <BasePortal container={container} keepMounted={isHydrating}>
      <BaseBackdrop className="fixed inset-0 bg-kumo-recessed opacity-80 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <LayerCard
        render={<BasePopup />}
        className={cn(dialogVariants({ size }), className)}
        style={mergedStyle}
      >
        {children}
      </LayerCard>
    </BasePortal>
  );
}

function DialogRoot(props: DialogRootProps) {
  if (props.role === "alertdialog") {
    const { children, role, ...rootProps } = props;
    return (
      <DialogRoleContext.Provider value={role}>
        <AlertDialogBase.Root {...rootProps}>{children}</AlertDialogBase.Root>
      </DialogRoleContext.Provider>
    );
  }

  const {
    children,
    role = KUMO_DIALOG_DEFAULT_VARIANTS.role,
    ...rootProps
  } = props;
  return (
    <DialogRoleContext.Provider value={role}>
      <DialogBase.Root {...rootProps}>{children}</DialogBase.Root>
    </DialogRoleContext.Provider>
  );
}

function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const role = useDialogRole();
  const BaseTrigger =
    role === "alertdialog" ? AlertDialogBase.Trigger : DialogBase.Trigger;
  return (
    <BaseTrigger
      data-kumo-component="Dialog"
      data-kumo-part="trigger"
      {...props}
    >
      {children}
    </BaseTrigger>
  );
}

function DialogTitle(props: DialogTitleProps) {
  const role = useDialogRole();
  const BaseTitle =
    role === "alertdialog" ? AlertDialogBase.Title : DialogBase.Title;
  return <BaseTitle {...props} />;
}

function DialogDescription(props: DialogDescriptionProps) {
  const role = useDialogRole();
  const BaseDescription =
    role === "alertdialog"
      ? AlertDialogBase.Description
      : DialogBase.Description;
  return <BaseDescription {...props} />;
}

function DialogClose({ children, ...props }: DialogCloseProps) {
  const role = useDialogRole();
  const BaseClose =
    role === "alertdialog" ? AlertDialogBase.Close : DialogBase.Close;
  return (
    <BaseClose data-kumo-component="Dialog" data-kumo-part="close" {...props}>
      {children}
    </BaseClose>
  );
}

export const Dialog = Object.assign(DialogContent, {
  Root: Object.assign(DialogRoot, { displayName: "Dialog.Root" }),
  Trigger: Object.assign(DialogTrigger, { displayName: "Dialog.Trigger" }),
  Title: Object.assign(DialogTitle, { displayName: "Dialog.Title" }),
  Description: Object.assign(DialogDescription, {
    displayName: "Dialog.Description",
  }),
  Close: Object.assign(DialogClose, { displayName: "Dialog.Close" }),
  displayName: "Dialog",
});

export {
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
