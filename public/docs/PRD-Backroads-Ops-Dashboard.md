# Product Requirements Document (PRD)
# Backroads Ops Dashboard

**Version:** 1.0  
**Date:** December 2024  
**Status:** In Development  
**Platform:** Lovable Cloud (React + Supabase)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [Target Users & Personas](#3-target-users--personas)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Feature Specifications](#5-feature-specifications)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [Security Requirements](#8-security-requirements)
9. [Integration Requirements](#9-integration-requirements)
10. [Design System](#10-design-system)
11. [Success Metrics](#11-success-metrics)
12. [Release Roadmap](#12-release-roadmap)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview

The **Backroads Ops Dashboard** is an internal operations management platform designed to streamline equipment logistics, unit scheduling, and warehouse operations for Backroads' global cycling tour operations. The system serves as a centralized hub for managing equipment requests, tracking van and trailer logistics, and coordinating fulfillment across multiple geographic regions.

### 1.2 Problem Statement

Backroads operations teams currently face challenges with:
- Manual, fragmented equipment request processes
- Lack of visibility into equipment availability across regions
- Inefficient communication between field staff, operations experts, and fulfillment teams
- No centralized system for tracking unit loads and warehouse capacity

### 1.3 Solution

A unified web-based dashboard providing:
- Streamlined equipment request workflow with multi-tier approval
- Real-time visibility into operations data (vans, units, warehouses)
- Role-based access control ensuring data security
- Automated notifications and reminders
- Geographic routing logic for equipment fulfillment

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

---

## 3. Target Users & Personas

### 3.1 Field Staff

**Profile:**
- Tour leaders and field employees who need equipment for trips
- Geographically distributed across USA, Canada, and Europe
- Varying technical proficiency
- Primary device: Mobile (tablet/phone) and desktop

**Goals:**
- Quickly request needed equipment
- Track request status
- Receive timely notifications

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

**Pain Points:**
- High volume of requests to manage
- No automated reminders for pending reviews
- Manual tracking of request status

### 3.3 Hub Admin

**Profile:**
- Fulfillment team members at warehouse locations
- Teams of 1-4 people per hub
- Execute on approved equipment requests
- Three major hubs in Europe (Tuscany, Czech, Pernes)

**Goals:**
- See approved requests for their hub
- Track fulfillment progress
- Report on inventory movements

**Pain Points:**
- Disconnected from approval workflow
- Manual inventory tracking
- No system integration with inventory management

### 3.4 Administrator

**Profile:**
- System administrators and operations leadership
- Full access to all system functions
- Manages users, roles, and system configuration

**Goals:**
- Maintain user access and permissions
- Configure system settings
- Monitor overall operations health
- Generate reports

---

## 4. User Roles & Permissions

### 4.1 Role Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐                                                 │
│  │  Admin  │ ◄─── Full system access                        │
│  └────┬────┘                                                 │
│       │                                                      │
│  ┌────┴────────────────┬───────────────────┐                │
│  │                     │                   │                │
│  ▼                     ▼                   ▼                │
│ ┌─────────┐      ┌───────────┐      ┌───────────┐          │
│ │   OPX   │      │ Hub Admin │      │Field Staff│          │
│ └─────────┘      └───────────┘      └───────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Permission Matrix

| Feature | Field Staff | OPX | Hub Admin | Admin |
|---------|:-----------:|:---:|:---------:|:-----:|
| **View Unit Schedule** | ✓ | ✓ | ✓ | ✓ |
| **View Van Module** | ✓ | ✓ | ✓ | ✓ |
| **View Unit Loads** | ✓ | ✓ | ✓ | ✓ |
| **View Warehouses** | ✓ | ✓ | ✓ | ✓ |
| **Browse Equipment Catalog** | ✓ | ✓ | ✓ | ✓ |
| **Submit Equipment Request** | ✓ | ✓ | – | ✓ |
| **View Own Requests** | ✓ | ✓ | – | ✓ |
| **OPX Review Dashboard** | – | ✓ | – | ✓ |
| **Approve/Reject Requests** | – | ✓ | – | ✓ |
| **Hub Fulfillment Dashboard** | – | – | ✓ | ✓ |
| **Fulfill/Decline Requests** | – | – | ✓ | ✓ |
| **Manage Users** | – | – | – | ✓ |
| **Manage Equipment Catalog** | – | – | – | ✓ |
| **Manage Assignments** | – | – | – | ✓ |
| **View All Requests** | – | – | – | ✓ |
| **Bulk OPX Onboarding** | – | – | – | ✓ |

### 4.3 Role Assignment

- **User Role Table:** `user_roles` stores role assignments (enum: admin, user, field_staff, opx, hub_admin)
- **OPX Assignments:** `opx_area_assignments` maps OPX users to OPS Areas
- **Hub Admin Assignments:** `hub_admin_assignments` maps Hub Admins to fulfillment hubs
- **Invitation-Only Access:** No public signups; users must be invited by administrators

---

## 5. Feature Specifications

### 5.1 Authentication & Authorization

#### 5.1.1 Sign-In
- Email/password authentication via Supabase Auth
- Invitation-only model (no self-registration)
- Auto-confirm email signups enabled for invited users
- Session persistence with secure token management

#### 5.1.2 User Management (Admin)
- View all users with email and role information
- Assign/remove roles (admin, field_staff, opx, hub_admin)
- Bulk OPX onboarding via CSV upload

---

### 5.2 Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│ BACKROADS OPS DASHBOARD                    [🔔] [Sign Out]  │
├─────────────────────────────────────────────────────────────┤
│ Unit Schedule │ Van Module │ Unit Loads │ Warehouses │      │
│ Equipment Request ▼ │ [OPX Review]* │ [Hub Fulfillment]* │  │
│   ├─ Equipment Catalog ►                                    │
│   │    ├─ USA & Lappa                                       │
│   │    ├─ Canada                                            │
│   │    └─ Europe                                            │
│   └─ Request History/Status                                 │
│                                                             │
│ [Admin ▼]*                                                  │
│   ├─ All Requests                                           │
│   ├─ Manage Equipment                                       │
│   ├─ Manage Users                                           │
│   ├─ Manage Assignments                                     │
│   └─ Bulk OPX Onboarding                                    │
└─────────────────────────────────────────────────────────────┘
* Visible only to users with appropriate roles
```

---

### 5.3 Unit Schedule

**Route:** `/` (Home page)

**Purpose:** Display unit schedules and logistics data with region-based filtering

**Features:**
- Region dropdown selector (US, CAN, LAPPA, EUROPE)
- CSV file drag-and-drop upload capability
- Data visualization table for schedule data
- Long-term: Integration with SharePoint for automated data sync

**UI Components:**
- Region filter dropdown
- CSV upload dropzone
- Data table with sortable columns

---

### 5.4 Van Module

**Route:** `/van-module`

**Purpose:** Display live van availability and usage by Operations Area

**Features:**
- **Filters:**
  - OPS Area selector (single-select)
  - Statistic selector (HUB Total, In Region, On Trip metrics)
  - Date/Period selector with granularity toggle (Year/Month/Week/Day)
- **Current Status Snapshot:** Key value widgets
- **Time-Series Chart:** Line chart grouped by selected granularity
- **Export CSV:** Download filtered data

---

### 5.5 Unit Loads

**Route:** `/unit-loads`

**Purpose:** Display unit load assignment and logistics data with hub-based filtering

**Features:**
- **Hub Tabs:** Pernes, Czechia, Tuscany (switchable)
- **OPS Area Filter:** Dropdown within selected hub
- **Data Table Columns:**
  - Unit Type
  - Unit
  - Trailer Number
  - Load Team Member & Bikeshop Mechanic
  - Van Number
  - Qty Bikes
  - Wahoo Box Number / IT Equipment Distribution
  - Notes

**Table Features:**
- Sticky headers
- Horizontal scrolling
- Sortable columns
- Empty/loading/error states

---

### 5.6 Warehouses

**Route:** `/warehouses`

**Purpose:** Display warehouse capacity and space needs by Operations Area

**Features:**
- **Ops Area Filter:** Single-select dropdown
- **Text Search:** Optional filtering
- **Snapshot KPI Cards:**
  - Total Units
  - Maximum Number of Vans
  - Total # of Trailers
  - Total # of Bikes
  - Total Storage Space (m²)
- **Data Table (14+ columns):**
  - HUB, Size, Ops Area, SHIP
  - Bikes, No Bikes, Total Units
  - Maximum Number of Vans, # of Trailers, # of Bikes
  - Parking (m²), # Bike Storage (m²)
  - Total Storage Space (m²)
  - Ops Area's Space Contribution to HUB (m²)
  - Wahoo Units

---

### 5.7 Equipment Request Workflow

#### 5.7.1 Equipment Catalog

**Route:** `/equipment`

**Purpose:** Browse and add equipment to cart

**Features:**
- Region-first selection (mandatory before browsing)
- Equipment grid with images, names, SKUs
- Search by name/SKU
- Category filter (5 categories)
- Pagination
- Add to cart functionality

**Equipment Categories:**
1. Bike Equipment
2. Trailer Parts
3. Trip Equipment
4. IT Equipment
5. Other

#### 5.7.2 Shopping Cart

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
  - "Need more standard inventory equipment"
  - "We ran out of this item"
  - "Item is lost"
  - "Item was not delivered to the OPS Area"
  - "Item is broken/non re-usable"
- **Notes:** Optional text field
- **Required By Date:** Date picker
- Submit request button

**Cart Persistence:** Local storage (clears on submit)

#### 5.7.3 Request History

**Route:** `/my-requests`

**Purpose:** View submitted request history and status

**Features:**
- List of user's requests (newest first)
- Request status badges (pending, approved, rejected, fulfilled, declined)
- Expandable request details
- Line item view with individual statuses

---

### 5.8 OPX Review Dashboard

**Route:** `/opx/dashboard`

**Access:** OPX role or Admin

**Purpose:** Review and process equipment requests for assigned OPS Areas

**Features:**
- Pending requests queue (filtered to OPX's assigned areas)
- Request details view
- **Actions:**
  - Approve (forwards to Hub)
  - Reject (with reason)
  - Modify quantities (original preserved)
  - Add OPX notes
- Notifications sent to requester on action

**Reminder System:**
- Global timeframe configured by Admin
- In-app + email reminders for overdue reviews

---

### 5.9 Hub Fulfillment Dashboard

**Route:** `/hub/dashboard`

**Access:** Hub Admin role or Admin

**Purpose:** Execute fulfillment for approved requests

**Features:**
- Approved requests queue (filtered to Hub Admin's assigned hub)
- Request details with approved quantities
- **Actions:**
  - Fulfill (marks complete)
  - Decline (with reason, e.g., out of stock)
- Notifications sent to requester on action

---

### 5.10 Admin Features

#### 5.10.1 All Requests

**Route:** `/admin/requests`

**Purpose:** View all equipment requests system-wide

**Features:**
- Full request list with filtering
- Status filters
- Date range filters
- Click through to request detail

#### 5.10.2 Request Detail

**Route:** `/admin/request/:id`

**Purpose:** Detailed view of any request

#### 5.10.3 Manage Equipment

**Route:** `/admin/equipment`

**Purpose:** CRUD operations for equipment catalog

**Features:**
- Add new equipment item
- Edit existing items
- Delete items
- **Image upload:** Drag-and-drop to Supabase storage
- Region availability toggles (USA & Lappa, Canada, Europe)

#### 5.10.4 Manage Users

**Route:** `/admin/users`

**Purpose:** Manage user roles

**Features:**
- View all users with email, name, roles
- Assign roles (admin, field_staff, opx, hub_admin)
- Remove roles

#### 5.10.5 Manage Assignments

**Route:** `/admin/assignments`

**Purpose:** Assign OPX to OPS Areas and Hub Admins to Hubs

**Features:**
- OPX Area Assignments table
- Hub Admin Assignments table
- Add/remove assignments
- Configure OPX reminder timeframe (global setting)

#### 5.10.6 Bulk OPX Onboarding

**Route:** `/admin/bulk-opx`

**Purpose:** Mass invite and assign OPX users via CSV

**Features:**
- CSV upload (format: email,ops_area_1,ops_area_2,...)
- Automatic invitation email
- Auto-assign OPX role
- Auto-create OPS Area assignments
- Progress/status feedback

---

### 5.11 Notification System

**Purpose:** Keep users informed of request status changes

**Components:**
- Notification bell in header
- Unread count badge
- Dropdown with recent notifications
- Click to navigate to relevant page
- Mark as read functionality

**Notification Triggers:**

| Event | Recipient | Type |
|-------|-----------|------|
| Request submitted | Assigned OPX | info |
| OPX approves | Requester | success |
| OPX rejects | Requester | warning |
| Hub fulfills | Requester | success |
| Hub declines | Requester | warning |
| Review overdue | OPX | reminder |

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | shadcn/ui, Radix UI |
| **Styling** | Tailwind CSS |
| **State Management** | TanStack Query (React Query) |
| **Routing** | React Router DOM v6 |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Edge Functions** | Deno (Supabase Edge Functions) |

### 6.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Application                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Pages   │  │Components│  │  Hooks   │  │ Contexts │ │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │   │
│  │       └──────────────┴──────────────┴──────────────┘      │   │
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

### 6.3 Key Frontend Patterns

- **Context Providers:** AuthProvider, RegionProvider
- **Query Patterns:** TanStack Query for data fetching with caching
- **Component Structure:** Page → Feature Components → UI Components
- **Form Handling:** React Hook Form with Zod validation

---

## 7. Data Model

### 7.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│   auth.users    │       │      profiles       │
│─────────────────│       │─────────────────────│
│ id (uuid) PK    │◄──────│ id (uuid) PK/FK     │
│ email           │       │ email               │
│ ...             │       │ full_name           │
└────────┬────────┘       │ created_at          │
         │                │ updated_at          │
         │                └─────────────────────┘
         │
         │    ┌─────────────────────┐
         │    │    user_roles       │
         ├────│─────────────────────│
         │    │ id (uuid) PK        │
         │    │ user_id (uuid) FK   │
         │    │ role (app_role)     │
         │    └─────────────────────┘
         │
         │    ┌─────────────────────────┐
         │    │  opx_area_assignments   │
         ├────│─────────────────────────│
         │    │ id (uuid) PK            │
         │    │ user_id (uuid) FK       │
         │    │ ops_area (text)         │
         │    │ assigned_by (uuid)      │
         │    └─────────────────────────┘
         │
         │    ┌─────────────────────────┐
         │    │  hub_admin_assignments  │
         ├────│─────────────────────────│
         │    │ id (uuid) PK            │
         │    │ user_id (uuid) FK       │
         │    │ hub (text)              │
         │    │ assigned_by (uuid)      │
         │    └─────────────────────────┘
         │
         │    ┌─────────────────────────┐
         └────│   equipment_requests    │
              │─────────────────────────│
              │ id (uuid) PK            │
              │ user_id (uuid) FK       │◄───────────┐
              │ status (text)           │            │
              │ opx_status (text)       │            │
              │ delivery_region (text)  │            │
              │ ops_area (text)         │────┐       │
              │ hub (text)              │    │       │
              │ required_by_date (text) │    │       │
              │ notes (text)            │    │       │
              │ opx_notes (text)        │    │       │
              │ opx_reviewed_by (uuid)  │    │       │
              │ opx_reviewed_at (ts)    │    │       │
              │ created_at (ts)         │    │       │
              └───────────┬─────────────┘    │       │
                          │                  │       │
                          │                  │       │
    ┌─────────────────────▼───────────┐     │       │
    │ equipment_request_line_items    │     │       │
    │─────────────────────────────────│     │       │
    │ id (uuid) PK                    │     │       │
    │ request_id (uuid) FK            │     │       │
    │ equipment_id (uuid) FK ─────────│─┐   │       │
    │ quantity (int)                  │ │   │       │
    │ original_quantity (int)         │ │   │       │
    │ reason (text)                   │ │   │       │
    │ approval_status (text)          │ │   │       │
    │ decline_reason (text)           │ │   │       │
    │ approved_by (uuid)              │ │   │       │
    │ approved_at (ts)                │ │   │       │
    │ modified_by_opx (uuid)          │ │   │       │
    └─────────────────────────────────┘ │   │       │
                                        │   │       │
    ┌───────────────────────────────────▼─┐ │       │
    │         equipment_items             │ │       │
    │─────────────────────────────────────│ │       │
    │ id (uuid) PK                        │ │       │
    │ name (text)                         │ │       │
    │ sku (text)                          │ │       │
    │ category (text)                     │ │       │
    │ image_url (text)                    │ │       │
    │ availability (boolean)              │ │       │
    │ regions (text[])                    │ │       │
    │ created_at (ts)                     │ │       │
    └─────────────────────────────────────┘ │       │
                                            │       │
    ┌───────────────────────────────────────▼─┐     │
    │           ops_area_to_hub               │     │
    │─────────────────────────────────────────│     │
    │ id (uuid) PK                            │     │
    │ ops_area (text)                         │     │
    │ hub (text)                              │     │
    │ region (text)                           │     │
    └─────────────────────────────────────────┘     │
                                                    │
    ┌───────────────────────────────────────────────┘
    │
    │    ┌─────────────────────┐
    │    │    notifications    │
    └────│─────────────────────│
         │ id (uuid) PK        │
         │ user_id (uuid) FK   │
         │ title (text)        │
         │ message (text)      │
         │ type (text)         │
         │ link (text)         │
         │ read (boolean)      │
         │ created_at (ts)     │
         └─────────────────────┘
```

### 7.2 Table Descriptions

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata (email, name) synced on signup |
| `user_roles` | Role assignments (admin, field_staff, opx, hub_admin) |
| `opx_area_assignments` | OPX ↔ OPS Area mappings |
| `hub_admin_assignments` | Hub Admin ↔ Hub mappings |
| `equipment_requests` | Main request records |
| `equipment_request_line_items` | Items within requests |
| `equipment_items` | Equipment catalog |
| `ops_area_to_hub` | Geographic routing rules |
| `notifications` | In-app notification storage |
| `unit_loads` | Unit logistics data |
| `app_settings` | System configuration |
| `inventory_sync_logs` | (Future) Integration audit trail |

---

## 8. Security Requirements

### 8.1 Authentication

- **Method:** Email/password via Supabase Auth
- **Access Model:** Invitation-only (no public registration)
- **Session:** JWT tokens with automatic refresh
- **Password Recovery:** Admin-initiated via backend

### 8.2 Authorization

- **Role-Based Access Control (RBAC):** Enforced via `user_roles` table
- **Row-Level Security (RLS):** All tables protected by RLS policies
- **Principle of Least Privilege:** Users see only data relevant to their role

### 8.3 RLS Policy Summary

| Table | Policy |
|-------|--------|
| `equipment_requests` | Users see own; OPX sees assigned areas; Hub Admin sees approved for hub; Admin sees all |
| `equipment_request_line_items` | Inherits from parent request |
| `equipment_items` | All authenticated can view; Admin can modify |
| `notifications` | Users see own only |
| `user_roles` | Users see own; Admin sees all and manages |
| `ops_area_to_hub` | Authenticated can view; Admin manages |
| `opx_area_assignments` | OPX sees own; Admin manages |
| `hub_admin_assignments` | Hub Admin sees own; Admin manages |

### 8.4 Security Function

```sql
-- Secure role checking function (SECURITY DEFINER)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
```

### 8.5 Data Protection

- **Sensitive Data:** OPS Area ↔ Hub mappings restricted to authenticated users
- **Competitive Intelligence:** Geographic footprint data not publicly exposed
- **Audit Trail:** All modifications logged with user IDs and timestamps

---

## 9. Integration Requirements

### 9.1 Current Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| **Supabase Storage** | ✅ Active | Equipment image uploads |
| **Supabase Auth** | ✅ Active | User authentication |
| **Resend** | ✅ Configured | Email notifications (secret stored) |

### 9.2 Planned Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| **SharePoint** | 🔄 Planned | Live data sync for Unit Schedule |
| **Oracle IMS** | 🔄 Planned | Inventory management sync |
| **Power Automate** | 🔄 Planned | Workflow automation |

### 9.3 Oracle IMS Integration (Future)

**Purpose:** Sync equipment fulfillment with inventory management

**Trigger:** Request status changes to `fulfilled`

**Payload per item:**
- Request ID
- Item ID/SKU
- Quantity
- OPS Area destination
- Hub source
- Category
- Timestamp
- User ID

**Audit Table:** `inventory_sync_logs`

**Blockers:**
- Oracle IMS API endpoint not yet provided
- Authentication credentials pending
- API documentation required

---

## 10. Design System

### 10.1 Visual Identity

| Element | Specification |
|---------|---------------|
| **Primary Color** | Dark navy (`#1a3a3a`) |
| **Accent Color** | Teal/cyan (`#06b6d4`) |
| **Background** | Light gray (`#f5f5f5`) |
| **Typography** | Inter font family (400, 500, 600, 700) |
| **Logo** | Backroads logo in header left |

### 10.2 Component Library

- **Base:** shadcn/ui components
- **Icons:** Lucide React
- **Charts:** Recharts

### 10.3 Design Principles

1. **Clean & Professional:** Text-only navigation, minimal icons
2. **Responsive:** Mobile-first, works on tablets and desktop
3. **Accessible:** WCAG-compliant contrast ratios
4. **Consistent:** Semantic tokens for all colors/spacing

### 10.4 Header Design

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] BACKROADS OPS DASHBOARD  [Nav Items...]  [🔔] [Sign Out] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Success Metrics

### 11.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Request Turnaround Time** | <48 hours (standard) | Time from submission to fulfillment |
| **OPX Review SLA** | <24 hours | Time from submission to OPX action |
| **System Uptime** | 99.5% | Monitoring dashboard |
| **User Adoption** | 200+ OPX onboarded | Active user count |
| **Request Completion Rate** | >90% | Fulfilled vs. submitted |

### 11.2 User Satisfaction

- Qualitative feedback from OPX and Hub Admin users
- Reduction in support requests related to equipment
- Decrease in email-based request coordination

---

## 12. Release Roadmap

### Phase 1: MVP (Current)

**Status:** In Development

**Features:**
- ✅ Authentication (invitation-only)
- ✅ Role-based access control
- ✅ Equipment catalog with region filtering
- ✅ Equipment request workflow (OPX/Hub focus)
- ✅ OPX Review Dashboard
- ✅ Hub Fulfillment Dashboard
- ✅ Notification system
- ✅ Admin management pages
- ✅ Bulk OPX onboarding
- ✅ Unit Schedule (CSV upload)
- ✅ Unit Loads page
- ✅ Warehouses page
- ✅ Van Module page

### Phase 2: Data Integration

**Status:** Planned

**Features:**
- 🔄 SharePoint integration for live data
- 🔄 Automated data sync
- 🔄 Enhanced reporting

### Phase 3: Inventory Integration

**Status:** Planned

**Features:**
- 🔄 Oracle IMS integration
- 🔄 Real-time inventory sync
- 🔄 Automated stock updates

### Phase 4: Field Staff Expansion

**Status:** Deferred

**Features:**
- 🔄 Field Staff equipment ordering
- 🔄 Mobile-optimized experience
- 🔄 Offline capability

---

## 13. Appendices

### Appendix A: OPS Area → Hub Mapping Examples

| Region | OPS Area | Fulfillment Hub |
|--------|----------|-----------------|
| Europe | Italy - Tuscany | Tuscany HUB |
| Europe | Italy - Puglia | Tuscany HUB |
| Europe | Czechia - Cesky Krumlov | Czechia HUB |
| Europe | Germany - Bavaria | Czechia HUB |
| Europe | France - Provence | Pernes HUB |
| Europe | Spain - Catalonia | Pernes HUB |
| USA & Lappa | All areas | Single designated hub |
| Canada | All areas | Single designated hub |

### Appendix B: Equipment Request Reasons

1. "Need more standard inventory equipment"
2. "We ran out of this item"
3. "Item is lost"
4. "Item was not delivered to the OPS Area"
5. "Item is broken/non re-usable"

### Appendix C: Request Status Flow

```
pending → pending_opx → approved → fulfilled
                    ↘ rejected
                          ↘ hub_declined
```

### Appendix D: Bulk OPX CSV Format

```csv
email,ops_area
john_doe@backroads.com,Czechia - Cesky Krumlov
jane_smith@backroads.com,Italy - Tuscany
multi_area@backroads.com,"France - Provence,Spain - Catalonia"
```

### Appendix E: Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `equipment-images` | Equipment catalog images | Yes |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | System | Initial PRD based on implementation |

---

*This document was auto-generated based on the current Backroads Ops Dashboard implementation.*
