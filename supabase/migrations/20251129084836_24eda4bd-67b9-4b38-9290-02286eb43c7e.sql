-- Create role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Security definer function to check roles
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

-- Create equipment_items table
create table public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category text not null,
  image_url text,
  availability boolean not null default true,
  created_at timestamp with time zone not null default now()
);

alter table public.equipment_items enable row level security;

-- Everyone can view equipment
create policy "Anyone can view equipment"
on public.equipment_items
for select
to authenticated
using (true);

-- Only admins can manage equipment
create policy "Admins can insert equipment"
on public.equipment_items
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update equipment"
on public.equipment_items
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete equipment"
on public.equipment_items
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Create equipment_requests table
create table public.equipment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'fulfilled')),
  delivery_region text not null,
  required_by_date date not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

alter table public.equipment_requests enable row level security;

-- Users can view their own requests
create policy "Users can view their own requests"
on public.equipment_requests
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can view all requests
create policy "Admins can view all requests"
on public.equipment_requests
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Users can create their own requests
create policy "Users can create requests"
on public.equipment_requests
for insert
to authenticated
with check (auth.uid() = user_id);

-- Admins can update requests
create policy "Admins can update requests"
on public.equipment_requests
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Create equipment_request_line_items table
create table public.equipment_request_line_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.equipment_requests(id) on delete cascade not null,
  equipment_id uuid references public.equipment_items(id) on delete cascade not null,
  quantity integer not null check (quantity > 0)
);

alter table public.equipment_request_line_items enable row level security;

-- Users can view line items for their requests
create policy "Users can view their request line items"
on public.equipment_request_line_items
for select
to authenticated
using (
  exists (
    select 1 from public.equipment_requests
    where id = request_id and user_id = auth.uid()
  )
);

-- Admins can view all line items
create policy "Admins can view all line items"
on public.equipment_request_line_items
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Users can create line items for their requests
create policy "Users can create line items"
on public.equipment_request_line_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.equipment_requests
    where id = request_id and user_id = auth.uid()
  )
);