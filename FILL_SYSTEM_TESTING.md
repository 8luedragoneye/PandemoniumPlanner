# Fill System Testing Guide

This guide walks you through testing all features of the Fill Provider system.

## Prerequisites

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Ensure database is migrated:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## Test Scenario Setup

### Step 1: Create Test Users (if needed)

You'll need at least:
- **1 Organizer** (activity creator)
- **2-3 Regular Users** (to sign up as Fighters/Transporters)
- **2-3 Fill Providers** (users who will provide fill)

### Step 2: Create a Transport Activity

1. Log in as the **Organizer**
2. Navigate to the home page
3. Click **"+ Create Activity"**
4. Fill in the form:
   - **Name:** "Test Transport Run"
   - **Date:** Future date
   - **Description:** "Testing fill system"
   - **Type:** Select **"Transport"**
   - Fill other required fields
5. Click **"Create Activity"**

### Step 3: Create Transport Roles

1. On the activity detail page, scroll to **"Roles"** section
2. Click **"+ Add Role"**
3. Create **"Fighter"** role:
   - Name: `Fighter`
   - Slots: `1`
   - Check **"Fighter"** checkbox
   - Enter Role (e.g., "DPS")
   - Click **"Create Role"**
4. Create **"Transporter"** role:
   - Name: `Transporter`
   - Slots: `9999`
   - Check **"Transporter"** checkbox
   - Click **"Create Role"**

### Step 4: Sign Up Participants

1. **Log out** and log in as **User 1** (Fighter)
2. Navigate to the transport activity
3. Click **"Join"** on the Fighter role
4. Fill in the signup form:
   - **Origin:** "Guild Island"
   - **Goal:** "Carleon"
   - **Slots:** `50`
   - **Gewicht:** `5`
   - **Preferred Partner:** (optional)
5. Click **"Sign Up"**

6. **Log out** and log in as **User 2** (Transporter)
7. Navigate to the transport activity
8. Click **"Join"** on the Transporter role
9. Fill in the signup form:
   - **Origin:** "Guild Island"
   - **Goal:** "Carleon"
   - **Slots:** `100`
   - **Gewicht:** `10`
10. Click **"Sign Up"**

11. Repeat for **User 3** (another Fighter or Transporter)

### Step 5: Create Transport Pairs

1. **Log in as Organizer**
2. Navigate to the transport activity
3. Scroll to **"Transport Pairs"** section
4. In **"Create Pair"**:
   - Select a **Fighter** from dropdown
   - Select a **Transporter** from dropdown
   - Click **"Create Pair"**
5. Repeat to create 2-3 pairs

---

## Testing Fill Provider Registration

### Test 1: Self-Service Registration

1. **Log in as User 1** (who has signed up for transport)
2. Navigate to the transport activity
3. Scroll to **"Become a Fill Provider"** section
4. Click **"Register"** button
5. Fill in the registration form:
   - ✅ Check **"Provide Slot Fill"**
   - **Slot Fill Origin:** "Guild Island, Tab Equipment"
   - **Slot Fill Target:** "Carleon, Central House"
   - ✅ Check **"Provide Weight Fill"**
   - **Weight Fill Origin:** "Guild Island, Tab Resources"
   - **Weight Fill Target:** "Carleon, Central House"
   - **Notes:** (optional)
6. Click **"Register as Fill Provider"**

**Expected Result:**
- Registration form disappears
- Success message (if implemented)
- User is now registered as fill provider

### Test 2: Registration Validation

1. Try registering again with the same user
   - **Expected:** Error "Already registered as fill provider"

2. **Log in as a user who has NOT signed up for any transport**
3. Try to register
   - **Expected:** Error "Must have participated in at least one transport activity"

3. Try registering without selecting any fill type
   - **Expected:** Error "Must provide at least one fill type"

4. Try registering with slots checked but missing origin/target
   - **Expected:** Error "Slot origin and target are required"

---

## Testing Fill Provider Management (Organizer View)

### Test 3: View Fill Providers

1. **Log in as Organizer**
2. Navigate to the transport activity
3. Scroll to **"Fill Providers"** section

**Expected Result:**
- List of all registered fill providers
- Each provider shows:
  - User name
  - Priority score (starts at 0)
  - Active/Inactive status
  - Fill types (Slots/Weight)
  - Origin → Target for each fill type
  - Notes

### Test 4: Add Points (Problem Penalty)

1. In **"Fill Providers"** section
2. Find a provider
3. Click **"Add Points"** button
4. Fill in the form:
   - **Points:** `-1`
   - **Reason:** "problem"
   - **Notes:** "Source location incorrect"
5. Click **"Add Points"**

**Expected Result:**
- Provider's priority decreases by 1
- Points entry is recorded
- Priority updates in the list

### Test 5: Deactivate/Activate Provider

1. Find a provider
2. Click **"Deactivate"** button

**Expected Result:**
- Provider shows "INACTIVE" badge
- Provider won't appear in auto-assignment

3. Click **"Activate"** button

**Expected Result:**
- "INACTIVE" badge disappears
- Provider is available for assignment again

---

## Testing Fill Assignment

### Test 6: Auto-Assign Fill

1. **Log in as Organizer**
2. Navigate to the transport activity
3. Ensure you have:
   - At least 2 transport pairs created
   - At least 2 active fill providers registered
4. Scroll to **"Fill Assignments"** section
5. Click **"Auto-Assign Fill"** button
6. Confirm the action

**Expected Result:**
- Each pair gets assigned:
  - 1 Slot Fill provider (if available)
  - 1 Weight Fill provider (if available)
- Providers are assigned based on priority (highest first)
- Each provider serves max 2 pairs
- Points are automatically added:
  - +1 for participation
  - -1 for assignment
- Priority updates in Fill Providers list

### Test 7: Manual Assignment

1. In **"Fill Assignments"** section
2. Find a pair without fill assignment
3. For **Slot Fill** dropdown:
   - Select a provider from the list
   - Providers show priority in parentheses
   - Providers with 2 assignments are disabled
4. For **Weight Fill** dropdown:
   - Select a provider

**Expected Result:**
- Assignment is created immediately
- Provider appears in the pair card
- Points are added automatically
- Provider count increments

### Test 8: Remove Assignment

1. Find a pair with fill assignment
2. Click **"Remove"** button next to the assignment
3. Confirm removal

**Expected Result:**
- Assignment is removed
- Pair shows empty dropdowns again
- (Note: Points are NOT removed - they persist)

### Test 9: Priority-Based Assignment

1. Register **3 fill providers** with different priorities:
   - Provider A: Priority 5
   - Provider B: Priority 3
   - Provider C: Priority 0
2. Create **3 transport pairs**
3. Click **"Auto-Assign Fill"**

**Expected Result:**
- Provider A (highest priority) gets assigned first
- Provider B gets assigned next
- Provider C gets assigned last
- If Provider A already has 2 assignments, Provider B gets the next one

---

## Testing Fill Display in Pairs

### Test 10: View Fill Assignments in Pair Manager

1. **Log in as Organizer**
2. Navigate to transport activity
3. Scroll to **"Transport Pairs"** section
4. Look at existing pairs

**Expected Result:**
- Each pair card shows:
  - Fighter name
  - Transporter name
  - "Unpair" button
- If fill is assigned, below the pair info:
  - **"Fill Assignments:"** section
  - **Slots:** Provider name
  - **Weight:** Provider name

---

## Testing Edge Cases

### Test 11: Not Enough Providers

1. Create **3 transport pairs**
2. Register only **1 fill provider**
3. Click **"Auto-Assign Fill"**

**Expected Result:**
- Provider gets assigned to max 2 pairs
- 1 pair remains unassigned
- No error (system handles gracefully)

### Test 12: All Providers Inactive

1. Deactivate all fill providers
2. Try to auto-assign

**Expected Result:**
- Error: "No active fill providers available"

### Test 13: Re-running Auto-Assign

1. Run auto-assign once
2. Run auto-assign again

**Expected Result:**
- Existing assignments are preserved
- Only unassigned pairs get new assignments
- No duplicate assignments created
- Provider counts are correctly tracked

### Test 14: Provider Max Assignments

1. Register **1 fill provider**
2. Create **3 transport pairs**
3. Auto-assign

**Expected Result:**
- Provider gets assigned to first 2 pairs
- 3rd pair remains unassigned
- Dropdown shows provider as disabled (max assignments)

---

## Testing Point System Persistence

### Test 15: Points Across Sessions

1. Assign a provider to a pair (gets +1, -1 = net 0)
2. Add -1 point for a problem
3. Provider now has priority -1
4. **Refresh the page**
5. Check Fill Providers list

**Expected Result:**
- Priority remains -1 (persisted)
- Points are not reset

### Test 16: Multiple Activity Points

1. Create **2 transport activities**
2. Assign same provider to pairs in both activities
3. Check provider priority

**Expected Result:**
- Priority = sum of all points from all activities
- Points are session-agnostic (persist across activities)

---

## Quick Test Checklist

- [ ] Create transport activity
- [ ] Create Fighter and Transporter roles
- [ ] Sign up 2+ users as Fighters/Transporters
- [ ] Create transport pairs
- [ ] Register as fill provider (self-service)
- [ ] View fill providers list (organizer)
- [ ] Add points to provider (organizer)
- [ ] Deactivate/activate provider
- [ ] Auto-assign fill to pairs
- [ ] Manually assign fill to a pair
- [ ] Remove fill assignment
- [ ] View fill assignments in pair cards
- [ ] Test priority-based assignment
- [ ] Test max assignments (2 per provider)
- [ ] Test edge cases (not enough providers, all inactive)
- [ ] Verify points persist across page refreshes

---

## Troubleshooting

### "No fill providers registered yet"
- Make sure users have signed up for at least one transport activity before registering

### "Must have participated in at least one transport activity"
- User needs to have at least one signup in a transport activity

### Auto-assign doesn't work
- Check that providers are active
- Check that pairs exist
- Check browser console for errors

### Points not updating
- Refresh the page
- Check that points were actually added (check database if needed)

### Fill assignments not showing in pairs
- Make sure assignments were created successfully
- Check browser console for errors
- Refresh the page

---

## Database Verification (Optional)

If you want to verify data directly in the database:

```bash
npx prisma studio
```

Check these tables:
- `fill_providers` - All registered providers
- `fill_assignments` - All assignments
- `fill_provider_points` - All point entries
