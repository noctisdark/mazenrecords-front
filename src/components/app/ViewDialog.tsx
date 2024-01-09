import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormattedDate, FormattedNumber } from "react-intl";

import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVisits } from "@/providers/DataProvider";
import { findById } from "@/utils/array";
import { toastError } from "@/utils/error";

import Dialog from "../basics/Dialog";
import Tooltip from "../basics/Tooltip";
import { useToast } from "../ui/use-toast";

const ViewDialog = ({
  open,
  onClose,
  onEdit,
  visitId = null,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
  visitId: number | null;
}) => {
  const { visits, remove } = useVisits();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const visit = visitId ? findById(visits, visitId) : null;

  if (!visit) return null;

  return (
    <Dialog confirmBeforeClose={false} open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Checkout a visit</DialogTitle>
      </DialogHeader>

      <div className="p-2 grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] gap-y-2 gap-x-4 text-sm">
        <span className="font-medium">Reference N°</span> <span>{visit.id}</span>
        <span className="font-medium">Date</span> <FormattedDate value={visit.date} />
        <span className="font-medium">Client</span> <span>{visit.client}</span>
        <span className="font-medium">Contact</span> <span>{visit.contact}</span>
        <span className="font-medium">Brand</span> <span>{visit.brand}</span>
        <span className="font-medium">Model</span> <span>{visit.model}</span>
        <span className="font-medium">Problem</span>
        <div
          className="rounded-sm tiptap-html prose prose-sm"
          dangerouslySetInnerHTML={{ __html: visit.problem || "" }}
        />
        <span className="font-medium">Fix</span>
        <div
          className="tiptap-html prose prose-sm"
          dangerouslySetInnerHTML={{ __html: visit.fix || "" }}
        />
        <span className="font-medium">Amount</span>
        {visit.amount !== null ? (
          <FormattedNumber value={visit.amount} style="currency" currency="TND" />
        ) : (
          ""
        )}
      </div>

      <DialogFooter>
        <Tooltip
          triggerAsChild
          trigger={
            <Button
              disabled={isDeleting}
              onClick={() => {
                onEdit(visitId!);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          }
        >
          Edit
        </Tooltip>

        <Tooltip
          triggerAsChild
          trigger={
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                const confirmation = confirm("Do you really want to delete this entry ?");
                if (!confirmation) return;
                try {
                  setIsDeleting(true);
                  await remove(visit.id);
                  onClose();
                } catch (error) {
                  toastError({
                    toast,
                    error,
                    title: "Error deleting visit",
                  });
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          }
        >
          Delete
        </Tooltip>
      </DialogFooter>
    </Dialog>
  );
};

export default ViewDialog;
