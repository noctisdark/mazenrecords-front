import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
// Notes, no need for pagination because all data is local
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Download, LogOut, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { FormattedDate, FormattedNumber } from "react-intl";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadRow,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Visit } from "@/models/Visit";

import { Button, buttonVariants } from "../ui/button";
import { SelectItem } from "../ui/select";
import Select from "./Select";
import Tooltip from "./Tooltip";

export const columns: ColumnDef<Visit>[] = [
  {
    accessorKey: "id",
    sortingFn: "basic",
    header: ({ column }) => {
      const isAsc = column.getIsSorted() === "asc";
      return (
        <span className="">
          <Button
            className="inline-flex items-center gap-2"
            variant="ghost"
            onClick={() => column.toggleSorting(isAsc)}
          >
            Reference
            {isAsc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </span>
      );
    },
    // accessorFn: (original) => original.id
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <FormattedDate value={row.getValue("date")} />,
  },
  {
    accessorKey: "client",
    header: "Client",
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "brand",
    header: "Brand",
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "problem",
    header: "Problem",
    cell: ({ row }) => (
      <div
        className="tiptap-html ellipsis prose prose-sm"
        dangerouslySetInnerHTML={{ __html: row.original.problem }}
      ></div>
    ),
  },
  {
    accessorKey: "fix",
    header: "Fix",
    cell: ({ row }) => (
      <div
        className="tiptap-html ellipsis prose prose-sm"
        dangerouslySetInnerHTML={{ __html: row.original.fix }}
      ></div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      row.getValue("amount") ? (
        <FormattedNumber value={row.getValue("amount")} style="currency" currency="TND" />
      ) : (
        "N/A"
      ),
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDownloadClicked,
  onUploadClicked,
  onCreate,
  onLogout,
  onView,
}: DataTableProps<TData, TValue> & {
  onDownloadClicked: () => void;
  onUploadClicked: (e: File) => void;
  onCreate: () => void;
  onLogout: () => void;
  onView: (id: number) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "id",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectFilterIsOpen, setSelectFilterIsOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<"id" | "client" | "contact">("id");
  const filterName = filterBy === "id" ? "reference" : filterBy;
  const filterRef = useRef<HTMLInputElement | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      columnFilters,
    },
  });

  const cancelFilterValue = () => {
    table.setColumnFilters([{ id: filterBy, value: "" }]);
  };

  const setFilterValue = (value: string) => {
    table.setColumnFilters([{ id: filterBy, value }]);
  };

  const getFilterValue = () => table.getColumn(filterBy)?.getFilterValue();

  const inputType = filterBy === "client" ? "text" : filterBy === "id" ? "number" : "tel";

  return (
    <div className="flex flex-col">
      <div className="flex self-end mb-2 gap-x-4 gap-y-4 flex-wrap justify-end">
        <div className="flex flex-row gap-x-2 items-center">
          <Tooltip
            triggerAsChild
            trigger={
              <Button
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                variant="default"
                size="sm"
                onClick={onCreate}
              >
                <Plus />
              </Button>
            }
          >
            Add new visit
          </Tooltip>

          <Tooltip
            triggerAsChild
            trigger={
              <div
                className={cn(
                  `overflow-hidden ${buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })} focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 relative`,
                )}
              >
                <Upload />
                <Input
                  type="file"
                  className="absolute inset-0 pl-[100%] cursor-pointer overflow-hidden opacity-0"
                  onChange={(e) => (
                    e.target!.files!.length && onUploadClicked(e.target!.files![0]),
                    (e.target!.value = "")
                  )}
                />
              </div>
            }
          >
            Upload
          </Tooltip>

          <Tooltip
            triggerAsChild
            trigger={
              <Button
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                variant="outline"
                size="sm"
                onClick={onDownloadClicked}
              >
                <Download />
              </Button>
            }
          >
            Download
          </Tooltip>

          <Tooltip
            triggerAsChild
            trigger={
              <Button
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                variant="destructive"
                size="sm"
                onClick={onLogout}
              >
                <LogOut />
              </Button>
            }
          >
            Logout
          </Tooltip>
        </div>

        <div className="flex flex-row gap-x-4">
          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <input
              ref={filterRef}
              placeholder={`Filter by ${filterName} ...`}
              value={(getFilterValue() as string) ?? ""}
              onChange={(e) => setFilterValue(e.target.value)}
              type={inputType}
              className="min-w-[150px] max-w-md outline-none border-none bg-transparent h-full flex-1"
            />
            <Select
              open={selectFilterIsOpen}
              onChange={(e) => {
                cancelFilterValue();
                setSelectFilterIsOpen(false);
                setFilterBy(e);
                setTimeout(() => filterRef.current?.focus(), 1);
              }}
              onOpen={async () => {
                if (Capacitor.getPlatform() === "android") await Keyboard.hide();
                setSelectFilterIsOpen(true);
              }}
              onClose={() => setSelectFilterIsOpen(false)}
              triggerClassName="w-min p-0 h-full cursor-pointer"
              triggerAsChild
              value={filterBy}
            >
              <SelectItem value="id">Reference</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableHeadRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isFilteringHeader = header.id === filterBy;
                return (
                  <TableHead
                    key={header.id}
                    className={isFilteringHeader ? "text-orange-500" : ""}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableHeadRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                onClick={() => onView((row.original as Visit).id)}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
