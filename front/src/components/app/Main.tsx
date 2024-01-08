import { useState } from "react";

import { DataTable, columns } from "@/components/basics/Table";
import { useToast } from "@/components/ui/use-toast";
import SimpleLayout from "@/layouts/SimpleLayout";
import { useData } from "@/providers/DataProvider";
import { stateToCSV } from "@/utils/csv";
import { readFile, writeFile } from "@/utils/files";

import UploadDialog from "./UploadDialog";
import UpsertDialog from "./UpsertDialog";
import ViewDialog from "./ViewDialog";

// Opening large files is a problem but shouldn't be visible before a long time
// TODO: should find a way to cancel reading the file

const Main = () => {
  const { visits, brands } = useData();
  const [fileUploading, setFileUploading] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileData, setFileData] = useState<string>("");
  const [isViewing, setIsViewing] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { toast } = useToast();

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
