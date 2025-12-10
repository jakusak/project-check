import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/integrations/supabase/auth";
import { RegionProvider } from "@/contexts/RegionContext";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import UnitSchedule from "./pages/UnitSchedule";
import VanModule from "./pages/VanModule";
import UnitLoads from "./pages/UnitLoads";
import Warehouses from "./pages/Warehouses";
import Equipment from "./pages/Equipment";
import Cart from "./pages/Cart";
import MyRequests from "./pages/MyRequests";
import AllRequests from "./pages/admin/AllRequests";
import RequestDetail from "./pages/admin/RequestDetail";
import ManageEquipment from "./pages/admin/ManageEquipment";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageAssignments from "./pages/admin/ManageAssignments";
import BulkOPXOnboarding from "./pages/admin/BulkOPXOnboarding";
import OPXDashboard from "./pages/opx/OPXDashboard";
import HubDashboard from "./pages/hub/HubDashboard";
import TeamPage from "./pages/team/TeamPage";
import PRDViewer from "./pages/PRDViewer";
import NotFound from "./pages/NotFound";
import IncidentList from "./pages/van-incidents/IncidentList";
import NewIncident from "./pages/van-incidents/NewIncident";
import OpsAnalytics from "./pages/analytics/OpsAnalytics";
import NewCycleCount from "./pages/cycle-counts/NewCycleCount";
import MyCycleCounts from "./pages/cycle-counts/MyCycleCounts";
import CycleCountReview from "./pages/cycle-counts/CycleCountReview";
import CycleCountDetail from "./pages/cycle-counts/CycleCountDetail";
import BrokenItemsList from "./pages/equipment-health/BrokenItemsList";
import BrokenItemDetail from "./pages/equipment-health/BrokenItemDetail";
import ReportBrokenItem from "./pages/equipment-health/ReportBrokenItem";
import MaintenanceList from "./pages/equipment-health/MaintenanceList";
import MaintenanceDetail from "./pages/equipment-health/MaintenanceDetail";
import NewMaintenanceRecord from "./pages/equipment-health/NewMaintenanceRecord";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RegionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<Layout />}>
              <Route path="/" element={<UnitSchedule />} />
              <Route path="/van-module" element={<VanModule />} />
              <Route path="/unit-loads" element={<UnitLoads />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/admin/requests" element={<AllRequests />} />
              <Route path="/admin/request/:id" element={<RequestDetail />} />
              <Route path="/admin/equipment" element={<ManageEquipment />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/assignments" element={<ManageAssignments />} />
              <Route path="/admin/bulk-opx" element={<BulkOPXOnboarding />} />
              <Route path="/opx/dashboard" element={<OPXDashboard />} />
              <Route path="/hub/dashboard" element={<HubDashboard />} />
              <Route path="/team/:teamId" element={<TeamPage />} />
              <Route path="/van-incidents" element={<IncidentList />} />
              <Route path="/van-incidents/new" element={<NewIncident />} />
              <Route path="/analytics/ops" element={<OpsAnalytics />} />
              <Route path="/cycle-counts/new" element={<NewCycleCount />} />
              <Route path="/cycle-counts/my" element={<MyCycleCounts />} />
              <Route path="/cycle-counts/review" element={<CycleCountReview />} />
              <Route path="/cycle-counts/review/:id" element={<CycleCountDetail />} />
              <Route path="/broken-items" element={<BrokenItemsList />} />
              <Route path="/broken-items/new" element={<ReportBrokenItem />} />
              <Route path="/broken-items/:id" element={<BrokenItemDetail />} />
              <Route path="/maintenance" element={<MaintenanceList />} />
              <Route path="/maintenance/new" element={<NewMaintenanceRecord />} />
              <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
              <Route path="/docs/prd" element={<PRDViewer />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RegionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
