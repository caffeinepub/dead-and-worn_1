# Dead and Worn

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Clothing listing store called "Dead and Worn"
- Each listing has: photo (uploaded image), name, price, description, and status (AVAILABLE or SELLING)
- Public grid view of all listings
- Public detail page per listing showing photo, name, price, description, TikTok handle @whyteboyswag, and "DM to buy" call to action
- Admin login with hardcoded credentials: username slimkid3, password AliceInChains92
- Admin-only: add new listing (with image upload), edit listing, mark listing as SELLING, delete listing
- Listings posted by admin are immediately visible to all public visitors
- No "problem listing item" errors -- all listing operations must be robust and always succeed
- Status badge on grid cards: "SELLING" badge when item is in process of being sold

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Store listings with fields (id, name, price, description, imageUrl, status). Expose query to list all listings and get single listing. Expose update calls for add, edit, delete, set status. Hardcode admin credential check on authenticated calls.
2. Blob storage component for image uploads.
3. Frontend: Public grid page with listing cards. Individual listing detail page (React Router). Admin login page. Admin dashboard with add/edit/delete/status controls. Robust error handling -- never surface "problem listing item" to the user, retry silently or handle gracefully.
