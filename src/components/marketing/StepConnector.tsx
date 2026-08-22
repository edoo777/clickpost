import { IconChevronDown } from "@/components/icons";

/** Petit connecteur animé entre deux étapes de /solution — respire doucement pour suggérer la
 * continuité du flux, jamais un mouvement large (voir `.marketing-connector` dans globals.css). */
export function StepConnector() {
  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <IconChevronDown className="marketing-connector h-5 w-5 text-violet-400 dark:text-violet-500" />
    </div>
  );
}
