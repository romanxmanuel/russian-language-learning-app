import { AcceleratorShell } from "@/components/accelerator-shell";
import { getDashboardSnapshot } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const dashboard = await getDashboardSnapshot();

  return <AcceleratorShell initialDashboard={dashboard} />;
}
