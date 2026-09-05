/** @jsxImportSource octane */
import {
  Toast,
  type ToastObject,
  type ToastManagerAddOptions,
} from "@octanejs/base-ui/toast";
import { useEffect, useRef, type OctaneNode } from "octane";
import {
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
  X,
} from "@octanejs/phosphor-icons";
import { Button, type ButtonProps } from "../button";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";

export const KUMO_TOAST_VARIANTS = {
  root: {
    classes:
      "rounded-lg ring ring-kumo-line bg-kumo-control p-4 shadow-lg text-kumo-default",
    description: "Toast container with background, ring, and shadow",
  },
  title: {
    classes: "text-sm leading-5 font-medium text-kumo-default",
    description: "Toast title with primary text color",
  },
  description: {
    classes: "text-sm leading-5 text-kumo-subtle",
    description: "Toast description with muted text color",
  },
  close: {
    classes:
      "absolute top-2 right-2 size-5 rounded text-kumo-subtle hover:bg-current/15",
    description: "Button-based close control with variant-aware hover tint",
  },
  variant: {
    default: {
      classes: "border-kumo-fill bg-kumo-base",
      description: "Default toast style",
    },
    success: {
      classes:
        "ring-[0.3px] ring-kumo-success bg-kumo-base [&_[data-toast-icon]]:text-kumo-success [&_[data-toast-title]]:text-kumo-success",
      description: "Success toast for confirmations and positive outcomes",
      icon: CheckCircle,
    },
    error: {
      classes:
        "ring-[0.3px] ring-kumo-danger bg-kumo-base [&_[data-toast-icon]]:text-kumo-danger [&_[data-toast-title]]:text-kumo-danger",
      description: "Error toast for critical issues",
      icon: WarningOctagon,
    },
    warning: {
      classes:
        "ring-[0.3px] ring-kumo-warning bg-kumo-base [&_[data-toast-icon]]:text-kumo-warning [&_[data-toast-title]]:text-kumo-warning",
      description: "Warning toast for cautionary messages",
      icon: Warning,
    },
    info: {
      classes:
        "ring-[0.3px] ring-kumo-info bg-kumo-control [&_[data-toast-icon]]:text-kumo-info [&_[data-toast-title]]:text-kumo-info",
      description: "Info toast for neutral informational messages",
      icon: Info,
    },
  },
} as const;
export const KUMO_TOAST_DEFAULT_VARIANTS = { variant: "default" } as const;
export const KUMO_TOAST_STYLING = {
  container: {
    width: 300,
    padding: 16,
    borderRadius: 8,
    background: "bg-kumo-base",
    border: "ring-[0.3px] ring-kumo-hairline",
    shadow: "shadow-lg",
    gap: 4,
  },
  title: { fontSize: 14, fontWeight: 500, color: "text-kumo-default" },
  description: { fontSize: 14, fontWeight: 400, color: "text-kumo-subtle" },
  closeButton: {
    size: 20,
    iconSize: 16,
    iconName: "ph-x",
    iconColor: "text-kumo-subtle",
    hoverBackground: "hover:bg-current/15",
    hoverColor: "text-kumo-default",
    borderRadius: 4,
  },
} as const;
export type KumoToastVariant = keyof typeof KUMO_TOAST_VARIANTS.variant;
export interface KumoToastVariantsProps {
  variant?: KumoToastVariant;
}
export function toastVariants({
  variant = "default",
}: KumoToastVariantsProps = {}) {
  return cn(
    "rounded-xl bg-clip-padding p-4 shadow-lg ring ring-kumo-line",
    resolveVariant(KUMO_TOAST_VARIANTS.variant, variant, "default").classes,
  );
}

type KumoToastOptionsBase = {
  variant?: KumoToastVariant;
  content?: OctaneNode;
  actions?: ButtonProps[];
  bump?: boolean;
};
export type KumoToastOptions<Data extends object = object> = ToastObject<Data> &
  KumoToastOptionsBase;
export type KumoToastManagerAddOptions<Data extends object = object> =
  ToastManagerAddOptions<Data> & KumoToastOptionsBase;
type NativeManager = Pick<
  ReturnType<typeof Toast.createToastManager>,
  "add" | "update" | "promise" | "close"
> & { toasts?: ToastObject[] };

function wrapManagerMethods<T extends NativeManager>(
  manager: T,
  frames?: Set<number>,
) {
  const { add, update, promise, ...rest } = manager;
  return {
    ...rest,
    add: <Data extends object = object>(
      options: KumoToastManagerAddOptions<Data>,
    ) => {
      const existing =
        options.id && manager.toasts?.find((toast) => toast.id === options.id);
      if (existing) {
        if (existing.transitionStatus !== "ending") {
          const reset: Partial<KumoToastManagerAddOptions<Data>> = {
            bump: false,
          };
          update(existing.id, reset);
          const frame = requestAnimationFrame(() => {
            frames?.delete(frame);
            const bumped: Partial<KumoToastManagerAddOptions<Data>> = {
              bump: true,
              ...(options.timeout !== undefined && {
                timeout: options.timeout,
              }),
            };
            update(existing.id, bumped);
          });
          frames?.add(frame);
        }
        return existing.id;
      }
      return add(options);
    },
    update: <Data extends object = object>(
      id: string,
      options: Partial<KumoToastManagerAddOptions<Data>>,
    ) => update(id, options),
    promise: <Value, Data extends object = object>(
      input: Promise<Value>,
      options: {
        loading: KumoToastManagerAddOptions<Data>;
        success:
          | KumoToastManagerAddOptions<Data>
          | ((value: Value) => KumoToastManagerAddOptions<Data>);
        error:
          | KumoToastManagerAddOptions<Data>
          | ((error: Error) => KumoToastManagerAddOptions<Data>);
      },
    ) => promise(input, options),
  };
}

export function useKumoToastManager() {
  const manager = Toast.useToastManager();
  const frames = useRef(new Set<number>());
  useEffect(
    () => () => {
      for (const frame of frames.current) cancelAnimationFrame(frame);
    },
    [],
  );
  return {
    ...wrapManagerMethods(manager, frames.current),
    toasts: manager.toasts as KumoToastOptions[],
  };
}
export function createKumoToastManager() {
  return wrapManagerMethods(Toast.createToastManager());
}

export interface ToastyProps extends KumoToastVariantsProps {
  children: OctaneNode;
  container?: PortalContainer;
  toastManager?: ReturnType<typeof createKumoToastManager>;
}
export function Toasty({
  children,
  container: containerProp,
  toastManager,
}: ToastyProps) {
  const contextContainer = usePortalContainer();
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <Toast.Portal container={containerProp ?? contextContainer ?? undefined}>
        <Toast.Viewport
          className={cn(
            "fixed top-auto right-4 bottom-4 z-1 mx-auto flex w-[calc(100%-2rem)] sm:right-8 sm:bottom-8 sm:w-[340px]",
          )}
        >
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
export const ToastProvider = Toasty;

function ToastList() {
  const { toasts } = useKumoToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 h-[var(--height)] w-full origin-bottom select-none",
        toastVariants({ variant: toast.variant }),
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-[ending-style]:opacity-0 data-[expanded]:h-[var(--toast-height)] data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(150%)]",
        "data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        toast.bump && "animate-toast-bump",
      )}
    >
      <ToastBackground variant={toast.variant} />
      <Toast.Content
        className={cn(
          "isolate flex flex-col gap-1 transition-opacity [transition-duration:250ms] data-[behind]:pointer-events-none data-[behind]:opacity-0 data-[expanded]:pointer-events-auto data-[expanded]:opacity-100",
        )}
      >
        {toast.content ?? (
          <div className={cn("flex items-start gap-2 pr-4")}>
            <ToastIcon variant={toast.variant} />
            <div className={cn("flex flex-col gap-1 overflow-hidden")}>
              <Toast.Title
                data-toast-title
                className={cn(
                  "text-sm leading-5 font-medium text-kumo-default",
                )}
              />
              <Toast.Description
                className={cn("text-sm leading-5 text-kumo-default/70")}
              />
              {!!toast.actions && (
                <div
                  className={cn(
                    "mt-2 flex min-w-0 flex-nowrap gap-2 overflow-x-auto p-px",
                  )}
                >
                  {toast.actions.map((actionProps, index) => (
                    <Button key={index} {...actionProps} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <Toast.Close
          data-kumo-part="close"
          aria-label="Close"
          render={
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Close"
              className={cn(
                "absolute top-2 right-2 size-5 rounded text-kumo-subtle hover:bg-current/15",
                toast.variant && TOAST_CLOSE_CLASSES[toast.variant],
              )}
              icon={<X className={cn("h-3 w-3")} />}
            />
          }
        />
      </Toast.Content>
    </Toast.Root>
  ));
}
const TOAST_CLOSE_CLASSES: Partial<Record<KumoToastVariant, string>> = {
  success: "text-kumo-success",
  error: "text-kumo-danger",
  warning: "text-kumo-warning",
  info: "text-kumo-info",
};
const TOAST_BACKGROUND_CLASSES: Partial<Record<KumoToastVariant, string>> = {
  success: "bg-kumo-success-tint/20",
  error: "bg-kumo-danger-tint/50",
  warning: "bg-kumo-warning-tint/50",
  info: "bg-kumo-info-tint/50",
};
function ToastBackground({ variant }: KumoToastVariantsProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-xl bg-kumo-base/90",
        variant && TOAST_BACKGROUND_CLASSES[variant],
      )}
    />
  );
}
function ToastIcon({ variant }: KumoToastVariantsProps) {
  if (!variant || variant === "default") return null;
  const config = resolveVariant(
    KUMO_TOAST_VARIANTS.variant,
    variant,
    "default",
  );
  if (!("icon" in config)) return null;
  const Icon = config.icon;
  return (
    <Icon
      data-toast-icon
      className={cn("mt-0.5 h-4 w-4 shrink-0")}
      weight="fill"
    />
  );
}
