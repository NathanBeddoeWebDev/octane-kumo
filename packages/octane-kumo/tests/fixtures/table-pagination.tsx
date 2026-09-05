/** @jsxImportSource octane */
import { useRef, useState } from "octane";
import { Badge } from "../../src/components/badge";
import { Pagination } from "../../src/components/pagination";
import { Table } from "../../src/components/table";
import { cn } from "../../src/utils/cn";
import { KumoPortalProvider } from "../../src/utils/portal-provider";

const resources = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: `Worker ${index + 1}`,
  route: `worker-${index + 1}.example.com/*`,
  disabled: index === 2,
}));

export function TablePaginationFixture({
  compact = false,
  dropdown = false,
  initialPage = 1,
}: {
  compact?: boolean;
  dropdown?: boolean;
  initialPage?: number;
}) {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(3);
  const [selected, setSelected] = useState<number[]>([1]);
  const portal = useRef<HTMLDivElement | null>(null);
  const visible = resources.slice((page - 1) * perPage, page * perPage);
  const selectable = visible.filter((resource) => !resource.disabled);
  const count = selectable.filter((resource) =>
    selected.includes(resource.id),
  ).length;
  return (
    <div ref={portal} className={cn("grid gap-4")}>
      <KumoPortalProvider container={portal}>
        <div
          data-testid="table-scroll"
          style={{ maxHeight: 180, overflow: "auto" }}
        >
          <Table
            layout={compact ? "fixed" : "auto"}
            aria-label="Resources"
            style={{ minWidth: 850 }}
          >
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: 170 }} />
              <col style={{ width: 470 }} />
              <col style={{ width: 170 }} />
            </colgroup>
            <Table.Header variant={compact ? "compact" : "default"} sticky>
              <Table.Row>
                <Table.CheckHead
                  checked={count === selectable.length}
                  indeterminate={count > 0 && count < selectable.length}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [
                            ...new Set([
                              ...current,
                              ...selectable.map((row) => row.id),
                            ]),
                          ]
                        : current.filter(
                            (id) => !selectable.some((row) => row.id === id),
                          ),
                    )
                  }
                />
                <Table.Head sticky="left" scope="col">
                  Name
                </Table.Head>
                <Table.Head scope="col">
                  Route
                  <Table.ResizeHandle />
                </Table.Head>
                <Table.Head sticky="right" scope="col">
                  Status
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visible.map((resource) => (
                <Table.Row
                  key={resource.id}
                  variant={
                    selected.includes(resource.id) ? "selected" : "default"
                  }
                >
                  <Table.CheckCell
                    label={`Select ${resource.name}`}
                    disabled={resource.disabled}
                    checked={selected.includes(resource.id)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, resource.id]
                          : current.filter((id) => id !== resource.id),
                      )
                    }
                  />
                  <Table.Cell sticky="left">{resource.name}</Table.Cell>
                  <Table.Cell>{resource.route}</Table.Cell>
                  <Table.Cell sticky="right">
                    <Badge
                      variant={resource.disabled ? "secondary" : "success"}
                    >
                      {resource.disabled ? "Paused" : "Active"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        <output
          className={cn("text-base text-kumo-subtle")}
          data-testid="selected-count"
        >
          {selected.length} selected
        </output>
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalCount={resources.length}
          className={cn("flex-wrap")}
        >
          <Pagination.Info />
          <Pagination.Separator />
          <Pagination.PageSize
            value={perPage}
            options={[3, 6, 9]}
            onChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
          />
          <Pagination.Controls pageSelector={dropdown ? "dropdown" : "input"} />
        </Pagination>
      </KumoPortalProvider>
    </div>
  );
}
