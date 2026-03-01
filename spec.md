# Dead and Worn

## Current State
- Full-stack clothing store with Motoko backend and React frontend
- Listings: add, edit, delete, mark as SELLING
- Multi-photo support per listing (scrollable gallery on detail page)
- Timed drops: schedule grouped listings to become visible at a set time
- Admin login (slimkid3 / AliceInChains92) controls all mutations
- Public visitors can browse listings and detail pages
- Y2K underground alternative visual style

## Requested Changes (Diff)

### Add
- `exportData` backend endpoint: returns all listings (id, name, price, description, status) and all drops (id, name, scheduledAt, listingIds) as a structured record — no image data
- `importData` backend endpoint: accepts the same structure and bulk-restores listings and drops (admin-only); merges into existing data, overwriting by ID
- Admin dashboard "Backup" tab with:
  - Export button: calls `exportData`, serializes to JSON, triggers browser download as `dead-and-worn-backup.json`
  - Import section: file upload input that accepts `.json`, parses it, calls `importData`, shows success/error feedback
  - Clear instructions explaining photos must be re-uploaded manually after import

### Modify
- Admin dashboard Tabs: add a third tab "BACKUP" alongside LISTINGS and DROPS

### Remove
- Nothing removed
