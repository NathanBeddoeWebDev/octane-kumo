/** @jsxImportSource octane */
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
} from "@octanejs/phosphor-icons";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type OctaneNode,
} from "octane";
import { InputGroup } from "../input-group";
import { Select } from "../select";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export interface PaginationLabels {
  navigation?: string;
  firstPage?: string;
  previousPage?: string;
  nextPage?: string;
  lastPage?: string;
  pageNumber?: string;
  pageSize?: string;
}

const DEFAULT_LABELS: Required<PaginationLabels> = {
  navigation: "Pagination",
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  pageNumber: "Page number",
  pageSize: "Page size",
};
const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export const KUMO_PAGINATION_VARIANTS = {
  controls: {
    full: {
      classes: "",
      description:
        "Full pagination controls with first, previous, page input, next, and last buttons",
    },
    simple: {
      classes: "",
      description:
        "Simple pagination controls with only previous and next buttons",
    },
  },
} as const;

export type KumoPaginationControls =
  keyof typeof KUMO_PAGINATION_VARIANTS.controls;
export const KUMO_PAGINATION_DEFAULT_VARIANTS = { controls: "full" } as const;
export interface KumoPaginationVariantsProps {
  controls?: KumoPaginationControls;
}

export function paginationVariants({
  controls = KUMO_PAGINATION_DEFAULT_VARIANTS.controls,
}: KumoPaginationVariantsProps = {}) {
  return cn(
    "flex items-center justify-between gap-2",
    resolveVariant(
      KUMO_PAGINATION_VARIANTS.controls,
      controls,
      KUMO_PAGINATION_DEFAULT_VARIANTS.controls,
    ).classes,
  );
}

interface PaginationInfoValue {
  page: number;
  perPage?: number;
  totalCount?: number;
  pageShowingRange: string;
}

interface PaginationContextValue extends PaginationInfoValue {
  hasNextPage?: boolean;
  maxPage: number;
  setPage: (page: number) => void;
  editingPage: string;
  setEditingPage: (page: string) => void;
  labels: Required<PaginationLabels>;
}

const PaginationContext = createContext<PaginationContextValue | null>(null);

function usePaginationContext() {
  const context = useContext(PaginationContext);
  if (!context)
    throw new Error(
      "Pagination compound components must be used within a Pagination component",
    );
  return context;
}

export interface PaginationInfoProps {
  children?: (props: PaginationInfoValue) => OctaneNode;
  className?: string;
}

export function PaginationInfo({ children, className }: PaginationInfoProps) {
  const { page, perPage, totalCount, pageShowingRange } =
    usePaginationContext();
  return (
    <div
      data-slot="pagination-info"
      className={cn("text-sm text-kumo-subtle", className)}
    >
      {children ? (
        children({ page, perPage, totalCount, pageShowingRange })
      ) : totalCount && totalCount > 0 ? (
        <>
          Showing <span className={cn("tabular-nums")}>{pageShowingRange}</span>{" "}
          of <span className={cn("tabular-nums")}>{totalCount}</span>
        </>
      ) : null}
    </div>
  );
}

export interface PaginationPageSizeProps {
  value: number;
  onChange: (size: number) => void;
  options?: number[];
  label?: OctaneNode;
  className?: string;
}

export function PaginationPageSize({
  value,
  onChange,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  label = "Per page:",
  className,
}: PaginationPageSizeProps) {
  const { labels } = usePaginationContext();
  return (
    <div
      data-slot="pagination-page-size"
      className={cn("flex items-center gap-2", className)}
    >
      {label && <span className={cn("text-sm text-kumo-subtle")}>{label}</span>}
      <Select
        aria-label={labels.pageSize}
        value={value}
        onValueChange={(size) => onChange(size as number)}
      >
        {options.map((size) => (
          <Select.Option key={size} value={size}>
            {size}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}

export interface PaginationControlsProps extends KumoPaginationVariantsProps {
  /** Dropdown creates one option per page; prefer input for large page counts. */
  pageSelector?: "input" | "dropdown";
  className?: string;
}

export function PaginationControls({
  controls = KUMO_PAGINATION_DEFAULT_VARIANTS.controls,
  pageSelector = "input",
  className,
}: PaginationControlsProps) {
  const {
    page,
    totalCount,
    hasNextPage,
    maxPage,
    setPage,
    editingPage,
    setEditingPage,
    labels,
  } = usePaginationContext();
  const hasKnownTotal = totalCount != null;
  const showFullControls =
    controls === "full" && !(!hasKnownTotal && hasNextPage !== undefined);
  const isNextDisabled = hasKnownTotal ? page >= maxPage : hasNextPage !== true;
  const goToPage = (next: number) => {
    setPage(next);
    setEditingPage(String(next));
  };
  const commitDraft = () => {
    const value = Number(editingPage);
    // Keep the public callback in the integer page domain, even for pasted text.
    goToPage(
      Math.min(
        Math.max(Number.isFinite(value) ? Math.trunc(value) : page, 1),
        maxPage,
      ),
    );
  };

  return (
    <div
      data-slot="pagination-controls"
      className={cn("flex grow flex-col items-end", className)}
    >
      <nav aria-label={labels.navigation}>
        <InputGroup>
          {showFullControls && (
            <InputGroup.Button
              variant="secondary"
              aria-label={labels.firstPage}
              disabled={page <= 1}
              onClick={() => goToPage(1)}
            >
              <CaretDoubleLeft size={16} />
            </InputGroup.Button>
          )}
          <InputGroup.Button
            variant="secondary"
            aria-label={labels.previousPage}
            disabled={page <= 1}
            onClick={() => goToPage(Math.max(page - 1, 1))}
          >
            <CaretLeft size={16} />
          </InputGroup.Button>
          {showFullControls &&
            (pageSelector === "dropdown" ? (
              <Select
                aria-label={labels.pageNumber}
                className={cn("rounded-none ring-kumo-hairline")}
                value={page}
                onValueChange={(value) => goToPage(value as number)}
              >
                {Array.from({ length: maxPage }, (_, index) => index + 1).map(
                  (value) => (
                    <Select.Option key={value} value={value}>
                      {value}
                    </Select.Option>
                  ),
                )}
              </Select>
            ) : (
              <InputGroup.Input
                style={{ width: 50 }}
                className={cn("text-center")}
                aria-label={labels.pageNumber}
                value={editingPage}
                onValueChange={setEditingPage}
                onBlur={commitDraft}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitDraft();
                  }
                }}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            ))}
          <InputGroup.Button
            variant="secondary"
            aria-label={labels.nextPage}
            disabled={isNextDisabled}
            onClick={() =>
              goToPage(hasKnownTotal ? Math.min(page + 1, maxPage) : page + 1)
            }
          >
            <CaretRight size={16} />
          </InputGroup.Button>
          {showFullControls && (
            <InputGroup.Button
              variant="secondary"
              aria-label={labels.lastPage}
              disabled={page >= maxPage}
              onClick={() => goToPage(maxPage)}
            >
              <CaretDoubleRight size={16} />
            </InputGroup.Button>
          )}
        </InputGroup>
      </nav>
    </div>
  );
}

export interface PaginationSeparatorProps {
  className?: string;
}

export function PaginationSeparator({ className }: PaginationSeparatorProps) {
  return (
    <div
      data-slot="pagination-separator"
      className={cn("mx-2 h-6 border-l border-kumo-hairline", className)}
    />
  );
}

interface PaginationBaseProps {
  /** Pagination is caller-controlled; omitting page uses page 1. */
  setPage: (page: number) => void;
  page?: number;
  perPage?: number;
  totalCount?: number;
  /** Unknown totals use sequential controls only. Ignored with totalCount. */
  hasNextPage?: boolean;
  className?: string;
  labels?: PaginationLabels;
}

export interface PaginationCompoundProps extends PaginationBaseProps {
  children: OctaneNode;
  controls?: never;
  text?: never;
}

/** @deprecated Prefer compound components with Pagination.Info and Pagination.Controls. */
export interface PaginationLegacyProps
  extends PaginationBaseProps, KumoPaginationVariantsProps {
  children?: never;
  text?: (props: {
    page?: number;
    perPage?: number;
    totalCount?: number;
    pageShowingRange: string;
  }) => OctaneNode;
}

export type PaginationProps = PaginationCompoundProps | PaginationLegacyProps;

function PaginationRoot(props: PaginationProps) {
  const {
    page = 1,
    perPage,
    totalCount,
    hasNextPage,
    setPage,
    children,
    className,
    labels,
  } = props;
  const [editingPage, setEditingPage] = useState(String(page));
  useEffect(() => {
    setEditingPage(String(page));
  }, [page]);
  const lower = page * (perPage ?? 1) - (perPage ?? 0) + 1;
  const upper = Math.min(page * (perPage ?? 0), totalCount ?? 0);
  const pageShowingRange =
    totalCount === 0
      ? "0-0"
      : `${Number.isNaN(lower) ? 0 : lower}-${Number.isNaN(upper) ? 0 : upper}`;
  const maxPage = Math.max(1, Math.ceil((totalCount ?? 1) / (perPage ?? 1)));
  const context: PaginationContextValue = {
    page,
    perPage,
    totalCount,
    hasNextPage,
    maxPage,
    pageShowingRange,
    setPage,
    editingPage,
    setEditingPage,
    labels: { ...DEFAULT_LABELS, ...labels },
  };
  return (
    <PaginationContext.Provider value={context}>
      <div
        data-slot="pagination"
        className={cn("flex w-full items-center gap-2", className)}
      >
        {children ? (
          children
        ) : (
          <>
            <div
              aria-live="polite"
              aria-atomic="true"
              data-slot="pagination-info"
              className={cn("grow text-sm text-kumo-subtle")}
            >
              {props.text ? (
                props.text({ page, perPage, totalCount, pageShowingRange })
              ) : totalCount && totalCount > 0 ? (
                <>
                  Showing{" "}
                  <span className={cn("tabular-nums")}>{pageShowingRange}</span>{" "}
                  of <span className={cn("tabular-nums")}>{totalCount}</span>
                </>
              ) : null}
            </div>
            <PaginationControls controls={props.controls} />
          </>
        )}
      </div>
    </PaginationContext.Provider>
  );
}

PaginationInfo.displayName = "Pagination.Info";
PaginationPageSize.displayName = "Pagination.PageSize";
PaginationControls.displayName = "Pagination.Controls";
PaginationSeparator.displayName = "Pagination.Separator";

export const Pagination = Object.assign(PaginationRoot, {
  Info: PaginationInfo,
  PageSize: PaginationPageSize,
  Controls: PaginationControls,
  Separator: PaginationSeparator,
  displayName: "Pagination",
});
