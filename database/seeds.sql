-- Sample data for local development.
--
-- `profiles` rows are created automatically by the `handle_new_user` trigger
-- when a user signs up through Supabase Auth, so you can't seed them directly.
-- 1. Create a couple of test users (Supabase Studio > Authentication > Add user,
--    or `supabase.auth.sign_up` from the mobile app).
-- 2. Copy their ids from the `profiles` table and substitute them below.
-- 3. Run this file in the Supabase SQL editor.
--
-- Example profile IDs (replace with real profile ids):
-- \set user_alice '00000000-0000-0000-0000-000000000001'
-- \set user_bob '00000000-0000-0000-0000-000000000002'
-- \set user_carol '00000000-0000-0000-0000-000000000003'
-- \set user_dave '00000000-0000-0000-0000-000000000004'
-- \set user_eve '00000000-0000-0000-0000-000000000005'


-- MATCHING PAIRS: These lost/found items should match each other

-- Pair 1: MacBook Pro lost in library / found at student union
insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_alice', 'lost', 'MacBook Pro 16"', 'Space Gray MacBook Pro 16-inch with M3 chip. Has a small scratch on the bottom left corner. Sticker of a cat on the lid.', 'electronics', 'Space Gray', 'Apple', 'Dr. Martin Luther King Jr. Library, 4th floor study area', 37.3354, -121.8848, '2025-01-15 14:30:00-08', 'open'),
    (:'user_bob', 'found', 'MacBook Pro laptop', 'Found a Space Gray MacBook Pro 16-inch near the coffee station. Has a cat sticker on the lid and a scratch on bottom.', 'electronics', 'Space Gray', 'Apple', 'Student Union Building, near Starbucks', 37.3364, -121.8808, '2025-01-15 16:45:00-08', 'open');

-- Pair 2: Black North Face backpack lost / found
insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_carol', 'lost', 'North Face Borealis Backpack', 'Black North Face Borealis backpack with laptop sleeve. Contains a blue notebook and mechanical pencil. Water bottle pocket on side.', 'bags', 'Black', 'The North Face', 'Engineering Building, Room 204', 37.3361, -121.8822, '2025-01-20 10:00:00-08', 'open'),
    (:'user_dave', 'found', 'Black backpack with laptop sleeve', 'Found black backpack with The North Face logo. Has laptop compartment, blue notebook inside, mechanical pencil. Left on bench outside.', 'bags', 'Black', 'The North Face', 'Engineering Building, courtyard bench', 37.3360, -121.8820, '2025-01-20 12:15:00-08', 'open');

-- Pair 3: Car keys with Toyota key fob lost / found
insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_eve', 'lost', 'Toyota Car Keys with Key Fob', 'Silver Toyota key fob with 3 buttons (lock, unlock, panic) on a black lanyard with university logo. House key and mailbox key also on ring.', 'keys', 'Silver', 'Toyota', 'West Parking Garage, Level 3', 37.3345, -121.8830, '2025-01-22 08:00:00-08', 'open'),
    (:'user_alice', 'found', 'Toyota key fob on black lanyard', 'Found Toyota key fob (silver, 3 buttons) on black lanyard with SJSU logo. Has house key and mailbox key attached.', 'keys', 'Silver', 'Toyota', 'West Parking Garage, Level 3', 37.3346, -121.8831, '2025-01-22 09:30:00-08', 'open');

-- Pair 4: Red Hydro Flask water bottle lost / found
insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_bob', 'lost', 'Hydro Flask Wide Mouth 32oz', 'Red Hydro Flask 32oz wide mouth with straw lid. Has a dent on the bottom and a "Save the Turtles" sticker.', 'accessories', 'Red', 'Hydro Flask', 'Student Wellness Center, gym floor', 37.3355, -121.8800, '2025-01-25 18:00:00-08', 'open'),
    (:'user_carol', 'found', 'Red Hydro Flask water bottle', 'Found red Hydro Flask 32oz with straw lid. Dent on bottom, "Save the Turtles" sticker. Left on bench near weights.', 'accessories', 'Red', 'Hydro Flask', 'Student Wellness Center, near free weights', 37.3356, -121.8801, '2025-01-25 19:30:00-08', 'open');

-- Pair 5: Gray Sony WH-1000XM5 headphones lost / found
insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_dave', 'lost', 'Sony WH-1000XM5 Headphones', 'Sony WH-1000XM5 wireless noise-canceling headphones in silver/platinum. Carrying case included. Left in study room.', 'electronics', 'Platinum Silver', 'Sony', 'King Library, Group Study Room 3B', 37.3353, -121.8810, '2025-01-28 15:00:00-08', 'open'),
    (:'user_eve', 'found', 'Sony noise-canceling headphones', 'Found Sony WH-1000XM5 headphones in silver color with carrying case. On table in study room.', 'electronics', 'Platinum Silver', 'Sony', 'King Library, Group Study Room 3B', 37.3353, -121.8810, '2025-01-28 16:20:00-08', 'open');


-- ADDITIONAL LOST ITEMS (no matching found yet)

insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_alice', 'lost', 'iPhone 15 Pro', 'Natural titanium iPhone 15 Pro with clear case. MagSafe wallet attached with student ID inside.', 'electronics', 'Natural Titanium', 'Apple', 'Dining Commons, Table 12', 37.3349, -121.8808, '2025-02-01 12:30:00-08', 'open'),
    (:'user_bob', 'lost', 'Nike Air Max Sneakers', 'White Nike Air Max 270 with black swoosh. Size 10.5. Left in locker room after basketball.', 'clothing', 'White/Black', 'Nike', 'Event Center, Mens Locker Room', 37.3365, -121.8795, '2025-02-03 20:00:00-08', 'open'),
    (:'user_carol', 'lost', 'Prescription Glasses', 'Black rectangular frame prescription glasses in brown leather case. Ray-Ban brand.', 'accessories', 'Black', 'Ray-Ban', 'Science Building, Lecture Hall 101', 37.3358, -121.8815, '2025-02-05 11:00:00-08', 'open'),
    (:'user_dave', 'lost', 'Canvas Tote Bag', 'Natural canvas tote bag with "SJSU Library" print. Contains library books and a reusable metal straw.', 'bags', 'Natural', 'SJSU Library', 'Student Union, Food Court', 37.3347, -121.8806, '2025-02-07 13:45:00-08', 'open'),
    (:'user_eve', 'lost', 'Apple Watch Series 9', 'Midnight aluminum Apple Watch Series 9 45mm with black sport band. Has a small crack on screen protector.', 'electronics', 'Midnight', 'Apple', 'Spartan Recreation Center, Pool Area', 37.3362, -121.8790, '2025-02-10 07:30:00-08', 'open');


-- ADDITIONAL FOUND ITEMS (no matching lost yet)

insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_alice', 'found', 'Samsung Galaxy Buds Pro', 'Found Samsung Galaxy Buds Pro in purple charging case. Left on library desk.', 'electronics', 'Purple', 'Samsung', 'King Library, 2nd Floor Desk 14', 37.3352, -121.8812, '2025-02-01 14:00:00-08', 'open'),
    (:'user_bob', 'found', 'Gray Hoodie', 'Gray Champion hoodie, size Medium. Found on chair in student union.', 'clothing', 'Gray', 'Champion', 'Student Union, 2nd Floor Lounge', 37.3348, -121.8804, '2025-02-04 15:00:00-08', 'open'),
    (:'user_carol', 'found', 'Set of House Keys', 'Three keys on a simple metal ring. No key fob. Found on sidewalk.', 'keys', 'Silver', 'Unknown', '7th Street & San Salvador St intersection', 37.3340, -121.8825, '2025-02-06 09:00:00-08', 'open'),
    (:'user_dave', 'found', 'Blue Yeti Microphone', 'Blue Yeti USB microphone in silver. With desktop stand. Found in podcast room.', 'electronics', 'Silver', 'Blue', 'Media Center, Podcast Room 2', 37.3350, -121.8818, '2025-02-08 16:30:00-08', 'open'),
    (:'user_eve', 'found', 'Leather Wallet', 'Brown leather bifold wallet. Contains cash and receipts (no ID visible). Found on bench.', 'accessories', 'Brown', 'Unknown', 'Campus Village, Building C Lobby', 37.3370, -121.8785, '2025-02-11 10:00:00-08', 'open');


-- RESOLVED ITEMS (for testing status filtering)

insert into items (user_id, type, title, description, category, color, brand, location, latitude, longitude, event_date, status)
values
    (:'user_alice', 'lost', 'Old Calculator', 'Basic scientific calculator, gray. Resolved - found in backpack.', 'electronics', 'Gray', 'Texas Instruments', 'Math Building, Room 101', 37.3360, -121.8820, '2024-12-01 10:00:00-08', 'resolved'),
    (:'user_bob', 'found', 'Umbrella', 'Black compact umbrella. Returned to owner.', 'accessories', 'Black', 'Totes', 'Administration Building Entrance', 37.3345, -121.8810, '2024-12-05 14:00:00-08', 'resolved');


-- Note: `embedding` is left null here since seed rows are inserted directly,
-- bypassing the API. Items created through POST /items always get an embedding
-- generated automatically, which is what the matching endpoint relies on.
-- To generate embeddings for seed data, either:
--   1. Create items through the API (recommended)
--   2. Run a script that calls the embedding function and updates rows