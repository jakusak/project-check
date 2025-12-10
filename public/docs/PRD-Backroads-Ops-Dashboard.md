# Product Requirements Document (PRD)
# Backroads Ops Dashboard

**Version:** 2.0  
**Date:** December 2025  
**Status:** In Development (Phase 2)  
**Platform:** Lovable Cloud (React + Supabase)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [Target Users & Personas](#3-target-users--personas)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Feature Specifications](#5-feature-specifications)
6. [Mobile Application](#6-mobile-application)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Model](#8-data-model)
9. [Security Requirements](#9-security-requirements)
10. [Integration Requirements](#10-integration-requirements)
11. [Design System](#11-design-system)
12. [Success Metrics](#12-success-metrics)
13. [Release Roadmap](#13-release-roadmap)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview

The **Backroads Ops Dashboard** is an internal operations management platform designed to streamline equipment logistics, unit scheduling, warehouse operations, and field incident reporting for Backroads' global cycling tour operations. The system serves as a centralized hub for managing equipment requests, tracking van and trailer logistics, coordinating fulfillment across multiple geographic regions, and maintaining equipment health records.

### 1.2 Problem Statement

Backroads operations teams currently face challenges with:
- Manual, fragmented equipment request processes
- Lack of visibility into equipment availability across regions
- Inefficient communication between field staff, operations experts, and fulfillment teams
- No centralized system for tracking unit loads and warehouse capacity
- No standardized incident reporting workflow
- Manual cycle count and inventory reconciliation processes

### 1.3 Solution

A unified web-based dashboard providing:
- Streamlined equipment request workflow with multi-tier approval
- Real-time visibility into operations data (vans, units, warehouses)
- Role-based access control ensuring data security
- Automated notifications and reminders
- Geographic routing logic for equipment fulfillment
- **Mobile-first field app with barcode scanning**
- **Van incident reporting and tracking**
- **Cycle count management with validation workflow**
- **Equipment health tracking (broken items, maintenance records)**
- **TPS bike assignment workflow**
- **Bulk inventory move operations**
- **Operations analytics dashboard**

---

## 2. Product Vision & Objectives

### 2.1 Vision Statement

To become the single source of truth for Backroads operations, enabling seamless coordination between field staff and fulfillment teams while ensuring equipment availability and operational efficiency across all regions.

### 2.2 Key Objectives

| Objective | Description | Success Criteria |
|-----------|-------------|------------------|
| **Streamline Equipment Requests** | Reduce time from request to fulfillment | <48 hours for standard requests |
| **Improve Visibility** | Centralized view of all operations data | 100% of active requests visible to stakeholders |
| **Reduce Manual Work** | Automate routing and notifications | 90% reduction in email-based coordination |
| **Ensure Accountability** | Clear audit trail for all actions | 100% traceability of approvals |
| **Scale Operations** | Support 200+ OPX users across regions | System handles concurrent users without degradation |
| **Mobile-First Field Operations** | Enable field staff to work from phones | <30 second task completion on mobile |
| **Equipment Health Tracking** | Maintain accurate equipment status | 100% of broken items tracked and resolved |

---

## 3. Target Users & Personas

### 3.1 Field Staff

**Profile:**
- Tour leaders and field employees who need equipment for trips
- Geographically distributed across USA, Canada, and Europe
- Varying technical proficiency
- **Primary device: Mobile (phone/tablet)**

**Goals:**
- Quickly request needed equipment
- Track request status
- Receive timely notifications
- **Report van incidents efficiently**
- **Submit cycle counts from the field**
- **Report broken equipment immediately**

**Pain Points:**
- Previous process required emails and manual follow-ups
- No visibility into request status
- Unclear which hub would fulfill their request

### 3.2 OPX (Operations Expert)

**Profile:**
- Regional operations managers
- Responsible for specific OPS Areas (geographic regions)
- Reviews and approves equipment requests
- 200+ OPX users globally

**Goals:**
- Efficiently review incoming requests
- Ensure appropriate equipment allocation
- Maintain SLAs for request review
- **Monitor operations analytics**
- **Validate cycle counts**
- **Track van incidents in their areas**

**Pain Points:**
- High volume of requests to manage
- No automated reminders for pending reviews
- Manual tracking of request status

### 3.3 Hub Admin

**Profile:**
- Fulfillment team members at warehouse locations
- Teams of 1-4 people per hub
- Execute on approved equipment requests
- **Five hubs:** Tuscany, Czech, Pernes (Europe), USA Hub, Canada Hub

**Goals:**
- See approved requests for their hub
- Track fulfillment progress
- Report on inventory movements

**Pain Points:**
- Disconnected from approval workflow
- Manual inventory tracking
- No system integration with inventory management

### 3.4 TPS (Trip Prep Specialist)

**Profile:**
- Responsible for preparing bikes for guest trips
- Assigns specific bikes to guest reservations
- Tracks bike assignment history

**Goals:**
- Quickly assign bikes to guests
- Track bike usage history
- Ensure proper bike-to-guest matching

### 3.5 Super Admin

**Profile:**
- System administrators and operations leadership
- Full access to all system functions across all regions
- Manages users, roles, and system configuration

**Goals:**
- Maintain user access and permissions
- Configure system settings
- Monitor overall operations health
- Generate reports
- **Access all OPS Areas and Hubs without assignment restrictions**

---

## 4. User Roles & Permissions

### 4.1 Role Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                             │
│  │ Super Admin │ ◄─── Global unrestricted access             │
│  └──────┬──────┘                                             │
│         │                                                    │
│  ┌──────▼──────┐                                             │
│  │    Admin    │ ◄─── Full system administration             │
│  └──────┬──────┘                                             │
│         │                                                    │
│  ┌──────┴──────────────┬───────────────┬───────────────┐    │
│  │                     │               │               │    │
│  ▼                     ▼               ▼               ▼    │
│ ┌─────────┐      ┌───────────┐   ┌───────────┐   ┌─────┐   │
│ │   OPX   │      │ Hub Admin │   │    TPS    │   │Field│   │
│ └─────────┘      └───────────┘   └───────────┘   │Staff│   │
│                                                   └─────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Permission Matrix

| Feature | Field Staff | TPS | OPX | Hub Admin | Admin | Super Admin |
|---------|:-----------:|:---:|:---:|:---------:|:-----:|:-----------:|
| **View Dashboard Pages** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Browse Equipment Catalog** | ✓ | – | ✓ | – | ✓ | ✓ |
| **Submit Equipment Request** | ✓ | – | ✓ | – | ✓ | ✓ |
| **View Own Requests** | ✓ | – | ✓ | – | ✓ | ✓ |
| **Report Van Incidents** | ✓ | – | ✓ | – | ✓ | ✓ |
| **Submit Cycle Counts** | ✓ | – | ✓ | – | ✓ | ✓ |
| **Report Broken Items** | ✓ | – | ✓ | – | ✓ | ✓ |
| **TPS Bike Assignment** | – | ✓ | – | – | ✓ | ✓ |
| **View Bike History** | – | ✓ | – | – | ✓ | ✓ |
| **OPX Review Dashboard** | – | – | ✓* | – | ✓ | ✓ |
| **Approve/Reject Requests** | – | – | ✓* | – | ✓ | ✓ |
| **Validate Cycle Counts** | – | – | ✓* | – | ✓ | ✓ |
| **View Analytics** | – | – | ✓* | – | ✓ | ✓ |
| **Hub Fulfillment Dashboard** | – | – | – | ✓* | ✓ | ✓ |
| **Fulfill/Decline Requests** | – | – | – | ✓* | ✓ | ✓ |
| **Bulk Inventory Moves** | – | – | ✓* | ✓* | ✓ | ✓ |
| **View Audit Log** | – | – | ✓* | – | ✓ | ✓ |
| **Manage Users** | – | – | – | – | ✓ | ✓ |
| **Manage Equipment Catalog** | – | – | – | – | ✓ | ✓ |
| **Manage Assignments** | – | – | – | – | ✓ | ✓ |
| **Bulk OPX Onboarding** | – | – | – | – | ✓ | ✓ |
| **All Areas/Hubs Access** | – | – | – | – | – | ✓ |

*Scoped to assigned OPS Areas or Hubs

### 4.3 Role Assignment

- **User Role Table:** `user_roles` stores role assignments (enum: admin, user, field_staff, opx, hub_admin, super_admin, tps)
- **OPX Assignments:** `opx_area_assignments` maps OPX users to OPS Areas
- **Hub Admin Assignments:** `hub_admin_assignments` maps Hub Admins to fulfillment hubs
- **Invitation-Only Access:** No public signups; users must be invited by administrators

---

## 5. Feature Specifications

### 5.1 Authentication & Authorization

#### 5.1.1 Sign-In
- Email/password authentication via abstracted auth service
- Invitation-only model (no self-registration)
- Auto-confirm email signups enabled for invited users
- Session persistence with secure token management
- **Placeholder for Microsoft SSO (future Azure AD integration)**

#### 5.1.2 Auth Abstraction Layer
- Centralized auth service at `src/lib/auth/`
- Exports: `getCurrentUser()`, `getUserRoles()`, `signIn()`, `signOut()`, `signInWithSSO()`
- AuthGuard component for route protection by role
- **Designed for future swap to Azure AD without component changes**

#### 5.1.3 User Management (Admin)
- View all users with email and role information
- Assign/remove roles (admin, field_staff, opx, hub_admin, tps, super_admin)
- Bulk OPX onboarding via CSV upload

---

### 5.2 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKROADS OPS DASHBOARD                      [🔔] [Sign Out]    │
├─────────────────────────────────────────────────────────────────┤
│ Analytics* │ Van Incidents │ Equipment & Inventory ▼ │          │
│ Cycle Counts ▼ │ OPX Review* │ Hub Fulfillment* │               │
│ Equipment Health ▼ │ TPS Tools* │ Admin ▼* │                    │
│                                                                 │
│ Equipment & Inventory:                                          │
│   ├─ New Inventory Request                                      │
│   ├─ Equipment Catalog                                          │
│   └─ Inventory Moves                                            │
│                                                                  │
│ Cycle Counts:                                                    │
│   ├─ New Cycle Count                                            │
│   ├─ My Cycle Counts                                            │
│   └─ Review Cycle Counts*                                       │
│                                                                  │
│ Equipment Health:                                                │
│   ├─ Report Broken Item                                         │
│   ├─ Broken Items List                                          │
│   ├─ New Maintenance Record                                     │
│   └─ Maintenance List                                           │
│                                                                  │
│ TPS Tools:                                                       │
│   ├─ Assign Bikes                                               │
│   └─ Bike History Search                                        │
│                                                                  │
│ Admin:                                                           │
│   ├─ All Requests                                               │
│   ├─ Manage Equipment                                           │
│   ├─ Manage Users                                               │
│   ├─ Manage Assignments                                         │
│   ├─ Bulk OPX Onboarding                                        │
│   └─ Team Page                                                  │
│                                                                  │
│ Future Projects ▼:                                               │
│   ├─ Unit Schedule                                              │
│   ├─ Van Module                                                 │
│   ├─ Unit Loads                                                 │
│   └─ Warehouses                                                 │
└─────────────────────────────────────────────────────────────────┘
* Visible only to users with appropriate roles
```

---

### 5.3 Van Incidents (✅ Implemented)

**Route:** `/van-incidents/*`

**Purpose:** Enable field staff to report van accidents and track incident resolution

**Features:**
- **Submission Form:** (`/van-incidents/new`)
  - Van ID, License Plate, VIN
  - Incident date, time, location, weather conditions
  - Detailed description
  - Photo/document uploads (stored in `incident-files` bucket)
  - OPS Area assignment
- **Incident List:** (`/van-incidents`)
  - Field Staff: View own submissions
  - OPX/Admin: View all incidents for assigned areas
  - Filters: Date range, OPS Area, Status
- **Status Workflow:** Submitted → In Review → Closed
- **Detail Page:** Full incident information with uploaded files

**Database Tables:**
- `van_incidents` - Main incident records
- `van_incident_files` - Uploaded photos/documents

---

### 5.4 Cycle Counts (✅ Implemented)

**Route:** `/cycle-counts/*`

**Purpose:** Enable field staff to submit inventory counts with OPX/Admin validation

**Features:**
- **New Cycle Count:** (`/cycle-counts/new`)
  - Select OPS Area and location
  - Add multiple SKU line items with quantities
  - Optional notes and photos per item
  - Barcode scanning on mobile
- **My Cycle Counts:** (`/cycle-counts/my`)
  - Field staff view their submissions
  - Status badges (Submitted, Validated, Rejected)
- **Review Cycle Counts:** (`/cycle-counts/review`)
  - OPX/Admin queue of submitted counts
  - Validate or reject with notes
  - View line item details and photos
- **Audit Trail:** All status changes logged to `cycle_count_events`

**Database Tables:**
- `cycle_counts` - Header records
- `cycle_count_lines` - Line items with quantities
- `cycle_count_events` - Audit log

---

### 5.5 Equipment Health (✅ Implemented)

**Route:** `/equipment-health/*`

**Purpose:** Track broken equipment and maintenance activities

**Features:**
- **Report Broken Item:** (`/equipment-health/report`)
  - Equipment SKU lookup with barcode scanning
  - OPS Area, location, severity (Low/Medium/High)
  - Description and photo upload
- **Broken Items List:** (`/equipment-health/broken-items`)
  - Filter by OPS Area, status, severity
  - Status workflow: Open → In Maintenance → Resolved
- **Maintenance Records:** (`/equipment-health/maintenance`)
  - Create maintenance records (linked or standalone)
  - Track maintenance type, notes, photos
  - Status: Open → Completed

**Database Tables:**
- `broken_item_reports` - Broken item submissions
- `maintenance_records` - Maintenance activity tracking

---

### 5.6 Equipment Request Workflow (✅ Implemented)

#### 5.6.1 Equipment Catalog

**Route:** `/equipment`

**Purpose:** Browse and add equipment to cart

**Features:**
- Region-first selection (mandatory before browsing)
- Equipment grid with images, names, SKUs
- Search by name/SKU with barcode scanning on mobile
- Category filter (5 categories)
- Pagination
- Add to cart functionality

**Equipment Categories:**
1. Bike Equipment
2. Trailer Parts
3. Trip Equipment
4. IT Equipment
5. Other

#### 5.6.2 Shopping Cart

**Route:** `/cart`

**Purpose:** Review items and submit equipment request

**Features:**
- Cart item list with quantity adjustment
- Remove items
- **OPS Area Selection:** 
  - Auto-populates with OPX's assigned areas
  - Auto-selects if only one area assigned
  - Dropdown if multiple areas
- **Urgency Selection:** "Urgent" or "Needed soon"
- **Reason per Item:** Required dropdown
- **Rationale:** Required text field
- **Required By Date:** Date picker
- Submit request button

**Event Logging:**
- All status changes logged to `equipment_request_events`
- Event types: created, approved, rejected, modified, fulfilled, shipped, cancelled

#### 5.6.3 Request History

**Route:** `/my-requests`

**Purpose:** View submitted request history and status

**Features:**
- List of user's requests (newest first)
- Request status badges (pending, approved, rejected, fulfilled, in_transit, cancelled)
- Expandable request details with event timeline
- Line item view with individual statuses

---

### 5.7 OPX Review Dashboard (✅ Implemented)

**Route:** `/opx/dashboard`

**Access:** OPX role, Admin, or Super Admin

**Purpose:** Review and process equipment requests for assigned OPS Areas

**Features:**
- Pending requests queue (filtered to OPX's assigned areas)
- Request details view with rationale and event timeline
- **Actions:**
  - Approve (forwards to Hub)
  - Reject (with required reason)
  - Modify quantities (original preserved)
  - Add OPX notes
- Notifications sent to requester on action

**Reminder System:**
- Global timeframe configured by Admin
- In-app + email reminders for overdue reviews

---

### 5.8 Hub Fulfillment Dashboard (✅ Implemented)

**Route:** `/hub/dashboard`

**Access:** Hub Admin role, Admin, or Super Admin

**Purpose:** Execute fulfillment for approved requests

**Features:**
- Approved requests queue (filtered to Hub Admin's assigned hub)
- Request details with approved quantities
- **Actions:**
  - Fulfill (marks complete, triggers external sync placeholder)
  - Decline (with reason)
- Notifications sent to requester on action
- **Team Page:** View fulfillment team members by hub

---

### 5.9 TPS Tools (✅ Implemented)

**Route:** `/tps/*`

**Access:** TPS role or Admin

**Purpose:** Bike assignment workflow for trips and guest reservations

**Features:**
- **Assign Bikes:** (`/tps/assign-bikes`)
  - Search by trip or reservation
  - Select guests and assign specific bikes
  - Barcode scanning for bike ID
  - Prevents duplicate active assignments
- **Bike History:** (`/tps/bikes/:bikeId/history`)
  - View all assignments for a bike
  - Linked maintenance records

**Database Tables:**
- `trips` - Trip information
- `guest_reservations` - Guest booking data
- `bike_assignments` - Bike-to-guest assignments

---

### 5.10 Inventory Moves (✅ Implemented)

**Route:** `/inventory/*`

**Access:** OPX, Hub Admin, Admin, or Super Admin

**Purpose:** Bulk move equipment between OPS Areas and hub locations

**Features:**
- **New Inventory Move:** (`/inventory/moves/new`)
  - Select source and target areas/locations
  - Add multiple SKU line items with quantities
  - Submit move request
- **Inventory Moves List:** (`/inventory/moves`)
  - Filter by date, status, OPS Area
  - Status workflow: Draft → Submitted → Completed/Cancelled
- **Completion triggers external sync placeholder**

**Database Tables:**
- `inventory_moves` - Move header records
- `inventory_move_lines` - Line items with quantities

---

### 5.11 Analytics Dashboard (✅ Implemented)

**Route:** `/analytics/ops`

**Access:** OPX, Admin, or Super Admin

**Purpose:** Operational insights and KPI tracking

**Features:**
- **KPI Cards (Last 30 Days):**
  - Inventory requests submitted
  - Approval percentage
  - Median approval time (from events)
  - Van incidents submitted
- **Charts:**
  - Requests/incidents by status
  - Requests/incidents by OPS Area
- **Filters:** Date range, OPS Area selection

---

### 5.12 Admin Features (✅ Implemented)

#### 5.12.1 All Requests

**Route:** `/admin/requests`

View all equipment requests system-wide with filtering by status and date range.

#### 5.12.2 Request Detail

**Route:** `/admin/request/:id`

Detailed view with full event timeline.

#### 5.12.3 Manage Equipment

**Route:** `/admin/equipment`

CRUD operations for equipment catalog with image upload to Supabase storage.

#### 5.12.4 Manage Users

**Route:** `/admin/users`

Assign/remove roles (admin, field_staff, opx, hub_admin, tps, super_admin).

#### 5.12.5 Manage Assignments

**Route:** `/admin/assignments`

- OPX ↔ OPS Area assignments
- Hub Admin ↔ Hub assignments
- Configure global OPX reminder timeframe

#### 5.12.6 Bulk OPX Onboarding

**Route:** `/admin/bulk-opx`

CSV upload for mass user invitation with automatic role and area assignment.

#### 5.12.7 Team Page

**Route:** `/team`

Manage fulfillment team member profiles by hub with photo uploads.

---

### 5.13 Notification System (✅ Implemented)

**Purpose:** Keep users informed of request status changes

**Components:**
- Notification bell in header with unread count badge
- Dropdown with recent notifications
- Click to navigate to relevant page
- Mark as read functionality
- **Created via SECURITY DEFINER function** for secure cross-role notifications

**Notification Triggers:**

| Event | Recipient | Type |
|-------|-----------|------|
| Request submitted | Assigned OPX | info |
| OPX approves | Requester | success |
| OPX rejects | Requester | warning |
| Hub fulfills | Requester | success |
| Hub declines | Requester | warning |
| Review overdue | OPX | reminder |
| Van incident submitted | OPS Admin | info |
| Cycle count validated | Submitter | success |
| Broken item reported | OPS Admin | warning |

---

## 6. Mobile Application

### 6.1 Overview

**Route Prefix:** `/m/*`

**Purpose:** Mobile-first UI optimized for Field Staff on phones

**Layout:** `MobileLayout` component with simplified header and bottom navigation

### 6.2 Mobile Home

**Route:** `/m/home`

Large action buttons for quick access to core field operations:
- Report Accident → `/m/van-incidents/new`
- Request Inventory → `/m/requests/new`
- Cycle Count → `/m/cycle-counts/new`
- Report Broken Item → `/m/broken-items/new`
- Assign Bike → `/m/tps/assign-bikes`

### 6.3 Mobile Barcode Scanner (✅ Implemented)

**Component:** `MobileBarcodeScanner`

**Features:**
- Uses `html5-qrcode` library for camera-based scanning
- Full-screen modal UI optimized for phones
- `onScanSuccess(value)` and `onClose()` callbacks
- Graceful fallback if camera access denied
- Integrated into all mobile forms for SKU/bike lookup

### 6.4 Mobile Inventory Request (✅ Implemented)

**Route:** `/m/requests/new`

Multi-step form:
1. Select OPS Area (auto-fill if only one assigned)
2. Add line items: Search/scan equipment, set quantity, select reason
3. Enter rationale and required-by date
4. Submit and view confirmation

### 6.5 Mobile Cycle Count (✅ Implemented)

**Route:** `/m/cycle-counts/new`

- Select OPS Area and location
- Add line items with barcode scanning
- Submit count for OPX validation

### 6.6 Mobile Bike Assignment (✅ Implemented)

**Route:** `/m/tps/assign-bikes`

- Search trips/reservations
- Scan bike barcode to assign
- Quick assignment workflow

### 6.7 Device Detection & Redirect

**Hook:** `useMobileRedirect`

Automatically redirects mobile users from desktop routes to `/m/*` equivalents based on screen width detection. All users see mobile home page on phones regardless of role; authorization enforced at page level.

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | shadcn/ui, Radix UI |
| **Styling** | Tailwind CSS |
| **State Management** | TanStack Query (React Query) |
| **Routing** | React Router DOM v6 |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Abstracted auth service (currently Supabase Auth, Azure AD ready) |
| **Storage** | Supabase Storage |
| **Edge Functions** | Deno (Supabase Edge Functions) |
| **Barcode Scanning** | html5-qrcode |

### 7.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Application                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Pages   │  │Components│  │  Hooks   │  │ Contexts │ │   │
│  │  │(Desktop) │  │          │  │          │  │          │ │   │
│  │  │(Mobile)  │  │          │  │          │  │          │ │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │   │
│  │       └──────────────┴──────────────┴──────────────┘      │   │
│  │                          │                                 │   │
│  │              ┌───────────▼───────────┐                    │   │
│  │              │   Auth Abstraction    │                    │   │
│  │              │   (lib/auth/)         │                    │   │
│  │              └───────────┬───────────┘                    │   │
│  │                          │                                 │   │
│  │              ┌───────────▼───────────┐                    │   │
│  │              │   Supabase Client     │                    │   │
│  │              └───────────────────────┘                    │   │
│  └─────────────────────────│─────────────────────────────────┘   │
│                            │                                     │
└────────────────────────────│─────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD (Supabase)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Supabase API                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │              │                │              │          │
│  ┌────▼────┐   ┌─────▼─────┐   ┌─────▼─────┐   ┌────▼─────┐   │
│  │  Auth   │   │  Database │   │  Storage  │   │  Edge    │   │
│  │         │   │(PostgreSQL)│   │  Buckets  │   │ Functions│   │
│  └─────────┘   └───────────┘   └───────────┘   └──────────┘   │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │  RLS Policies │                                  │
│              └───────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Key Frontend Patterns

- **Auth Abstraction:** `lib/auth/` service for future SSO swap
- **AuthGuard:** Route protection component by authentication and role
- **Context Providers:** AuthProvider, RegionProvider
- **Query Patterns:** TanStack Query for data fetching with caching
- **Event Sourcing:** Audit tables for all major entities
- **Component Structure:** Page → Feature Components → UI Components
- **Mobile-First:** Separate `/m/*` routes with responsive layouts

---

## 8. Data Model

### 8.1 Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata (email, name) synced on signup |
| `user_roles` | Role assignments (admin, field_staff, opx, hub_admin, tps, super_admin) |
| `opx_area_assignments` | OPX ↔ OPS Area mappings |
| `hub_admin_assignments` | Hub Admin ↔ Hub mappings |
| `equipment_requests` | Main request records with status and rationale |
| `equipment_request_line_items` | Items within requests |
| `equipment_request_events` | Request audit trail |
| `equipment_items` | Equipment catalog |
| `ops_area_to_hub` | Geographic routing rules |
| `notifications` | In-app notification storage |

### 8.2 Van Incidents Tables

| Table | Purpose |
|-------|---------|
| `van_incidents` | Incident reports with status workflow |
| `van_incident_files` | Uploaded photos/documents |

### 8.3 Cycle Count Tables

| Table | Purpose |
|-------|---------|
| `cycle_counts` | Count header with status |
| `cycle_count_lines` | SKU line items with quantities |
| `cycle_count_events` | Validation audit trail |

### 8.4 Equipment Health Tables

| Table | Purpose |
|-------|---------|
| `broken_item_reports` | Broken item submissions |
| `maintenance_records` | Maintenance activity tracking |

### 8.5 Inventory & TPS Tables

| Table | Purpose |
|-------|---------|
| `inventory_moves` | Bulk move headers |
| `inventory_move_lines` | Move line items |
| `trips` | Trip information |
| `guest_reservations` | Guest booking data |
| `bike_assignments` | Bike-to-guest assignments |

### 8.6 System Tables

| Table | Purpose |
|-------|---------|
| `app_settings` | System configuration (e.g., reminder timeframes) |
| `team_members` | Fulfillment team profiles |
| `unit_loads` | Unit logistics data |
| `inventory_sync_logs` | (Future) Integration audit trail |

---

## 9. Security Requirements

### 9.1 Authentication

- **Method:** Email/password via abstracted auth service
- **Access Model:** Invitation-only (no public registration)
- **Session:** JWT tokens with automatic refresh
- **Future:** Azure AD SSO integration point ready (`signInWithSSO()` stub)

### 9.2 Authorization

- **Role-Based Access Control (RBAC):** Enforced via `user_roles` table
- **Row-Level Security (RLS):** All tables protected by RLS policies
- **Principle of Least Privilege:** Users see only data relevant to their role
- **Super Admin:** Bypasses area/hub scoping restrictions

### 9.3 RLS Policy Summary

| Table | Policy |
|-------|--------|
| `equipment_requests` | Users see own; OPX sees assigned areas; Hub Admin sees approved for hub; Super Admin/Admin sees all |
| `equipment_request_events` | Inherits from parent request |
| `van_incidents` | Users see own; OPX sees assigned areas; Admin sees all |
| `cycle_counts` | Users see own; OPX sees assigned areas for validation; Admin sees all |
| `broken_item_reports` | Users see own; OPX sees assigned areas; Admin sees all |
| `maintenance_records` | Users see own; OPX sees assigned areas; Admin sees all |
| `inventory_moves` | OPX/Hub Admin sees for assigned areas/hubs; Admin sees all |
| `bike_assignments` | TPS and Admin access only |
| `notifications` | Users see own only; created via SECURITY DEFINER function |

### 9.4 Security Functions

```sql
-- Secure role checking function
create or replace function public.has_role(_user_id uuid, _role app_role)

-- Secure notification creation (bypasses RLS)
create or replace function public.create_notification(...)
```

### 9.5 Data Protection

- **Sensitive Data:** OPS Area ↔ Hub mappings restricted to authenticated users
- **Competitive Intelligence:** Geographic footprint data not publicly exposed
- **Audit Trail:** All modifications logged with user IDs and timestamps
- **Cascade Policies:** Foreign key constraints support user deletion

---

## 10. Integration Requirements

### 10.1 Current Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| **Supabase Storage** | ✅ Active | Equipment/incident image uploads |
| **Supabase Auth** | ✅ Active | User authentication (abstracted) |
| **Resend** | ✅ Configured | Email notifications |
| **html5-qrcode** | ✅ Active | Mobile barcode scanning |

### 10.2 Planned Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| **Azure AD SSO** | 🔄 Prepared | Enterprise single sign-on |
| **SharePoint** | 🔄 Planned | Live data sync for Unit Schedule |
| **NetSuite/Oracle IMS** | 🔄 Planned | Inventory management sync |
| **Power Automate** | 🔄 Planned | Workflow automation |

### 10.3 Integration Placeholder Functions

The following placeholder functions are implemented as no-ops with TODO comments, ready for future integration:

- `syncInventoryRequestToExternalSystem()` - Called on request approval
- `syncValidatedCycleCountToExternalSystem()` - Called on cycle count validation
- `syncInventoryMoveToExternalSystem()` - Called on move completion
- `syncBikeAssignmentToExternalSystem()` - Called on bike assignment
- `syncMaintenanceRecordToExternalSystem()` - Called on maintenance completion
- `notifyOpsAdminForIncident()` - Called on incident submission
- `notifyOpsAdminForBrokenItem()` - Called on broken item report

### 10.4 Azure AD SSO Integration (Ready)

**Current State:** Auth service abstraction in place at `src/lib/auth/`

**To Implement:**
1. Install `@azure/msal-browser`
2. Implement `signInWithSSO()` in `authService.ts` using MSAL
3. Map Azure tokens to `AuthUser` format
4. No component changes required

---

## 11. Design System

### 11.1 Visual Identity

| Element | Specification |
|---------|---------------|
| **Primary Color** | Dark navy (`hsl(180, 37%, 16%)`) |
| **Accent Color** | Teal/cyan (`hsl(187, 96%, 42%)`) |
| **Background** | Light gray (`hsl(0, 0%, 96%)`) |
| **Typography** | Inter font family (400, 500, 600, 700) |
| **Logo** | Backroads logo in header left |

### 11.2 Component Library

- **Base:** shadcn/ui components
- **Icons:** Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form with Zod validation

### 11.3 Design Principles

1. **Clean & Professional:** Text-only navigation, minimal decorative icons
2. **Responsive:** Mobile-first, works on phones, tablets, and desktop
3. **Accessible:** WCAG-compliant contrast ratios
4. **Consistent:** Semantic tokens for all colors/spacing via CSS variables
5. **Mobile-Optimized:** Dedicated mobile layouts with touch-friendly targets

### 11.4 Header Design

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] BACKROADS OPS DASHBOARD  [Nav Items...]  [🔔] [Sign Out] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Success Metrics

### 12.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Request Turnaround Time** | <48 hours (standard) | Time from submission to fulfillment |
| **OPX Review SLA** | <24 hours | Time from submission to OPX action |
| **System Uptime** | >99.5% | Availability monitoring |
| **Mobile Task Completion** | <30 seconds | Time to complete core mobile actions |
| **Broken Item Resolution** | <7 days | Time from report to resolved status |
| **Cycle Count Accuracy** | >95% | Validated vs. rejected counts |

### 12.2 User Satisfaction Metrics

| Metric | Method |
|--------|--------|
| **Adoption Rate** | Active users / invited users |
| **Mobile Usage** | % of actions from mobile devices |
| **Feature Utilization** | Usage analytics per feature |

---

## 13. Release Roadmap

### Phase 1: MVP (✅ Completed)
- Authentication & role-based access
- Equipment catalog and request workflow
- OPX review and Hub fulfillment dashboards
- Basic notifications
- Admin user management

### Phase 2: Field Operations (✅ Completed)
- Van incident reporting
- Cycle count management
- Equipment health tracking (broken items, maintenance)
- Mobile field app with barcode scanning
- Operations analytics dashboard
- Inventory moves
- TPS bike assignment
- Auth abstraction for SSO readiness

### Phase 3: Data Integration (🔄 In Progress)
- Unit Schedule with CSV upload
- Van Module with live data
- Unit Loads reporting
- Warehouses capacity tracking
- SharePoint integration for automated data sync

### Phase 4: Enterprise Integration (📋 Planned)
- Azure AD SSO implementation
- NetSuite/Oracle IMS inventory sync
- Power Automate workflow automation
- Advanced analytics and reporting
- Audit log system

---

## 14. Appendices

### 14.1 OPS Area to Hub Mappings

**Europe (3 Hubs):**
- **Czech Hub:** Czechia, Germany Bavaria, Germany Berlin, Latvia, Netherlands, Poland, Sweden, Norway, England, Finland Rovaniemi
- **Tuscany Hub:** Italy regions and surrounding areas
- **Pernes Hub (France):** France regions, parts of Italy, Mediterranean, Spain, Portugal, Iceland, Ireland, Scotland, Slovenia, Greece, Morocco, Switzerland

**North America (2 Hubs):**
- **USA Hub:** All US OPS Areas (26 areas including California, New York, Colorado, Alaska, Hawaii, etc.)
- **Canada Hub:** Canada Canmore, Canada Halifax, Canada Quebec City, Canada St. John's, Canada Victoria

### 14.2 Request Reasons

1. Need more standard inventory equipment
2. We ran out of this item
3. Item is lost
4. Item was not delivered to the OPS Area
5. Item is broken/non re-usable

### 14.3 Equipment Categories

1. Bike Equipment
2. Trailer Parts
3. Trip Equipment
4. IT Equipment
5. Other

### 14.4 Status Enums

**Equipment Request Status:**
- pending → approved → fulfilled
- pending → rejected
- pending → cancelled
- approved → in_transit → fulfilled
- approved → declined

**Incident Status:**
- submitted → in_review → closed

**Cycle Count Status:**
- submitted → validated
- submitted → rejected

**Broken Item Status:**
- open → in_maintenance → resolved

**Maintenance Status:**
- open → completed

### 14.5 Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `equipment-images` | Equipment catalog photos |
| `incident-files` | Van incident photos/documents |
| `cycle-count-photos` | Cycle count evidence photos |
| `equipment-health-photos` | Broken item and maintenance photos |
| `team-photos` | Team member profile photos |

---

*Document Version: 2.0*  
*Last Updated: December 2024*  
*Status: In Development (Phase 2 Complete)*
