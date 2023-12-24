import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useBrands } from "@/providers/BrandsProvider";
import { useVisits } from "@/providers/VisitsProvider";
import { getUpdatesFromCSV } from "@/utils/csv";

import Dialog from "../basics/Dialog";
import LoadingOverlay from "../basics/LoadingOverlay";
import Tooltip from "../basics/Tooltip";

const UploadDialog = ({
  open,
  onClose,
  fileUploading,
  fileData,
}: {
  open: boolean;
  onClose: () => void;
  fileUploading: boolean;
  fileData: string;
}) => {
  const { visits, upsertBatch: upsertBatchVisits } = useVisits();
  const { brands, upsertBatch: upsertBatchBrands } = useBrands();
  const { toast } = useToast();

  const [stats, error] = useMemo(() => {
    try {
      if (fileData)
        return [getUpdatesFromCSV({ visits, brands }, fileData), null];
      return [
        {
          updatedBrands: brands,
          updatedVisits: visits,
          appliedUpdates: 0,
          ignoredUpdates: 0,
          newVisits: 0,
        },
        null,
      ];
    } catch (error: any) {
      return [null, error];
    }
  }, [visits, brands, fileData]);

  const [saving, setSaving] = useState(false);

  const onUpdate = async () => {
    setSaving(true);
    try {
      await upsertBatchVisits(stats!.updatedVisits);
      await upsertBatchBrands(stats!.updatedBrands);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error applying updates",
        description: error?.toString() || "",
      });
    } finally {
      setSaving(false);
    }
    onClose();
  };

  return (
    <Dialog
      confirmMessage="Are you sure you want to cancel the upload ?"
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Upload Data</DialogTitle>
      {error ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Error uploading data</AlertTitle>
          <AlertDescription>
            Error while parsing the CSV file {error.toString()}.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="relative">
            <div style={{ opacity: fileUploading ? 0 : "1" }}>
              <div className="p-2 grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] gap-y-2 gap-x-4 text-sm">
                <span className="font-medium">New visits :</span>{" "}
                {stats!.newVisits}
                <span className="font-medium">Updates to apply :</span>{" "}
                {stats!.appliedUpdates}
                <span className="font-medium">Updates to ignore :</span>{" "}
                {stats!.ignoredUpdates}
              </div>
            </div>
            {fileUploading && <LoadingOverlay />}
          </div>
          <DialogFooter>
            <Tooltip
              triggerAsChild
              trigger={
                <Button
                  variant="destructive"
                  onClick={onClose}
                  disabled={fileUploading}
                >
                  <X />
                </Button>
              }
            >
              Cancel
            </Tooltip>

            <Tooltip
              triggerAsChild
              trigger={
                <Button
                  variant="default"
                  onClick={onUpdate}
                  disabled={fileUploading}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check />
                  )}
                </Button>
              }
            >
              Submit
            </Tooltip>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
};

export default UploadDialog;
