-- Safe Migration Script
-- 1. Create table if it doesn't exist (for fresh installs)
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  part_number text not null,
  brand text,
  price numeric not null,
  -- image_url removed
  category text,
  description text,
  stock integer default 0,
  compatibility jsonb,
  specifications jsonb,
  images text[] -- Array of image URLs
);

-- 2. Alter table to add new columns if they are missing (for existing installs)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'compatible_engines') then
    alter table products add column compatible_engines text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'compatible_oem') then
    alter table products add column compatible_oem text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'brand') then
    alter table products add column brand text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'specifications') then
    alter table products add column specifications jsonb;
  end if;

  -- Ensure images column exists
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'images') then
    alter table products add column images text[];
  end if;
  
  -- DATA MIGRATION: If image_url exists, move it to images array if images is empty
  if exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_url') then
    update products 
    set images = array_append(coalesce(images, '{}'), image_url) 
    where image_url is not null 
      and image_url != '' 
      and (images is null or cardinality(images) = 0);
  end if;

  -- DROP COLUMN image_url
  if exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_url') then
    alter table products drop column image_url;
  end if;

end $$;

-- 3. Update Row Level Security (RLS)
alter table products enable row level security;

-- Drop existing policies to prevent conflicts/duplication during updates
drop policy if exists "Public products are viewable by everyone" on products;
drop policy if exists "Authenticated users can insert products" on products;
drop policy if exists "Authenticated users can update products" on products;
drop policy if exists "Authenticated users can delete products" on products;

-- Re-create policies
create policy "Public products are viewable by everyone"
  on products for select
  using ( true );

create policy "Authenticated users can insert products"
  on products for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update products"
  on products for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete products"
  on products for delete
  using ( auth.role() = 'authenticated' );

-- 4. Create other tables if missing
create table if not exists profiles (
  id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone,
  full_name text,
  phone text,
  primary key (id)
);

alter table profiles enable row level security;
drop policy if exists "Users can see their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

create policy "Users can see their own profile" on profiles for select using ( auth.uid() = id );
create policy "Users can update their own profile" on profiles for update using ( auth.uid() = id );

create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users,
  total_amount numeric not null,
  status text default 'pending',
  shipping_address jsonb,
  payment_info jsonb
);

alter table orders enable row level security;
drop policy if exists "Users can view their own orders" on orders;
create policy "Users can view their own orders" on orders for select using ( auth.uid() = user_id );