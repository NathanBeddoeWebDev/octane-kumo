/** @jsxImportSource octane */
import { createContext, useContext, type OctaneNode } from "octane";

export interface PortalContainerRef {
  current: HTMLElement | ShadowRoot | null;
}

export type PortalContainer =
  | HTMLElement
  | ShadowRoot
  | PortalContainerRef
  | null;

const PortalContainerContext = createContext<PortalContainer>(null);

export interface KumoPortalProviderProps {
  children: OctaneNode;
  container: PortalContainer;
}

export function KumoPortalProvider({
  container,
  children,
}: KumoPortalProviderProps) {
  return (
    <PortalContainerContext.Provider value={container} children={children} />
  );
}

export function usePortalContainer(): PortalContainer {
  return useContext(PortalContainerContext);
}
