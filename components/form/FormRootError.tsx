import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormRootError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <Alert variant="destructive" aria-live="polite">
      <CircleAlertIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
