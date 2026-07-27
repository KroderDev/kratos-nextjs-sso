import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { orySetupMessage, orySetupVariable } from "@/ory.config";

export function OrySetupState() {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <AlertTitle>Connect the identity service</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-4">
        <p>
          {orySetupMessage} Set{" "}
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {orySetupVariable}
          </code>
          {" "}to continue.
        </p>
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
