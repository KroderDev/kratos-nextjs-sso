import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { orySetupMessage } from "@/ory.config";

export function OrySetupState() {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <AlertTitle>Access is temporarily unavailable</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-4">
        <p>{orySetupMessage}</p>
        <ButtonLink
          className="w-fit"
          size="sm"
          variant="outline"
          href="/"
        >
          Return home
        </ButtonLink>
      </AlertDescription>
    </Alert>
  );
}
