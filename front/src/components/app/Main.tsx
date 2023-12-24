import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { DataTable, columns } from "@/components/basics/Table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import SimpleLayout from "@/layouts/SimpleLayout";
import { useBrands } from "@/providers/BrandsProvider";
import { useVisits } from "@/providers/VisitsProvider";
import { stateToCSV } from "@/utils/csv";
import { readFile, writeFile } from "@/utils/files";

import LoadingOverlay from "../basics/LoadingOverlay";
import UploadDialog from "./UploadDialog";
import UpsertDialog from "./UpsertDialog";
import ViewDialog from "./ViewDialog";

// Opening large files is a problem but shouldn't be visible before a long time
// TODO: should find a way to cancel reading the file

const Main = () => {
  const { error: visitsError, loading: visitsLoading, visits } = useVisits();
  const { error: brandsError, loading: brandsLoading, brands } = useBrands();
  const [fileUploading, setFileUploading] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileData, setFileData] = useState<string>("");
  const [isViewing, setIsViewing] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  (window as any).visits = visits;
  (window as any).brands = brands;

  const { toast } = useToast();

  const loading = visitsLoading || brandsLoading;
  const error = visitsError || brandsError;

  if (loading) return <LoadingOverlay className="h-10 w-10" />;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription>
          Error while loading data {error.toString()}.
        </AlertDescription>
      </Alert>
    );

  const Header = (
    <div className="text-3xl text-center select-none">𝕸𝖆𝖟𝖊𝖓 𝕽𝖊𝖈𝖔𝖗𝖉𝖘</div>
  );

  return (
    <SimpleLayout HeaderContent={Header}>
      <DataTable
        columns={columns}
        data={visits}
        onDownloadClicked={async () => {
          const csv = stateToCSV({ visits, brands });
          const suffix = new Date()
            .toLocaleString()
            .replace(/[/\\?%*:|"<>]/g, "-");
          const path = await writeFile(`data at ${suffix}.csv`, csv);
          toast({
            description: `Downloaded as ${decodeURIComponent(path)}`,
          });
        }}
        onUploadClicked={async (file: File) => {
          setFileDialogOpen(true);
          setFileUploading(true);
          try {
            const content = await readFile(file);
            setFileData(content);
          } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Error loading file",
              description: error?.toString() || "",
            });
          } finally {
            setFileUploading(false);
          }
        }}
        onCreate={() => {
          setUpdatingId(null);
          setIsEditing(true);
        }}
        onView={(id: number) => {
          setIsViewing(true);
          setViewingId(id);
        }}
      />

      <ViewDialog
        visitId={viewingId}
        onClose={() => {
          setIsViewing(false);
        }}
        onEdit={(id: number) => {
          // setIsViewing(false);
          setUpdatingId(id);
          setIsEditing(true);
        }}
        open={isViewing}
      />

      <UpsertDialog
        visitId={updatingId}
        onClose={() => {
          setIsEditing(false);
        }}
        onView={(id: number) => {
          setIsEditing(false);
          setViewingId(id);
          setIsViewing(true);
        }}
        open={isEditing}
      />

      <UploadDialog
        onClose={() => {
          setFileDialogOpen(false);
        }}
        fileUploading={fileUploading}
        fileData={fileData}
        open={fileDialogOpen}
      />
    </SimpleLayout>
  );
};

export default Main;
