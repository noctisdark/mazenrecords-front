import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@tiptap/react";
import { Ban, CalendarIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedDate } from "react-intl";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Visit, VisitForm, VisitSchema, createVisitForm } from "@/models/Visit";
import { useBrands } from "@/providers/BrandsProvider";
import { useVisits } from "@/providers/VisitsProvider";
import { findById } from "@/utils/array";

import { Autocomplete } from "../basics/Autocomplete";
import Dialog from "../basics/Dialog";
import Popover from "../basics/Popover";
import TextEditor from "../basics/TextEditor";

//TODO polish the brand/model logic and maybe discuss with hazem
//TODO refactor this shit

const UpsertDialog = ({
  open,
  onClose,
  onView,
  visitId = null,
}: {
  open: boolean;
  onClose: () => void;
  onView: (id: number) => void;
  visitId: number | null;
}) => {
  const { brands, add: addBrand, upsertModel } = useBrands();

  const [calendarIsOpen, setCalendarIsOpen] = useState(false);
  const {
    visits,
    add,
    replace,
    move,
    nextId: nextVisitId,
    hasId: hasVisitId,
  } = useVisits();
  const { toast } = useToast();

  const visit = useMemo(
    () => (visitId != null && findById(visits, visitId)) || null,
    [visits, visitId],
  );

  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: brand.name,
        label: brand.name,
      })),
    [brands],
  );

  const form = useForm<VisitForm>({
    mode: "onBlur",
    resolver: zodResolver(
      VisitSchema.refine(
        (visit) => visitId === visit.id || !hasVisitId(visit.id),
        (visit) => ({
          message: visit.id
            ? `N° ${visit.id} already exists`
            : "Ref is required",
          path: ["id"],
        }),
      ),
    ),
  });

  const visitIdState = form.getFieldState("id");
  const problemTextRef = useRef<Editor | null>(null);
  const fixTextRef = useRef<Editor | null>(null);
  const [chosenBrand, setChosenBrand] = useState(visit?.brand || "");

  const modelOptions = useMemo(() => {
    const brand = brands.find((item) => item.name === chosenBrand);
    return (
      (brand &&
        [...brand.models].map((model) => ({ value: model, label: model }))) ||
      []
    );
  }, [brands, chosenBrand]);

  const [openedAsUpdate, setOpenedAsUpdate] = useState(false);
  useEffect(() => {
    if (open) {
      setOpenedAsUpdate(visitId !== null);
      form.reset(createVisitForm(visit ?? nextVisitId));
      setCalendarIsOpen(false);
      setChosenBrand(visit?.brand || "");
    }
    // uncontrolled components lose value when unrendered; exactly what we want
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async () => {
    try {
      // Create brand and model if they don't exist
      const chosenModel = form.getValues().model;
      const foundBrand = brands.find((brand) => brand.name === chosenBrand);
      if (!foundBrand) {
        await addBrand({
          models: new Set([chosenModel]),
          name: chosenBrand,
        });
      } else {
        if (!modelOptions.find((option) => option.value === chosenModel))
          await upsertModel(foundBrand, chosenModel);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error adding brand / model",
        description: String(error),
      });
    }

    try {
      const formValues = form.getValues();
      const updatedVisit = {
        ...formValues,
        date: +formValues.date,
        problem: problemTextRef.current!.getHTML(),
        fix: fixTextRef.current!.getHTML(),
      } as Visit; // after validation

      let result: Visit;
      if (openedAsUpdate) {
        if (form.getValues().id !== visitId)
          result = await move(visitId!, updatedVisit);
        else result = await replace(updatedVisit);
      } else result = await add(updatedVisit);
      onView(result.id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error adding visit",
        description: String(error),
      });
    }
  };

  return (
    <Form {...form}>
      <Dialog open={open} onClose={onClose}>
        <DialogHeader>
          <DialogTitle>
            {openedAsUpdate ? "Update a visit" : "Register a new visit"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-y-2"
        >
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Reference</FormLabel>
                <Input
                  autoFocus
                  type="number"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || "")
                  }
                  placeholder="Insert the reference number"
                />

                <div
                  className={cn(
                    "ml-2 flex items-center gap-2 text-sm",
                    visitIdState.error ? "text-red-700" : "text-emerald-500",
                  )}
                >
                  {visitIdState.error && (
                    <>
                      <Ban className="h-4 w-4" />
                      {visitIdState.error.message}
                    </>
                  )}
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover
                  triggerAsChild
                  trigger={
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal outline-none w-full",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          <FormattedDate value={field.value} />
                        ) : (
                          "Pick a date"
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  }
                  open={calendarIsOpen}
                  onOpen={() => setCalendarIsOpen(true)}
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(e) => {
                      field.onChange(e);
                      setCalendarIsOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </Popover>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Client</FormLabel>
                <Input
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Insert the name of the client"
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contact</FormLabel>
                <Input
                  type="tel"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="How to reach out to the client"
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Brand</FormLabel>
                <Autocomplete
                  value={field.value}
                  onChange={(newBrand) => {
                    field.onChange(newBrand);
                    form.setValue("model", "");
                    setChosenBrand(newBrand);
                  }}
                  options={brandOptions}
                  placeholder="Select a brand..."
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Model</FormLabel>
                <Autocomplete
                  value={field.value}
                  onChange={field.onChange}
                  options={modelOptions}
                  placeholder="Select a model..."
                />
              </FormItem>
            )}
          />
          <FormField
            name="problem"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Problem</FormLabel>
                <TextEditor
                  editorRef={problemTextRef}
                  defaultValue={visit?.problem || ""}
                  placeholder="Description of the problem"
                />
              </FormItem>
            )}
          />
          <FormField
            name="fix"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Fix</FormLabel>
                <TextEditor
                  editorRef={fixTextRef}
                  defaultValue={visit?.fix}
                  placeholder="Description of the fix"
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  type="number"
                  placeholder="Cost of this visit"
                />
              </FormItem>
            )}
          />
        </form>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} type="submit">
            {openedAsUpdate ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </Dialog>
    </Form>
  );
};

export default UpsertDialog;
