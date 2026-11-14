# AhteeShop GET API

Base URL: `http://localhost:3000`. All GET routes are read-only.

## Public
```bash
curl -X GET "http://localhost:3000/api" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/home" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/contact" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/categories" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/products?page=1&limit=20" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/products?q=discord&inStock=true&page=1&limit=10" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/products?categoryId=CATEGORY_ID&minPrice=10&maxPrice=500" -H "Accept: application/json"
curl -X GET "http://localhost:3000/api/search?q=discord" -H "Accept: application/json"
```

## Authenticated (existing ahtee_session cookie)
Use a session obtained through the normal login flow. Never commit or share real session values.
```bash
curl -X GET "http://localhost:3000/api/me" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/shop" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/orders?page=1&limit=20" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/transactions?page=1&limit=20" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/history" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/topup" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/rewards" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
curl -X GET "http://localhost:3000/api/wheel" -H "Accept: application/json" --cookie "ahtee_session=YOUR_SESSION"
```

## Admin
```bash
curl -X GET "http://localhost:3000/api/admin" -H "Accept: application/json" --cookie "ahtee_session=ADMIN_SESSION"
```

## Safety
- Products support q, categoryId, featured, inStock, minPrice, maxPrice, page and limit (1–50).
- Public product responses expose stock counts only, never inventory payloads.
- Orders and transactions are scoped to the signed-in user and use explicit safe field selections.
- Admin data remains restricted to the admin role by the existing handler.
- GET endpoints do not create orders, debit balances, approve top-ups or mutate inventory.
- Existing POST routes remain unchanged.
