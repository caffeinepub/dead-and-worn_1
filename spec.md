# Dead and Worn

## Current State

- Motoko backend with a single `Listing` type: id, name, price, description, imageUrl (single ExternalBlob), status (available | selling)
- CRUD operations: addListing, editListing, deleteListing, setListingStatus, getAllListings, getListing
- Admin auth via hardcoded username/password (slimkid3 / AliceInChains92)
- Frontend: HomePage (public grid), ListingPage (detail), AdminPage (add/edit/delete/status), LoginPage
- blob-storage component already integrated
- Y2K underground alternative visual style

## Requested Changes (Diff)

### Add

- **Multiple photos per listing**: `imageUrl` (single blob) replaced with `imageUrls` (array of ExternalBlob). Unlimited photos per listing.
- **Scrollable photo gallery** on ListingPage: swipeable/scrollable gallery showing all images for a listing.
- **Drops system**:
  - New `Drop` type: id, name, scheduledAt (Unix timestamp in seconds), listingIds (array of Text)
  - Drops CRUD: createDrop, editDrop, deleteDrop, getAllDrops, getDrop
  - Listings can be assigned to a drop; when assigned to a drop they are hidden from public until `scheduledAt` passes
  - `getAllListings` public query only returns listings NOT in an active (future) drop; listings in a past/expired drop are visible
  - Separate `getDropListings` query returns listings for a specific drop (admin use)
  - "Next Drop In..." countdown on the homepage showing the nearest upcoming drop timer (days, hours, minutes, seconds)
  - When timer hits zero, items in that drop become publicly visible automatically (frontend polls or recalculates)
- **Admin: drop management**: Create a drop, set name and datetime, assign existing or new listings to it, edit/delete drops
- **Admin: edit existing listings** to add/remove/reorder photos (imageUrls array management)

### Modify

- `Listing` type: replace `imageUrl: ExternalBlob` with `imageUrls: [ExternalBlob]` (array)
- `addListing` and `editListing` backend functions: accept `imageUrls` array instead of single `imageUrl`
- `getAllListings` public query: filter out listings assigned to a future drop (not yet released)
- AdminPage: update add/edit forms to support multiple photo uploads; add drop management UI tab
- ListingPage: replace single image display with scrollable gallery
- HomePage: add "Next Drop In..." countdown banner when an upcoming drop exists

### Remove

- Single `imageUrl` field from Listing (replaced by `imageUrls` array)

## Implementation Plan

1. **Backend (Motoko)**:
   - Update `Listing` type: `imageUrls : [Storage.ExternalBlob]`
   - Add `Drop` type: `{ id: Text; name: Text; scheduledAt: Int; listingIds: [Text] }`
   - Add drop storage map
   - Add `createDrop`, `editDrop`, `deleteDrop`, `getAllDrops`, `getDrop` functions (admin-authenticated mutations)
   - Update `getAllListings` to filter out listings whose id appears in any drop with `scheduledAt > now()`
   - Add `getDropListings(adminUsername, adminPassword, dropId)` for admin to see drop contents
   - Update `addListing` and `editListing` to use `imageUrls` array
   - Keep `setListingStatus` and `deleteListing` unchanged

2. **Frontend**:
   - Update all listing type references from `imageUrl` to `imageUrls` array
   - ListingPage: implement scrollable image gallery (prev/next arrows + dot indicators)
   - AdminPage add/edit form: multi-image upload (add multiple, remove individual, reorder)
   - AdminPage: add "Drops" tab -- create/edit/delete drops, assign listings to a drop, set countdown datetime
   - HomePage: add "Next Drop In..." countdown banner (polls every second, calculates from nearest future drop's scheduledAt)
   - All public queries: respect drop visibility (items in future drops don't appear in grid)
   - No raw error messages shown to user anywhere
