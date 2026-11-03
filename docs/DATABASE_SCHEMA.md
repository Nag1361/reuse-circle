# Database schema

## Models

- **User**: `name`, normalized unique `email`, unique sparse normalized international phone number, `passwordHash` (select:false), optional unique sparse `googleId` (select:false), `role` (`user`/`moderator`), timestamps.
- **Listing**: `ownerId` reference, title, custom category label, condition, description, approximate pickup area, public contact phone, private exact pickup address and availability times, optional uploaded image path/URL, status (`available`/`sold`/`collected`; legacy `reserved` records are exposed as sold), timestamps. Records are retained after collection; collected listings are only returned to the owner or authorized moderators.
- **ItemRequest**: listing and requester references, message, optional rejection reason, status (`pending`/`accepted`/`declined`/`collected`), timestamps. A partial unique index prevents more than one pending or accepted request for the same listing/requester pair.
- **ContentReport**: listing and reporter references, reason, status (`pending`/`reviewed`/`dismissed`), timestamps.
- **Wishlist**: user and listing references with a unique compound index to prevent duplicate saves.
- **RecentlyViewed**: user and listing references with an updated `viewedAt` timestamp and unique compound index.
- **Notification**: requester reference, request reference, rejection message/reason, read timestamp, and timestamps. A unique request/type index prevents duplicate rejection notifications.

Listing indexes cover owner and browse facets/status/newest order; a text index covers title and description. Requests index listing, requester, and status. Reports have a unique `(listingId, reporterId)` index to enforce one report per reporter and listing.

Public listing responses omit the exact pickup address and time and exclude reserved, sold, and collected listings. The owner can see retained history, and the accepted requester can see sold/reserved details before collection. Reports and public browse results omit private pickup details. Public listing responses do not populate user references. Request owner views populate only the requester's name; reports populate reporter name only. Password hashes are excluded by default and selected explicitly only for password verification.

## Request state flow

`pending -> accepted` marks an available listing sold and declines its other pending requests. On a replica set or sharded MongoDB deployment, the listing update, selected request update, and competing request declines run in a transaction. A decline changes only that request and leaves the listing available. Only the accepted requester can transition the accepted request and sold listing to `collected`. Collected listings cannot be edited or receive new requests.

Standalone MongoDB does not support multi-document transactions. On standalone servers, acceptance uses a conditional atomic write on listing availability so only one concurrent request can win, then applies request updates with compensating rollback if the selected request has already changed. This fallback is suitable for local demonstrations, but production should use Atlas or another replica set so all acceptance changes commit or roll back together.
