import { ConflictCenterView } from "@/components/conflicts/ConflictCenterView";
import { ConflictsSessionProvider } from "@/lib/conflicts-store";

export default function ConflictsPage() {
  return (
    <ConflictsSessionProvider>
      <ConflictCenterView />
    </ConflictsSessionProvider>
  );
}
