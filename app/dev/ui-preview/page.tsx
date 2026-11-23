import { notFound } from "next/navigation";

import { UiPreviewGallery } from "@/components/dev-preview/ui-preview-gallery";

export default function UiPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <UiPreviewGallery />;
}
