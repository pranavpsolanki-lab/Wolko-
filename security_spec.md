# Wolko Handcrafted Studio — Firestore Security Specification

## 1. Data Invariants
1. **Identity & Email Verification**: All reads and writes to `/customers/{customerId}` and `/orders/{orderId}` require an authenticated user (`request.auth != null`) with a verified Google email (`request.auth.token.email_verified == true`), or the bootstrapped admin (`krishprakashsolanki@gmail.com`).
2. **Customer PII Isolation**: A `/customers/{customerId}` document can only be read, created, or updated by the owner (`customerId == request.auth.uid`) or a verified admin. No blanket `isSignedIn()` reads are permitted.
3. **Order Relational Ownership**: Every `/orders/{orderId}` document must have `userId == request.auth.uid` on creation and must reference an existing `/customers/{userId}` document (`exists(/databases/$(database)/documents/customers/$(incoming().userId))`).
4. **Strict Key & Volumetric Boundaries**: Every write operation enforces `hasAll` and `hasOnly` on allowed keys and enforces explicit `.size()` bounds and regex checks matching `firebase-blueprint.json`.
5. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` must match `request.time`. On updates, `uid`, `userId`, `orderId`, and `createdAt` are strictly immutable.
6. **Terminal State Locking**: Once an order reaches a terminal state (`orderStatus == 'CANCELLED ❌'`), non-admin users cannot mutate it further.
7. **Secure List Queries**: `allow list` on `/orders/{orderId}` strictly checks `resource.data.userId == request.auth.uid || isAdmin()` with zero `get()`/`exists()` calls inside `list`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Customer Read**: `auth = null` attempting `get /customers/user_1`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email: 'krishprakashsolanki@gmail.com', email_verified: false } }` attempting `create /customers/user_1`.
3. **Cross-User PII Read**: `auth = { uid: 'user_2', token: { email_verified: true } }` attempting `get /customers/user_1`.
4. **Shadow Field Injection on Customer**: `create /customers/user_1` including extra field `"isAdmin": true`.
5. **Identity Spoofing on Order Creation**: `auth.uid = 'user_1'` creating `/orders/WOLKO-10001` with `userId: 'user_2'`.
6. **Orphaned Order Creation**: `auth.uid = 'user_no_profile'` creating `/orders/WOLKO-10002` when `/customers/user_no_profile` does not exist.
7. **ID Poisoning Attack**: Creating `/orders/INVALID ID WITH SPACES` that violates `isValidId()`.
8. **Denial-of-Wallet String Overflow**: Creating `/orders/WOLKO-10003` with a 5,000-character `address` exceeding `maxLength: 500`.
9. **Client Timestamp Forgery**: Creating `/orders/WOLKO-10004` with a past/future `createdAt` instead of `request.time`.
10. **Immutable Field Mutation**: Updating `/orders/WOLKO-10001` to change `userId` or `createdAt`.
11. **Value Poisoning on Update**: Updating allowed key `orderStatus` on `/orders/WOLKO-10001` with a non-string (`12345`) or >60 char string.
12. **Blanket List Scraping**: Authenticated user `user_2` running an unconstrained `list` query on `/orders` without filtering `userId == 'user_2'`.
