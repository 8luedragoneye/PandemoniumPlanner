# Quick Start Guide - Step by Step

Follow these steps in order to get everything working locally.

## ✅ Step 1: PocketBase is Running (You've Done This!)

You already have PocketBase running on http://localhost:8090. Great!

## Step 2: Install Frontend Dependencies

Open a **NEW terminal window** (keep PocketBase running in the first one) and run:

```bash
npm install
```

This will install all the React/TypeScript dependencies.

## Step 3: Set Up PocketBase Collections

### ⚡ Quick Option: Automated Setup (Recommended!)

Instead of manual setup, you can use the automated script:

```bash
npm run setup:db
```

Enter your admin credentials when prompted, and all collections will be created automatically! See `AUTO_SETUP.md` for details.

### Manual Option: Step-by-Step Setup

If you prefer to set up manually, follow these steps:

### 3.1: Create `users` Collection (Auth Collection)

1. Go to http://localhost:8090/_/
2. Click **Collections** in the left menu
3. Click **New Collection**
4. **Name**: `users`
5. **Type**: Select **Auth** (important!)
6. Click **Create**

Now add fields to `users`:
- Click **New Field**
  - **Name**: `name`
  - **Type**: Text
  - **Required**: ✓
  - Click **Create**

- Click **New Field** again
  - **Name**: `username`
  - **Type**: Text
  - **Required**: ✓
  - Click **Create**

### 3.2: Set API Rules for `users`

1. In the `users` collection, click **Settings** tab
2. Scroll to **API Rules**
3. Set these rules:

**List/Search Rule:**
```
@request.auth.id != ""
```

**View Rule:**
```
@request.auth.id != ""
```

**Create Rule:**
```
@request.auth.id = ""
```

**Update Rule:**
```
@request.auth.id = id
```

**Delete Rule:**
```
@request.auth.id = id
```

4. Click **Save**

### 3.3: Create `activities` Collection

1. Click **Collections** → **New Collection**
2. **Name**: `activities`
3. **Type**: Base (default)
4. Click **Create**

Add these fields (click **New Field** for each):

1. **name**
   - Type: Text
   - Required: ✓

2. **date**
   - Type: Date
   - Required: ✓

3. **description**
   - Type: Text (or Textarea)
   - Required: ✓

4. **creator**
   - Type: Relation
   - Collection: `users`
   - Required: ✓
   - Max select: 1

5. **status**
   - Type: Select
   - Required: ✓
   - Options: `recruiting`, `full`, `running` (one per line)

6. **zone**
   - Type: Text
   - Required: ✗ (optional)

7. **minIP**
   - Type: Number
   - Required: ✗ (optional)

8. **minFame**
   - Type: Number
   - Required: ✗ (optional)

**Set API Rules for `activities`:**
- **List/Search**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != "" && @request.auth.id = creator`
- **Update**: `@request.auth.id = creator`
- **Delete**: `@request.auth.id = creator`

### 3.4: Create `roles` Collection

1. **New Collection** → Name: `roles`

Add fields:

1. **activity**
   - Type: Relation
   - Collection: `activities`
   - Required: ✓
   - Max select: 1

2. **name**
   - Type: Text
   - Required: ✓

3. **slots**
   - Type: Number
   - Required: ✓
   - Min: 1

4. **attributes**
   - Type: JSON
   - Required: ✗

**Set API Rules for `roles`:**
- **List/Search**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != "" && @request.auth.id = activity.creator`
- **Update**: `@request.auth.id = activity.creator`
- **Delete**: `@request.auth.id = activity.creator`

### 3.5: Create `signups` Collection

1. **New Collection** → Name: `signups`

Add fields:

1. **activity**
   - Type: Relation
   - Collection: `activities`
   - Required: ✓
   - Max select: 1

2. **role**
   - Type: Relation
   - Collection: `roles`
   - Required: ✓
   - Max select: 1

3. **player**
   - Type: Relation
   - Collection: `users`
   - Required: ✓
   - Max select: 1

4. **attributes**
   - Type: JSON
   - Required: ✗

5. **comment**
   - Type: Text
   - Required: ✗

**Set API Rules for `signups`:**
- **List/Search**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != "" && @request.auth.id = player`
- **Update**: `@request.auth.id = player || @request.auth.id = activity.creator`
- **Delete**: `@request.auth.id = player || @request.auth.id = activity.creator`

## Step 4: Start the Frontend

In your terminal (where you ran `npm install`), run:

```bash
npm run dev
```
You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 5: Test It!

1. Open http://localhost:3000 in your browser
2. You should see the login/register page
3. Click **Register**
4. Enter:
   - Email: your@email.com
   - Password: (anything)
   - Name: Your Name
5. Click **Register**
6. You should now see the activities list!

## Troubleshooting

### Frontend shows 404
- Make sure you ran `npm run dev` (not just `npm install`)
- Check that it's running on http://localhost:3000 (check the terminal output)

### Can't connect to PocketBase
- Make sure PocketBase is still running (check the first terminal)
- Verify it's on http://localhost:8090

### Collection errors
- Make sure all fields are created exactly as described
- Check that API rules are set correctly (copy-paste them exactly)

### Registration fails
- Check PocketBase admin UI → Collections → users
- Make sure `name` and `username` fields exist
- Verify the Create rule is: `@request.auth.id = ""`

## You're Done! 🎉

Now you can:
- Create activities
- Add roles to activities
- Sign up for activities
- Everything updates in real-time!

