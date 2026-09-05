/** @jsxImportSource octane */
import { createRoot, useState, useEffect } from "octane";
import { Button, DeleteResource } from "octane-kumo";

function Preview() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [small, setSmall] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.mode = dark ? "dark" : "light";
  }, [dark]);
  return (
    <main>
      <Button onClick={() => setDark(!dark)}>
        Switch to {dark ? "light" : "dark"}
      </Button>
      <Button onClick={() => setSmall(!small)}>Toggle size</Button>
      <Button onClick={() => setOpen(true)}>Open delete dialog</Button>
      <DeleteResource
        open={open}
        onOpenChange={setOpen}
        resourceType="Worker"
        resourceName="edge-api-production"
        onDelete={() => setDeleting(true)}
        isDeleting={deleting}
        size={small ? "sm" : "base"}
        errorMessage="The previous deletion attempt failed."
      />
    </main>
  );
}

createRoot(document.getElementById("app")!).render(Preview);
