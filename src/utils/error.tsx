import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useData } from "@/providers/DataProvider";

type Toast = ReturnType<typeof useToast>["toast"];

const UpdateButton = () => {
  const { refresh } = useData();

  return (
    <Button variant="secondary" onClick={refresh}>
      Update
    </Button>
  );
};

export const toastError = ({
  toast,
  title,
  error,
}: {
  toast: Toast;
  title: string;
  error: unknown;
}) => {
  const errorData = isAxiosError(error) ? error.response?.data : null;
  const errorMessage = errorData?.message ?? String(error);
  const action = errorData?.action === "update" ? <UpdateButton /> : undefined;

  toast({
    variant: "destructive",
    title,
    description: errorMessage,
    action,
  });

  return error;
};
