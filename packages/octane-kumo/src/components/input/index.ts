export * from "./input-area";
export * from "./input";
export {
  InputGroup,
  KUMO_INPUT_GROUP_DEFAULT_VARIANTS,
  KUMO_INPUT_GROUP_VARIANTS,
} from "../input-group";

/** @deprecated InputGroup detects its focus mode from its children. */
export type KumoInputGroupFocusMode = "container" | "individual";

/** @deprecated Use InputGroupRootProps; focusMode is no longer a public prop. */
export interface KumoInputGroupVariantsProps {
  focusMode?: KumoInputGroupFocusMode;
}
