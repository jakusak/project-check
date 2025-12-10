import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PRDViewer() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { 
            padding: 0 !important; 
            max-width: 100% !important;
          }
          body { 
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          h1, h2, h3 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Header - hidden in print */}
      <div className="no-print sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between h-14 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-sidebar-accent/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-bold text-sm tracking-wide">PRODUCT REQUIREMENTS DOCUMENT</h1>
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="print-content max-w-4xl mx-auto py-12 px-8 bg-background min-h-screen">
        {/* Cover Page */}
        <div className="text-center mb-16 pb-16 border-b border-border">
          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
              Product Requirements Document
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
            Backroads Ops Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Internal Operations Management Platform
          </p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Version:</span> 2.0
            </div>
            <div>
              <span className="font-medium">Date:</span> December 2025
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600 font-medium">Phase 2 Complete</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            Table of Contents
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#executive-summary" className="hover:text-primary">Executive Summary</a></li>
            <li><a href="#product-vision" className="hover:text-primary">Product Vision & Objectives</a></li>
            <li><a href="#target-users" className="hover:text-primary">Target Users & Personas</a></li>
            <li><a href="#user-roles" className="hover:text-primary">User Roles & Permissions</a></li>
            <li><a href="#features" className="hover:text-primary">Feature Specifications</a></li>
            <li><a href="#mobile-app" className="hover:text-primary">Mobile Application</a></li>
            <li><a href="#architecture" className="hover:text-primary">Technical Architecture</a></li>
            <li><a href="#data-model" className="hover:text-primary">Data Model</a></li>
            <li><a href="#security" className="hover:text-primary">Security Requirements</a></li>
            <li><a href="#integrations" className="hover:text-primary">Integration Requirements</a></li>
            <li><a href="#design-system" className="hover:text-primary">Design System</a></li>
            <li><a href="#success-metrics" className="hover:text-primary">Success Metrics</a></li>
            <li><a href="#roadmap" className="hover:text-primary">Release Roadmap</a></li>
          </ol>
        </section>

        {/* 1. Executive Summary */}
        <section id="executive-summary" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            1. Executive Summary
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-3">1.1 Product Overview</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            The <strong>Backroads Ops Dashboard</strong> is an internal operations management platform designed to 
            streamline equipment logistics, unit scheduling, warehouse operations, and field incident reporting for 
            Backroads' global cycling tour operations. The system serves as a centralized hub for managing equipment 
            requests, tracking van and trailer logistics, coordinating fulfillment across multiple geographic regions,
            and maintaining equipment health records.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">1.2 Problem Statement</h3>
          <p className="text-muted-foreground mb-4">Backroads operations teams currently face challenges with:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-6 ml-4">
            <li>Manual, fragmented equipment request processes</li>
            <li>Lack of visibility into equipment availability across regions</li>
            <li>Inefficient communication between field staff, operations experts, and fulfillment teams</li>
            <li>No centralized system for tracking unit loads and warehouse capacity</li>
            <li>No standardized incident reporting workflow</li>
            <li>Manual cycle count and inventory reconciliation processes</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">1.3 Solution</h3>
          <p className="text-muted-foreground mb-4">A unified web-based dashboard providing:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Streamlined equipment request workflow with multi-tier approval</li>
            <li>Real-time visibility into operations data (vans, units, warehouses)</li>
            <li>Role-based access control ensuring data security</li>
            <li>Automated notifications and reminders</li>
            <li>Geographic routing logic for equipment fulfillment</li>
            <li><strong>Mobile-first field app with barcode scanning</strong></li>
            <li><strong>Van incident reporting and tracking</strong></li>
            <li><strong>Cycle count management with validation workflow</strong></li>
            <li><strong>Equipment health tracking (broken items, maintenance records)</strong></li>
            <li><strong>TPS bike assignment workflow</strong></li>
            <li><strong>Bulk inventory move operations</strong></li>
            <li><strong>Operations analytics dashboard</strong></li>
          </ul>
        </section>

        {/* 2. Product Vision */}
        <section id="product-vision" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            2. Product Vision & Objectives
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-3">2.1 Vision Statement</h3>
          <div className="bg-primary/5 border-l-4 border-primary p-4 mb-6 italic text-foreground">
            To become the single source of truth for Backroads operations, enabling seamless coordination 
            between field staff and fulfillment teams while ensuring equipment availability and operational 
            efficiency across all regions.
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-3">2.2 Key Objectives</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left font-semibold">Objective</th>
                  <th className="border border-border p-3 text-left font-semibold">Description</th>
                  <th className="border border-border p-3 text-left font-semibold">Success Criteria</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-3 font-medium">Streamline Equipment Requests</td>
                  <td className="border border-border p-3 text-muted-foreground">Reduce time from request to fulfillment</td>
                  <td className="border border-border p-3 text-muted-foreground">&lt;48 hours for standard requests</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-3 font-medium">Improve Visibility</td>
                  <td className="border border-border p-3 text-muted-foreground">Centralized view of all operations data</td>
                  <td className="border border-border p-3 text-muted-foreground">100% of active requests visible</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-medium">Reduce Manual Work</td>
                  <td className="border border-border p-3 text-muted-foreground">Automate routing and notifications</td>
                  <td className="border border-border p-3 text-muted-foreground">90% reduction in email coordination</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-3 font-medium">Scale Operations</td>
                  <td className="border border-border p-3 text-muted-foreground">Support 200+ OPX users across regions</td>
                  <td className="border border-border p-3 text-muted-foreground">No performance degradation</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-medium">Mobile-First Field Ops</td>
                  <td className="border border-border p-3 text-muted-foreground">Enable field staff to work from phones</td>
                  <td className="border border-border p-3 text-muted-foreground">&lt;30 second task completion</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-3 font-medium">Equipment Health Tracking</td>
                  <td className="border border-border p-3 text-muted-foreground">Maintain accurate equipment status</td>
                  <td className="border border-border p-3 text-muted-foreground">100% broken items tracked</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Target Users */}
        <section id="target-users" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            3. Target Users & Personas
          </h2>
          
          <div className="grid gap-6">
            {[
              {
                title: "Field Staff",
                description: "Tour leaders and field employees who need equipment for trips",
                details: ["Geographically distributed across USA, Canada, and Europe", "Varying technical proficiency", "Primary device: Mobile (phone/tablet)"],
                goals: ["Quickly request needed equipment", "Track request status", "Report van incidents efficiently", "Submit cycle counts from the field"],
              },
              {
                title: "OPX (Operations Expert)",
                description: "Regional operations managers responsible for specific OPS Areas",
                details: ["Reviews and approves equipment requests", "200+ OPX users globally", "Assigned to one or more OPS Areas"],
                goals: ["Efficiently review incoming requests", "Ensure appropriate equipment allocation", "Validate cycle counts", "Monitor operations analytics"],
              },
              {
                title: "Hub Admin",
                description: "Fulfillment team members at warehouse locations",
                details: ["Teams of 1-4 people per hub", "Five hubs: Tuscany, Czech, Pernes, USA, Canada", "Execute on approved equipment requests"],
                goals: ["See approved requests for their hub", "Track fulfillment progress", "Report on inventory movements"],
              },
              {
                title: "TPS (Trip Prep Specialist)",
                description: "Responsible for preparing bikes for guest trips",
                details: ["Assigns specific bikes to guest reservations", "Tracks bike assignment history", "Uses barcode scanning for efficiency"],
                goals: ["Quickly assign bikes to guests", "Track bike usage history", "Ensure proper bike-to-guest matching"],
              },
              {
                title: "Super Admin",
                description: "System administrators and operations leadership",
                details: ["Full access to all system functions", "Manages users, roles, and system configuration", "Global unrestricted access to all areas/hubs"],
                goals: ["Maintain user access and permissions", "Configure system settings", "Monitor overall operations health"],
              },
            ].map((persona) => (
              <div key={persona.title} className="border border-border rounded-lg p-5 bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-2">{persona.title}</h3>
                <p className="text-muted-foreground mb-3">{persona.description}</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1">Profile:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {persona.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Goals:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {persona.goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. User Roles */}
        <section id="user-roles" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            4. User Roles & Permissions
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-4">4.1 Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left font-semibold">Feature</th>
                  <th className="border border-border p-2 text-center font-semibold">Field Staff</th>
                  <th className="border border-border p-2 text-center font-semibold">TPS</th>
                  <th className="border border-border p-2 text-center font-semibold">OPX</th>
                  <th className="border border-border p-2 text-center font-semibold">Hub Admin</th>
                  <th className="border border-border p-2 text-center font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["View Dashboard Pages", "✓", "✓", "✓", "✓", "✓"],
                  ["Browse Equipment Catalog", "✓", "–", "✓", "–", "✓"],
                  ["Submit Equipment Request", "✓", "–", "✓", "–", "✓"],
                  ["Report Van Incidents", "✓", "–", "✓", "–", "✓"],
                  ["Submit Cycle Counts", "✓", "–", "✓", "–", "✓"],
                  ["Report Broken Items", "✓", "–", "✓", "–", "✓"],
                  ["TPS Bike Assignment", "–", "✓", "–", "–", "✓"],
                  ["View Bike History", "–", "✓", "–", "–", "✓"],
                  ["OPX Review Dashboard", "–", "–", "✓*", "–", "✓"],
                  ["Approve/Reject Requests", "–", "–", "✓*", "–", "✓"],
                  ["Validate Cycle Counts", "–", "–", "✓*", "–", "✓"],
                  ["View Analytics", "–", "–", "✓*", "–", "✓"],
                  ["Hub Fulfillment Dashboard", "–", "–", "–", "✓*", "✓"],
                  ["Bulk Inventory Moves", "–", "–", "✓*", "✓*", "✓"],
                  ["Manage Users", "–", "–", "–", "–", "✓"],
                  ["Manage Equipment Catalog", "–", "–", "–", "–", "✓"],
                  ["Bulk OPX Onboarding", "–", "–", "–", "–", "✓"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                    <td className="border border-border p-2 font-medium">{row[0]}</td>
                    <td className="border border-border p-2 text-center">{row[1]}</td>
                    <td className="border border-border p-2 text-center">{row[2]}</td>
                    <td className="border border-border p-2 text-center">{row[3]}</td>
                    <td className="border border-border p-2 text-center">{row[4]}</td>
                    <td className="border border-border p-2 text-center">{row[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">* Scoped to assigned OPS Areas or Hubs. Super Admin has unrestricted access.</p>
        </section>

        {/* 5. Features */}
        <section id="features" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            5. Feature Specifications
          </h2>
          
          <div className="space-y-6">
            {[
              {
                name: "Van Incidents",
                route: "/van-incidents/*",
                status: "✅ Implemented",
                description: "Field staff can report van accidents with photos/documents. OPX/Admin can track and resolve incidents. Status workflow: Submitted → In Review → Closed.",
              },
              {
                name: "Cycle Counts",
                route: "/cycle-counts/*",
                status: "✅ Implemented",
                description: "Field staff submit inventory counts by SKU and location with barcode scanning. OPX/Admin validate or reject counts. Full audit trail.",
              },
              {
                name: "Equipment Health",
                route: "/equipment-health/*",
                status: "✅ Implemented",
                description: "Track broken equipment and maintenance activities. Report broken items with severity levels. Create and complete maintenance records.",
              },
              {
                name: "Equipment Catalog",
                route: "/equipment",
                status: "✅ Implemented",
                description: "Browse and add equipment to cart. Region-first selection filters available items. Search by name/SKU with barcode scanning on mobile.",
              },
              {
                name: "Shopping Cart & Request",
                route: "/cart",
                status: "✅ Implemented",
                description: "Review items and submit equipment request. Select OPS Area, urgency, reason per item, rationale, and required-by date. Event logging for audit trail.",
              },
              {
                name: "OPX Review Dashboard",
                route: "/opx/dashboard",
                status: "✅ Implemented",
                description: "Review and process equipment requests for assigned OPS Areas. Approve, reject, or modify quantities. Event timeline and notifications.",
              },
              {
                name: "Hub Fulfillment Dashboard",
                route: "/hub/dashboard",
                status: "✅ Implemented",
                description: "Execute fulfillment for approved requests. Mark as fulfilled or decline with reason. Team management page.",
              },
              {
                name: "TPS Tools",
                route: "/tps/*",
                status: "✅ Implemented",
                description: "Bike assignment workflow for trips and guest reservations. Barcode scanning for bike ID. View bike assignment history.",
              },
              {
                name: "Inventory Moves",
                route: "/inventory/*",
                status: "✅ Implemented",
                description: "Bulk move equipment between OPS Areas and hub locations. Status workflow: Draft → Submitted → Completed/Cancelled.",
              },
              {
                name: "Analytics Dashboard",
                route: "/analytics/ops",
                status: "✅ Implemented",
                description: "KPI cards (requests, approvals, incidents), charts by status and OPS Area, date range filters.",
              },
              {
                name: "Admin Features",
                route: "/admin/*",
                status: "✅ Implemented",
                description: "Manage users, equipment catalog, assignments, bulk OPX onboarding, team page, view all requests.",
              },
            ].map((feature) => (
              <div key={feature.route} className="border-l-4 border-primary pl-4">
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <h3 className="font-semibold text-foreground">{feature.name}</h3>
                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{feature.route}</code>
                  <span className="text-xs text-green-600 font-medium">{feature.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Mobile Application */}
        <section id="mobile-app" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            6. Mobile Application
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">✅ Phase 2 Complete - Mobile Field App Implemented</p>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-3">6.1 Overview</h3>
          <p className="text-muted-foreground mb-4">
            Mobile-first UI at <code className="bg-muted px-2 py-0.5 rounded text-xs">/m/*</code> routes, optimized for Field Staff on phones with simplified layouts and touch-friendly targets.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">6.2 Mobile Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Mobile Home", route: "/m/home", desc: "Large action buttons for quick access to core field operations" },
              { name: "Barcode Scanner", route: "Component", desc: "Camera-based scanning using html5-qrcode library" },
              { name: "Inventory Request", route: "/m/requests/new", desc: "Multi-step form with SKU scanning and quantity selection" },
              { name: "Cycle Count", route: "/m/cycle-counts/new", desc: "Submit counts with barcode scanning for SKU lookup" },
              { name: "Bike Assignment", route: "/m/tps/assign-bikes", desc: "Scan bike barcode to assign to guests" },
              { name: "My Requests", route: "/m/requests/my", desc: "View submitted requests and status" },
            ].map((item) => (
              <div key={item.name} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.route}</code>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">6.3 Device Detection</h3>
          <p className="text-muted-foreground">
            Automatic redirect from desktop routes to <code className="bg-muted px-2 py-0.5 rounded text-xs">/m/*</code> equivalents 
            based on screen width detection. All users see mobile home page on phones; authorization enforced at page level.
          </p>
        </section>

        {/* 7. Architecture */}
        <section id="architecture" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            7. Technical Architecture
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-4">7.1 Technology Stack</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              ["Frontend", "React 18, TypeScript, Vite"],
              ["UI Components", "shadcn/ui, Radix UI"],
              ["Styling", "Tailwind CSS"],
              ["State Management", "TanStack Query (React Query)"],
              ["Routing", "React Router DOM v6"],
              ["Backend", "Lovable Cloud (Supabase)"],
              ["Database", "PostgreSQL (via Supabase)"],
              ["Authentication", "Abstracted auth service (Azure AD ready)"],
              ["Storage", "Supabase Storage"],
              ["Barcode Scanning", "html5-qrcode"],
            ].map(([layer, tech]) => (
              <div key={layer} className="flex border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 font-medium text-sm min-w-[140px]">{layer}</div>
                <div className="px-3 py-2 text-sm text-muted-foreground">{tech}</div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-3">7.2 Auth Abstraction Layer</h3>
          <p className="text-muted-foreground mb-4">
            Centralized auth service at <code className="bg-muted px-2 py-0.5 rounded text-xs">src/lib/auth/</code> exports: 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">getCurrentUser()</code>, 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">getUserRoles()</code>, 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">signIn()</code>, 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">signOut()</code>, 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">signInWithSSO()</code> (stub for Azure AD).
            AuthGuard component protects routes by authentication and role.
          </p>
        </section>

        {/* 8. Data Model */}
        <section id="data-model" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            8. Data Model
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-4">Core Tables</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left font-semibold">Table</th>
                  <th className="border border-border p-2 text-left font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["profiles", "User metadata (email, name) synced on signup"],
                  ["user_roles", "Role assignments (admin, field_staff, opx, hub_admin, tps, super_admin)"],
                  ["opx_area_assignments", "OPX ↔ OPS Area mappings"],
                  ["hub_admin_assignments", "Hub Admin ↔ Hub mappings"],
                  ["equipment_requests", "Main request records with status and rationale"],
                  ["equipment_request_line_items", "Items within requests"],
                  ["equipment_request_events", "Request audit trail"],
                  ["equipment_items", "Equipment catalog"],
                  ["ops_area_to_hub", "Geographic routing rules"],
                  ["notifications", "In-app notification storage"],
                  ["van_incidents", "Incident reports with status workflow"],
                  ["van_incident_files", "Uploaded photos/documents"],
                  ["cycle_counts", "Count header with status"],
                  ["cycle_count_lines", "SKU line items with quantities"],
                  ["cycle_count_events", "Validation audit trail"],
                  ["broken_item_reports", "Broken item submissions"],
                  ["maintenance_records", "Maintenance activity tracking"],
                  ["inventory_moves", "Bulk move headers"],
                  ["inventory_move_lines", "Move line items"],
                  ["trips", "Trip information"],
                  ["guest_reservations", "Guest booking data"],
                  ["bike_assignments", "Bike-to-guest assignments"],
                  ["team_members", "Fulfillment team profiles"],
                ].map(([table, purpose], i) => (
                  <tr key={table} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                    <td className="border border-border p-2 font-mono text-xs">{table}</td>
                    <td className="border border-border p-2 text-muted-foreground">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 9. Security */}
        <section id="security" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            9. Security Requirements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Email/password via abstracted auth service</li>
                <li>Invitation-only (no public registration)</li>
                <li>JWT tokens with automatic refresh</li>
                <li>Azure AD SSO ready (signInWithSSO stub)</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Authorization</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Role-Based Access Control (RBAC)</li>
                <li>Row-Level Security (RLS) on all tables</li>
                <li>Principle of Least Privilege</li>
                <li>Super Admin bypasses area/hub scoping</li>
                <li>SECURITY DEFINER functions for cross-role operations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 10. Integrations */}
        <section id="integrations" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            10. Integration Requirements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Current Integrations</h3>
              <div className="space-y-2">
                {[
                  ["Supabase Storage", "Equipment/incident image uploads"],
                  ["Supabase Auth", "User authentication (abstracted)"],
                  ["Resend", "Email notifications"],
                  ["html5-qrcode", "Mobile barcode scanning"],
                ].map(([name, purpose]) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">{name}:</span>
                    <span className="text-muted-foreground">{purpose}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Planned Integrations</h3>
              <div className="space-y-2">
                {[
                  ["Azure AD SSO", "Enterprise single sign-on (ready)"],
                  ["SharePoint", "Live data sync for Unit Schedule"],
                  ["NetSuite/Oracle IMS", "Inventory management sync"],
                  ["Power Automate", "Workflow automation"],
                ].map(([name, purpose]) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-600">○</span>
                    <span className="font-medium">{name}:</span>
                    <span className="text-muted-foreground">{purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Integration Placeholder Functions</h4>
            <p className="text-sm text-muted-foreground">
              The following functions are implemented as no-ops with TODO comments, ready for future integration:
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">syncInventoryRequestToExternalSystem()</code>,
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">syncValidatedCycleCountToExternalSystem()</code>,
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">syncBikeAssignmentToExternalSystem()</code>, etc.
            </p>
          </div>
        </section>

        {/* 11. Design System */}
        <section id="design-system" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            11. Design System
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Visual Identity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#1a3a3a]"></div>
                  <span className="text-sm">Primary: Dark Navy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#06b6d4]"></div>
                  <span className="text-sm">Accent: Teal/Cyan</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#f5f5f5] border border-border"></div>
                  <span className="text-sm">Background: Light Gray</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Design Principles</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Clean & Professional: Text-only navigation</li>
                <li>Responsive: Mobile-first design</li>
                <li>Accessible: WCAG-compliant contrast</li>
                <li>Consistent: Semantic tokens for colors</li>
                <li>Mobile-Optimized: Dedicated mobile layouts</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 12. Success Metrics */}
        <section id="success-metrics" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            12. Success Metrics
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left font-semibold">Metric</th>
                  <th className="border border-border p-2 text-left font-semibold">Target</th>
                  <th className="border border-border p-2 text-left font-semibold">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Request Turnaround Time", "<48 hours (standard)", "Time from submission to fulfillment"],
                  ["OPX Review SLA", "<24 hours", "Time from submission to OPX action"],
                  ["System Uptime", "99.5%", "Monitoring dashboard"],
                  ["Mobile Task Completion", "<30 seconds", "Time to complete core mobile actions"],
                  ["Broken Item Resolution", "<7 days", "Time from report to resolved"],
                  ["Cycle Count Accuracy", ">95%", "Validated vs. rejected counts"],
                ].map(([metric, target, measurement], i) => (
                  <tr key={metric} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                    <td className="border border-border p-2 font-medium">{metric}</td>
                    <td className="border border-border p-2 text-primary font-medium">{target}</td>
                    <td className="border border-border p-2 text-muted-foreground">{measurement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 13. Roadmap */}
        <section id="roadmap" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            13. Release Roadmap
          </h2>
          
          <div className="space-y-4">
            {[
              {
                phase: "Phase 1: MVP",
                status: "Complete",
                statusColor: "bg-green-100 text-green-800",
                features: ["Authentication & RBAC", "Equipment Request Workflow", "OPX & Hub Dashboards", "Admin Management", "Bulk OPX Onboarding", "Basic Notifications"],
              },
              {
                phase: "Phase 2: Field Operations",
                status: "Complete",
                statusColor: "bg-green-100 text-green-800",
                features: ["Van Incident Reporting", "Cycle Count Management", "Equipment Health (Broken Items, Maintenance)", "Mobile Field App with Barcode Scanning", "Operations Analytics Dashboard", "Inventory Moves", "TPS Bike Assignment", "Auth Abstraction for SSO Readiness"],
              },
              {
                phase: "Phase 3: Data Integration",
                status: "In Progress",
                statusColor: "bg-amber-100 text-amber-800",
                features: ["Unit Schedule with CSV Upload", "Van Module with Live Data", "Unit Loads Reporting", "Warehouses Capacity Tracking", "SharePoint Integration"],
              },
              {
                phase: "Phase 4: Enterprise Integration",
                status: "Planned",
                statusColor: "bg-blue-100 text-blue-800",
                features: ["Azure AD SSO Implementation", "NetSuite/Oracle IMS Inventory Sync", "Power Automate Workflow Automation", "Advanced Analytics & Reporting", "Audit Log System"],
              },
            ].map((phase) => (
              <div key={phase.phase} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-foreground">{phase.phase}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${phase.statusColor}`}>
                    {phase.status}
                  </span>
                </div>
                <ul className="grid md:grid-cols-2 gap-1 text-sm text-muted-foreground">
                  {phase.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-primary">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 mt-12 border-t border-border text-center text-sm text-muted-foreground">
          <p>Backroads Ops Dashboard — Product Requirements Document v2.0</p>
          <p className="mt-1">December 2025 • Platform: Lovable Cloud • Phase 2 Complete</p>
        </footer>
      </div>
    </>
  );
}
