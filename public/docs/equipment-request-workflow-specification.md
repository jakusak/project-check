# Backroads Ops - Equipment Request Workflow Specification

## Document Purpose
This document describes the equipment request workflow system architecture for the Backroads Ops Dashboard application.

---

## 1. User Roles Overview

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Field Staff** | Front-line employees who need equipment | Submit requests, view own request history |
| **OPX (Operations Expert)** | Regional operations managers | Review, approve/reject requests for assigned OPS Areas |
| **Hub Admin** | Fulfillment team at warehouse locations | Execute fulfillment for approved requests at their hub |
| **Admin** | System administrators | Manage users, assignments, equipment catalog, view all requests |

---

## 2. Workflow Steps

### Step 1: Field Staff Submits Request

**Who:** Field Staff  
**Where:** Equipment Catalog → Cart → Submit

**Process:**
1. Field Staff selects their **Region** (USA & Lappa, Canada, or Europe)
2. Browses the Equipment Catalog (filtered by region availability)
3. Adds items to cart with:
   - Quantity needed
   - **Reason for request** (required per item):
     - "Need more standard inventory equipment"
     - "We ran out of this item"
     - "Item is lost"
     - "Item was not delivered to the OPS Area"
     - "Item is broken/non re-usable"
4. In Cart, selects:
   - **Submitted by:** "Submitted by Field Staff" or "Submitted by OPX"
   - **OPS Area:** Delivery destination
   - **Urgency:** "Urgent" or "Needed soon"
   - Optional notes
5. Submits request

**System Action:**
- Request created with status = `pending`
- OPX status = `pending_review`
- Hub is auto-assigned based on OPS Area → Hub mapping
- Notification sent to assigned OPX user(s)

---

### Step 2: OPX Reviews Request

**Who:** OPX (Operations Expert)  
**Where:** OPX Dashboard

**Process:**
1. OPX sees pending requests for their assigned OPS Area(s)
2. Reviews request details:
   - Items requested
   - Quantities
   - Reasons
   - Urgency level
3. Can **modify quantities** if needed (original quantity preserved)
4. Takes action:
   - **Approve:** Forwards to Hub for fulfillment
   - **Reject:** Declines with reason

**System Action on Approve:**
- OPX status = `approved`
- Request status = `approved`
- Notification sent to Field Staff: "Request Approved by OPX"
- Request appears in Hub Admin dashboard

**System Action on Reject:**
- OPX status = `rejected`
- Request status = `rejected`
- Notification sent to Field Staff: "Request Rejected by OPX"

**Reminder System:**
- If OPX doesn't review within configured timeframe (e.g., 24 hours)
- System sends in-app + email reminders
- Timeframe is globally configured by Admin

---

### Step 3: Hub Admin Fulfills Request

**Who:** Hub Admin  
**Where:** Hub Dashboard

**Process:**
1. Hub Admin sees OPX-approved requests for their assigned hub
2. Reviews fulfillment details:
   - Items and quantities (as approved by OPX)
   - Destination OPS Area
   - Urgency level
3. Takes action:
   - **Fulfill:** Marks as fulfilled, prepares shipment
   - **Decline:** Rejects with reason (e.g., out of stock)

**System Action on Fulfill:**
- Request status = `fulfilled`
- Notification sent to Field Staff: "Request Fulfilled"
- (Future: NetSuite inventory sync triggered)

**System Action on Decline:**
- Request status = `hub_declined`
- Notification sent to Field Staff: "Request Declined by Hub"

---

### Step 4: Field Staff Receives Notification

**Who:** Field Staff  
**Where:** Notification Bell → My Requests page

**Process:**
1. Field Staff receives notification of final status
2. Can view full request history in "My Requests" page
3. Request lifecycle complete

---

## 3. Database Tables

### Core Tables

| Table | Purpose |
|-------|---------|
| `equipment_requests` | Main request records with status, dates, user, OPS area, hub |
| `equipment_request_line_items` | Individual items in each request with quantities, reasons, approval status |
| `equipment_items` | Equipment catalog with SKU, category, availability, regions |

### Assignment Tables

| Table | Purpose |
|-------|---------|
| `opx_area_assignments` | Maps OPX users to their assigned OPS Areas |
| `hub_admin_assignments` | Maps Hub Admin users to their assigned Hubs |
| `ops_area_to_hub` | Maps OPS Areas to fulfillment Hubs (auto-routing) |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `user_roles` | User role assignments (admin, user, field_staff, opx, hub_admin) |
| `notifications` | In-app notifications for status updates |
| `inventory_sync_logs` | (Future) NetSuite integration sync records |

---

## 4. Request Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST STATUS FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Field Staff]          [OPX]              [Hub Admin]         │
│        │                   │                     │              │
│        ▼                   │                     │              │
│   ┌─────────┐              │                     │              │
│   │ pending │──────────────►                     │              │
│   └─────────┘              │                     │              │
│                            ▼                     │              │
│                   ┌────────────────┐             │              │
│                   │ pending_review │             │              │
│                   └────────────────┘             │              │
│                            │                     │              │
│              ┌─────────────┼─────────────┐       │              │
│              ▼             │             ▼       │              │
│        ┌──────────┐        │      ┌──────────┐   │              │
│        │ approved │────────┼──────│ rejected │   │              │
│        └──────────┘        │      └──────────┘   │              │
│              │             │                     │              │
│              └─────────────┼─────────────────────►              │
│                            │                     │              │
│                            │       ┌─────────────┼─────────────┐│
│                            │       ▼             │             ▼│
│                            │ ┌───────────┐  ┌─────────────┐     │
│                            │ │ fulfilled │  │ hub_declined│     │
│                            │ └───────────┘  └─────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Row-Level Security (RLS) Policies

### Equipment Requests Table
- **Field Staff:** Can only view/edit their own requests
- **OPX:** Can view requests for their assigned OPS Areas
- **Hub Admin:** Can view approved requests for their assigned Hub
- **Admin:** Can view all requests

### Equipment Items Table
- **All authenticated users:** Can view available equipment
- **Admin only:** Can create/update/delete equipment

### Notifications Table
- **Users:** Can only view their own notifications
- **System:** Uses secure `create_notification` RPC function

---

## 6. Geographic Routing Logic

### Region → Hub Mapping

| Region | Fulfillment Hub(s) |
|--------|-------------------|
| USA & Lappa | Single designated hub (auto-assigned) |
| Canada | Single designated hub (auto-assigned) |
| Europe | Three hubs: Tuscany, Czech, Pernes (determined by OPS Area) |

### Europe OPS Area → Hub Examples

| OPS Area | Assigned Hub |
|----------|--------------|
| Italy regions | Tuscany HUB |
| Czech, Germany, Poland, etc. | Czech HUB |
| France, Spain, Portugal, etc. | Pernes HUB |

---

## 7. Notification Triggers

| Event | Recipient | Notification Type |
|-------|-----------|-------------------|
| Request submitted | Assigned OPX | New request to review |
| OPX approves | Field Staff | Request approved |
| OPX rejects | Field Staff | Request rejected |
| Hub fulfills | Field Staff | Request fulfilled |
| Hub declines | Field Staff | Request declined |
| Review overdue | OPX | Reminder to review |

---

## 8. Equipment Categories

All equipment items are classified into exactly 5 categories:

1. **Bike Equipment**
2. **Trailer Parts**
3. **Trip Equipment**
4. **IT Equipment**
5. **Other**

---

## 9. Admin Capabilities

Administrators can:
- **Manage Users:** Assign roles to users
- **Manage Assignments:** Assign OPX to OPS Areas, Hub Admins to Hubs
- **Manage Equipment:** Add/edit/delete equipment catalog items
- **View All Requests:** See complete request history across all users
- **Configure Settings:** Set OPX reminder timeframes

---

## Document Version
- **Created:** December 2024
- **System:** Backroads Ops Dashboard
- **Platform:** Lovable Cloud (Supabase backend)
