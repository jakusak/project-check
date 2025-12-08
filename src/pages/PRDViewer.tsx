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
              <span className="font-medium">Version:</span> 1.0
            </div>
            <div>
              <span className="font-medium">Date:</span> December 2024
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-amber-600 font-medium">In Development</span>
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
            streamline equipment logistics, unit scheduling, and warehouse operations for Backroads' global cycling 
            tour operations. The system serves as a centralized hub for managing equipment requests, tracking van 
            and trailer logistics, and coordinating fulfillment across multiple geographic regions.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">1.2 Problem Statement</h3>
          <p className="text-muted-foreground mb-4">Backroads operations teams currently face challenges with:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-6 ml-4">
            <li>Manual, fragmented equipment request processes</li>
            <li>Lack of visibility into equipment availability across regions</li>
            <li>Inefficient communication between field staff, operations experts, and fulfillment teams</li>
            <li>No centralized system for tracking unit loads and warehouse capacity</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">1.3 Solution</h3>
          <p className="text-muted-foreground mb-4">A unified web-based dashboard providing:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Streamlined equipment request workflow with multi-tier approval</li>
            <li>Real-time visibility into operations data (vans, units, warehouses)</li>
            <li>Role-based access control ensuring data security</li>
            <li>Automated notifications and reminders</li>
            <li>Geographic routing logic for equipment fulfillment</li>
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
                details: ["Geographically distributed across USA, Canada, and Europe", "Varying technical proficiency", "Primary device: Mobile and desktop"],
                goals: ["Quickly request needed equipment", "Track request status", "Receive timely notifications"],
              },
              {
                title: "OPX (Operations Expert)",
                description: "Regional operations managers responsible for specific OPS Areas",
                details: ["Reviews and approves equipment requests", "200+ OPX users globally", "Assigned to one or more OPS Areas"],
                goals: ["Efficiently review incoming requests", "Ensure appropriate equipment allocation", "Maintain SLAs for request review"],
              },
              {
                title: "Hub Admin",
                description: "Fulfillment team members at warehouse locations",
                details: ["Teams of 1-4 people per hub", "Three major hubs in Europe (Tuscany, Czech, Pernes)", "Execute on approved equipment requests"],
                goals: ["See approved requests for their hub", "Track fulfillment progress", "Report on inventory movements"],
              },
              {
                title: "Administrator",
                description: "System administrators and operations leadership",
                details: ["Full access to all system functions", "Manages users, roles, and system configuration"],
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
                  <th className="border border-border p-2 text-center font-semibold">OPX</th>
                  <th className="border border-border p-2 text-center font-semibold">Hub Admin</th>
                  <th className="border border-border p-2 text-center font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["View Dashboard Pages", "✓", "✓", "✓", "✓"],
                  ["Browse Equipment Catalog", "✓", "✓", "–", "✓"],
                  ["Submit Equipment Request", "✓", "✓", "–", "✓"],
                  ["View Own Requests", "✓", "✓", "–", "✓"],
                  ["OPX Review Dashboard", "–", "✓", "–", "✓"],
                  ["Approve/Reject Requests", "–", "✓", "–", "✓"],
                  ["Hub Fulfillment Dashboard", "–", "–", "✓", "✓"],
                  ["Fulfill/Decline Requests", "–", "–", "✓", "✓"],
                  ["Manage Users", "–", "–", "–", "✓"],
                  ["Manage Equipment Catalog", "–", "–", "–", "✓"],
                  ["Manage Assignments", "–", "–", "–", "✓"],
                  ["Bulk OPX Onboarding", "–", "–", "–", "✓"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                    <td className="border border-border p-2 font-medium">{row[0]}</td>
                    <td className="border border-border p-2 text-center">{row[1]}</td>
                    <td className="border border-border p-2 text-center">{row[2]}</td>
                    <td className="border border-border p-2 text-center">{row[3]}</td>
                    <td className="border border-border p-2 text-center">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Features */}
        <section id="features" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            5. Feature Specifications
          </h2>
          
          <div className="space-y-6">
            {[
              {
                name: "Unit Schedule",
                route: "/",
                description: "Display unit schedules and logistics data with region-based filtering. Supports CSV file upload for data import.",
              },
              {
                name: "Van Module",
                route: "/van-module",
                description: "Display live van availability and usage by Operations Area. Features OPS Area filters, statistic selectors, date/period controls, and time-series charts.",
              },
              {
                name: "Unit Loads",
                route: "/unit-loads",
                description: "Display unit load assignment and logistics data with hub-based tabs (Pernes, Czechia, Tuscany) and OPS Area filtering.",
              },
              {
                name: "Warehouses",
                route: "/warehouses",
                description: "Display warehouse capacity and space needs by Operations Area with KPI snapshot cards and detailed data tables.",
              },
              {
                name: "Equipment Catalog",
                route: "/equipment",
                description: "Browse and add equipment to cart. Region-first selection filters available items. Search by name/SKU, category filter, pagination.",
              },
              {
                name: "Shopping Cart",
                route: "/cart",
                description: "Review items and submit equipment request. Select OPS Area, urgency, reason per item, and required-by date.",
              },
              {
                name: "Request History",
                route: "/my-requests",
                description: "View submitted request history with status badges and expandable line item details.",
              },
              {
                name: "OPX Review Dashboard",
                route: "/opx/dashboard",
                description: "Review and process equipment requests for assigned OPS Areas. Approve, reject, or modify quantities.",
              },
              {
                name: "Hub Fulfillment Dashboard",
                route: "/hub/dashboard",
                description: "Execute fulfillment for approved requests. Mark as fulfilled or decline with reason.",
              },
            ].map((feature) => (
              <div key={feature.route} className="border-l-4 border-primary pl-4">
                <div className="flex items-baseline gap-3 mb-1">
                  <h3 className="font-semibold text-foreground">{feature.name}</h3>
                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{feature.route}</code>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Architecture */}
        <section id="architecture" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            6. Technical Architecture
          </h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-4">6.1 Technology Stack</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              ["Frontend", "React 18, TypeScript, Vite"],
              ["UI Components", "shadcn/ui, Radix UI"],
              ["Styling", "Tailwind CSS"],
              ["State Management", "TanStack Query (React Query)"],
              ["Routing", "React Router DOM v6"],
              ["Backend", "Lovable Cloud (Supabase)"],
              ["Database", "PostgreSQL (via Supabase)"],
              ["Authentication", "Supabase Auth"],
              ["Storage", "Supabase Storage"],
              ["Edge Functions", "Deno (Supabase Edge Functions)"],
            ].map(([layer, tech]) => (
              <div key={layer} className="flex border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 font-medium text-sm min-w-[140px]">{layer}</div>
                <div className="px-3 py-2 text-sm text-muted-foreground">{tech}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Data Model */}
        <section id="data-model" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            7. Data Model
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
                  ["user_roles", "Role assignments (admin, field_staff, opx, hub_admin)"],
                  ["opx_area_assignments", "OPX ↔ OPS Area mappings"],
                  ["hub_admin_assignments", "Hub Admin ↔ Hub mappings"],
                  ["equipment_requests", "Main request records"],
                  ["equipment_request_line_items", "Items within requests"],
                  ["equipment_items", "Equipment catalog"],
                  ["ops_area_to_hub", "Geographic routing rules"],
                  ["notifications", "In-app notification storage"],
                  ["unit_loads", "Unit logistics data"],
                  ["app_settings", "System configuration"],
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

        {/* 8. Security */}
        <section id="security" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            8. Security Requirements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Email/password via Supabase Auth</li>
                <li>Invitation-only (no public registration)</li>
                <li>JWT tokens with automatic refresh</li>
                <li>Admin-initiated password recovery</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Authorization</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Role-Based Access Control (RBAC)</li>
                <li>Row-Level Security (RLS) on all tables</li>
                <li>Principle of Least Privilege</li>
                <li>Secure role-checking SQL functions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 9. Integrations */}
        <section id="integrations" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            9. Integration Requirements
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Current Integrations</h3>
              <div className="space-y-2">
                {[
                  ["Supabase Storage", "Equipment image uploads"],
                  ["Supabase Auth", "User authentication"],
                  ["Resend", "Email notifications"],
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
                  ["SharePoint", "Live data sync for Unit Schedule"],
                  ["Oracle IMS", "Inventory management sync"],
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
        </section>

        {/* 10. Design System */}
        <section id="design-system" className="mb-12 page-break">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            10. Design System
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Visual Identity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#1a3a3a]"></div>
                  <span className="text-sm">Primary: Dark Navy (#1a3a3a)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#06b6d4]"></div>
                  <span className="text-sm">Accent: Teal/Cyan (#06b6d4)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#f5f5f5] border border-border"></div>
                  <span className="text-sm">Background: Light Gray (#f5f5f5)</span>
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
              </ul>
            </div>
          </div>
        </section>

        {/* 11. Success Metrics */}
        <section id="success-metrics" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            11. Success Metrics
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
                  ["User Adoption", "200+ OPX onboarded", "Active user count"],
                  ["Request Completion Rate", ">90%", "Fulfilled vs. submitted"],
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

        {/* 12. Roadmap */}
        <section id="roadmap" className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
            12. Release Roadmap
          </h2>
          
          <div className="space-y-4">
            {[
              {
                phase: "Phase 1: MVP",
                status: "In Development",
                statusColor: "bg-amber-100 text-amber-800",
                features: ["Authentication & RBAC", "Equipment Request Workflow", "OPX & Hub Dashboards", "Admin Management", "Bulk OPX Onboarding", "Dashboard Pages (Unit Schedule, Van Module, Unit Loads, Warehouses)"],
              },
              {
                phase: "Phase 2: Data Integration",
                status: "Planned",
                statusColor: "bg-blue-100 text-blue-800",
                features: ["SharePoint integration for live data", "Automated data sync", "Enhanced reporting"],
              },
              {
                phase: "Phase 3: Inventory Integration",
                status: "Planned",
                statusColor: "bg-blue-100 text-blue-800",
                features: ["Oracle IMS integration", "Real-time inventory sync", "Automated stock updates"],
              },
              {
                phase: "Phase 4: Field Staff Expansion",
                status: "Deferred",
                statusColor: "bg-gray-100 text-gray-800",
                features: ["Field Staff equipment ordering", "Mobile-optimized experience", "Offline capability"],
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
          <p>Backroads Ops Dashboard — Product Requirements Document v1.0</p>
          <p className="mt-1">December 2024 • Platform: Lovable Cloud</p>
        </footer>
      </div>
    </>
  );
}
