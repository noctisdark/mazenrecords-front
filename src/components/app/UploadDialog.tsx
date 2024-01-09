import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useBrands, useData, useVisits } from "@/providers/DataProvider";
import { getStateFromCSV } from "@/utils/csv";

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
  const { upload } = useData();
  const { visits } = useVisits();
  const { brands } = useBrands();
  const { toast } = useToast();

  const [updates, error] = useMemo(() => {
    try {
      if (fileData) return [getStateFromCSV(fileData), null];
      return [
        {
          visits: [],
          brands: [],
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
      await upload({
        visits: updates!.visits,
        brands: updates!.brands,
      });
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
                {updates?.visits.length || 0}
                <span className="font-medium">New brands :</span>{" "}
                {updates?.brands.length || 0}
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
