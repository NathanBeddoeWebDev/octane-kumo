/** @jsxImportSource octane */
import { useState } from "octane";
import { Button } from "../../src/components/button/button";
import { DeleteResource } from "../../src/components/delete-resource/delete-resource";

export function DeleteResourceFixture() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Delete edge worker</Button>
      <DeleteResource
        open={open}
        onOpenChange={setOpen}
        resourceType="Worker"
        resourceName="edge-api-production"
        onDelete={() => {}}
      />
    </div>
  );
}
