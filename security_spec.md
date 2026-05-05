# Security Specification: Anshi Collections

## 1. Data Invariants
- A product MUST have a name, price, and imageUrl.
- Prices cannot be negative.
- `createdAt` is immutable after creation.
- `updatedAt` must match the server time of the update.
- Only verified email users can perform write operations.

## 2. The "Dirty Dozen" Payloads (Deny List)
1. **The Price Manipulation**: `{ name: "Dress", price: -100, ... }` -> Rejected (price >= 0).
2. **The Shadow Field**: `{ name: "Dress", price: 100, isAdmin: true, ... }` -> Rejected (Strict schema).
3. **The Identity Spoof**: Unauthenticated user trying to `setDoc` to `/products/123`.
4. **The Timestamp Cheat**: Client providing an old `updatedAt` instead of `request.time`.
5. **The Massive ID**: Attempting to use a 2MB string as a document ID.
6. **The Orphaned Write**: Trying to delete a product without admin privileges.
7. **The Email Spoof**: User with `email_verified: false` trying to write.
8. **The PII Leak**: (Not applicable here as no user PII is stored in products).
9. **The Oversized Text**: Sending a 1MB string for the product name.
10. **The Category Injection**: Sending a List for category instead of String.
11. **The Immutable Break**: Attempting to change `createdAt` on update.
12. **The Ghost Key**: Adding unknown keys during an update.

## 3. Test Runner (Mock Tests)
- `test_create_product_as_guest`: Expected Deny.
- `test_create_product_as_unverified_admin`: Expected Deny.
- `test_create_product_as_verified_admin`: Expected Allow.
- `test_update_price_as_verified_admin`: Expected Allow.
- `test_update_createdAt_as_verified_admin`: Expected Deny.
