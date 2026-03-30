import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PageShell from "./components/layout/PageShell";
import AnalysisNewPage from "./pages/AnalysisNewPage";
import AtlasHomePage from "./pages/AtlasHomePage";
import AtlasOverviewNewPage from "./pages/AtlasOverviewNewPage";
import HardwareEvidencePage from "./pages/HardwareEvidencePage";
import InvariantsPage from "./pages/InvariantsPage";
import MemoryNewPage from "./pages/MemoryNewPage";
import OperatorsNewPage from "./pages/OperatorsNewPage";
import PropertiesNewPage from "./pages/PropertiesNewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/atlas-new" replace />} />

        <Route
          path="/atlas-new"
          element={
            <PageShell>
              <AtlasHomePage />
            </PageShell>
          }
        />

        <Route
          path="/atlas-overview-new"
          element={
            <PageShell>
              <AtlasOverviewNewPage />
            </PageShell>
          }
        />

        <Route
          path="/hardware-evidence"
          element={
            <PageShell>
              <HardwareEvidencePage />
            </PageShell>
          }
        />

        <Route
          path="/properties-new"
          element={
            <PageShell>
              <PropertiesNewPage />
            </PageShell>
          }
        />

        <Route
          path="/invariants"
          element={
            <PageShell>
              <InvariantsPage />
            </PageShell>
          }
        />

        <Route
          path="/operators-new"
          element={
            <PageShell fullWidth>
              <OperatorsNewPage />
            </PageShell>
          }
        />

        <Route
          path="/analysis-new"
          element={
            <PageShell fullWidth>
              <AnalysisNewPage />
            </PageShell>
          }
        />

        <Route
          path="/memory-new"
          element={
            <PageShell>
              <MemoryNewPage />
            </PageShell>
          }
        />

        <Route path="*" element={<Navigate to="/atlas-new" replace />} />
      </Routes>
    </BrowserRouter>
  );
}