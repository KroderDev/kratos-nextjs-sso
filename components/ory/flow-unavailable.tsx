import { CircleAlert } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function FlowUnavailable() {
  return (
    <Alert className="border-destructive/25 bg-destructive/5" variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>This flow is no longer available</AlertTitle>
      <AlertDescription className="mt-1">
        Start again from the beginning so the identity service can issue a fresh
        browser flow.
      </AlertDescription>
    </Alert>
  );
}
