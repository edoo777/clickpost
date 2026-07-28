import { Suspense } from "react";
import { IdeaBoxView } from "@/components/idea-box/IdeaBoxView";

export default function IdeaBoxPage() {
  return (
    <Suspense fallback={null}>
      <IdeaBoxView />
    </Suspense>
  );
}
