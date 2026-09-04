/** @jsxImportSource octane */
import { createContext, useContext, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";

export type LinkComponentProps = Omit<
  JSX.IntrinsicElements["a"],
  "children"
> & {
  children?: OctaneNode;
  /** @deprecated Prefer `href`; custom router adapters may consume `to`. */
  to?: string;
};

export type LinkComponent = (props: LinkComponentProps) => JSX.Element;

function DefaultLinkComponent({ to, href, ...props }: LinkComponentProps) {
  return <a href={href ?? to} {...props} />;
}

const LinkComponentContext = createContext<LinkComponent>(DefaultLinkComponent);

export function useLinkComponent(): LinkComponent {
  return useContext(LinkComponentContext);
}

export interface LinkProviderProps {
  children: OctaneNode;
  component?: LinkComponent;
}

export function LinkProvider({ component, children }: LinkProviderProps) {
  return (
    <LinkComponentContext.Provider
      value={component ?? DefaultLinkComponent}
      children={children}
    />
  );
}
