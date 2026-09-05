/** @jsxImportSource octane */
import { createRoot, useState } from "octane";
import { Pagination } from "../../src/components/pagination";
import { cn } from "../../src/utils/cn";
import { TablePaginationFixture } from "../fixtures/table-pagination";

function Mode({ mode }: { mode: "light" | "dark" }) {
  const [page, setPage] = useState(1);
  return (
    <section data-mode={mode}>
      <h1>{mode === "light" ? "Light" : "Dark"} resource tables</h1>
      <div className={cn("examples")}>
        <div className={cn("example")} data-testid={`${mode}-input`}>
          <h2>Automatic layout · page input</h2>
          <TablePaginationFixture />
        </div>
        <div className={cn("example")} data-testid={`${mode}-dropdown`}>
          <h2>Fixed layout · compact header · page dropdown</h2>
          <TablePaginationFixture compact dropdown />
        </div>
      </div>
      <div className={cn("extras")}>
        <div>
          <h2>Unknown total · sequential controls</h2>
          <Pagination
            page={page}
            setPage={setPage}
            hasNextPage={page < 3}
            text={() => `Page ${page}`}
          />
        </div>
        <div>
          <h2>Empty result · disabled navigation</h2>
          <Pagination
            page={1}
            setPage={() => {}}
            perPage={3}
            totalCount={0}
            text={() => "No resources"}
          />
        </div>
      </div>
    </section>
  );
}

function Preview() {
  return (
    <main>
      <Mode mode="light" />
      <Mode mode="dark" />
    </main>
  );
}
createRoot(document.getElementById("app")!).render(Preview);
