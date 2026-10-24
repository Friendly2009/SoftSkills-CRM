import { CrmProvider } from "../mocks/store/CrmProvider";
import { CrmLayout } from "../layouts/CrmLayout";
export function CrmApp({ isMock = true, apiBaseUrl = "/api" }: { isMock?: boolean; apiBaseUrl?: string }) {
  return (
    <CrmProvider isMock={isMock} apiBaseUrl={apiBaseUrl}>
      <CrmLayout />
    </CrmProvider>
  );
}
