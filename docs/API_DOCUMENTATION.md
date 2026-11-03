# API documentation

All routes use the `/api` prefix and return `{ success, message, data }` on success. Errors return `{ success: false, message }`. Protected routes require the `reusecircle_token` HttpOnly cookie. IDs are MongoDB ObjectIds. JSON request bodies are limited to 100 KB.

## Authentication

| Method and path | Access | Body / query | Result |
|---|---|---|---|
| `POST /auth/register` | Public, rate limited | `name`, `email`, `phone`, `password`, `confirmPassword` | 201; user object and HttpOnly JWT cookie; phone is normalized to international E.164 format |
| `POST /auth/login` | Public, rate limited | `email`, `password` | 200; user and HttpOnly JWT cookie |
| `POST /auth/google` | Public, rate limited | `credential` (Google ID token) | 200; user and HttpOnly JWT cookie |
| `POST /auth/logout` | Public | none | 200; clears cookie |
| `GET /auth/me` | Login required | none | 200; current user |
| `GET /me/profile` | Login required | none | 200; current profile including normalized phone |
| `PATCH /me/profile` | Login required | `name`, `phone` | Updates the display name and required unique international phone number |
| `PATCH /me/password` | Login required | `email`, `currentPassword`, `newPassword`, `confirmPassword` | Verifies the current password and changes it |

## Listings and requests

| Method and path | Access | Body / query | Result |
|---|---|---|---|
| `GET /listings` | Public | `search`, `category`, `condition`, `status`, `location`, `sort`, `recent`, `page`, `limit` | Newest first, paginated available-only `{items,pagination}`; reserved, sold, and collected listings are excluded |
| `POST /listings` | Login required | multipart fields including optional `image` file (JPEG, PNG, WebP, or GIF; max 5 MB) | 201; listing with uploaded image under `/uploads` |
| `GET /listings/:id` | Login required; browse cards remain public | none | authenticated listing details; collected listings are owner/moderator-only, while sold/reserved listings are limited to the owner, moderator, or accepted requester |
| `PATCH /listings/:id` | Owner | multipart editable listing fields and optional replacement `image` file; status is not accepted | Updated available listing |
| `DELETE /listings/:id` | Owner | none | Deletes available listing and dependent records |
| `GET /me/listings` | Login required | none | Current user's listings |
| `GET /me/wishlist` | Login required | none | Available wishlisted listings |
| `POST /listings/:id/wishlist` | Login required | none | Adds the listing to the current user's wishlist |
| `DELETE /listings/:id/wishlist` | Login required | none | Removes the listing from the current user's wishlist |
| `GET /me/recently-viewed` | Login required | none | Up to 10 recently viewed available listings |
| `POST /listings/:id/requests` | Login required | `message` (5–1000 chars) | 201; pending request |
| `GET /me/requests` | Login required | none | Submitted requests; exact pickup details are included only after acceptance |
| `GET /listings/:id/requests` | Listing owner | none | Requests with requester display name only |
| `PATCH /requests/:id/status` | Listing owner | `status: accepted | declined`; declined requests require `rejectionReason` (5–1000 chars) | Request result; acceptance reserves listing and declines pending competitors; explicit rejection creates a requester notification |
| `PATCH /requests/:id/collect` | Accepted requester | none | Changes the accepted request and listing to collected |
| `GET /me/notifications` | Login required | none | Persistent notifications and unread count for the current user |
| `PATCH /notifications/:id/read` | Notification owner | none | Marks a notification as read |

## Reporting, moderation, dashboard, health

| Method and path | Access | Body / query | Result |
|---|---|---|---|
| `POST /listings/:id/reports` | Login required, not listing owner | `reason` (5–1000 chars) | 201; pending report |
| `GET /moderation/reports` | Moderator | optional status | Reports with listing and reporter display name |
| `PATCH /moderation/reports/:id/status` | Moderator | `status: reviewed | dismissed` | Updated report |
| `GET /dashboard/summary` | Login required | none | Counts for current user's listings and requests |
| `GET /health` | Public | none | API health status (server only starts after DB connection) |

Typical status codes: 200 read/update, 201 create, 400 invalid input, 401 missing/invalid session, 403 ownership/role denied, 404 missing resource, 409 duplicate or invalid state transition, 429 rate limit, 500 unexpected server failure. Detailed stack traces are not returned.

Example error: `{"success":false,"message":"Only the listing owner can manage requests"}`.
