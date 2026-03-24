import { createBrowserRouter, Navigate } from "react-router";
import AppRoot from "./AppRoot";
import { LandingPage } from "./pages/LandingPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { GraphPage } from "./pages/dashboard/GraphPage";
import { ScorePage } from "./pages/dashboard/ScorePage";
import { ViolationsPage } from "./pages/dashboard/ViolationsPage";
import { AIOpinionPage } from "./pages/dashboard/AIOpinionPage";
import { AutoFixPage } from "./pages/dashboard/AutoFixPage";
import { ConfidencePage } from "./pages/dashboard/ConfidencePage";
import { QuantumPage } from "./pages/dashboard/QuantumPage";
import { SupplyChainPage } from "./pages/dashboard/SupplyChainPage";
import { ChatPage } from "./pages/dashboard/ChatPage";
import { CompliancePage } from "./pages/dashboard/CompliancePage";
import { ReportPage } from "./pages/dashboard/ReportPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppRoot,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "dashboard",
        Component: DashboardLayout,
        children: [
          { index: true, element: <Navigate to="graph" replace /> },
          { path: "graph", Component: GraphPage },
          { path: "score", Component: ScorePage },
          { path: "violations", Component: ViolationsPage },
          { path: "ai-opinion", Component: AIOpinionPage },
          { path: "auto-fix", Component: AutoFixPage },
          { path: "confidence", Component: ConfidencePage },
          { path: "quantum", Component: QuantumPage },
          { path: "supply-chain", Component: SupplyChainPage },
          { path: "chat", Component: ChatPage },
          { path: "compliance", Component: CompliancePage },
          { path: "report", Component: ReportPage },
        ]
      }
    ],
  },
]);
