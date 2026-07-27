import { AuthShell } from "@/components/layout/auth-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { getOryFlowError, getOryFlowErrorMessage } from "@/lib/ory/error";
import { isOryConfigured } from "@/ory.config";

type ErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
export const metadata = { title: "Flow interrupted" };

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const errorId = typeof params.id === "string" ? params.id : undefined;
  const flowError =
    isOryConfigured && errorId ? await getOryFlowError(errorId) : null;
  const errorMessage = getOryFlowErrorMessage(flowError);

  return (
    <AuthShell
      description="The identity service could not complete that request. Start a fresh browser flow and try again."
      eyebrow="Flow interrupted"
      title="That path closed early"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {errorMessage ??
            "No credentials were changed. You can safely return to the sign-in screen and begin again."}
        </p>
        <ButtonLink className="w-fit" href="/auth/login">
          Back to sign in
        </ButtonLink>
      </div>
    </AuthShell>
  );
}
