# Setup Checklist ✅

## Current Status

- ✅ PocketBase downloaded and running on http://localhost:8090
- ✅ Admin account created
- ✅ Frontend dependencies installed (`npm install` done)

## What You Need to Do Now

### 1. Create Collections in PocketBase (5-10 minutes)

Open http://localhost:8090/_/ and follow **QUICK_START.md** step 3.

**Quick Summary:**
1. Create `users` collection (Type: **Auth**) with `name` and `username` fields
2. Create `activities` collection with all fields
3. Create `roles` collection
4. Create `signups` collection
5. Set API rules for each collection (copy-paste from QUICK_START.md)

### 2. Start the Frontend

Open a **new terminal** (keep PocketBase running!) and run:

```bash
cd C:\Users\Administrator\source\PandemoniumPlanner
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:3000/
```

### 3. Open the App

Go to http://localhost:3000 in your browser.

You should see the login/register page!

## Common Issues

### "404" on localhost:3000
→ You haven't started the frontend yet. Run `npm run dev` in a new terminal.

### "Cannot connect to PocketBase"
→ Make sure PocketBase is still running (check the first terminal window).

### "Collection not found" errors
→ You need to create the collections first. Follow QUICK_START.md step 3.

### Registration fails
→ Check that the `users` collection has `name` and `username` fields, and the Create rule is `@request.auth.id = ""`

## Need Help?

See **QUICK_START.md** for detailed step-by-step instructions with screenshots descriptions.
