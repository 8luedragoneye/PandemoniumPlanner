# API Reference

## Base URL

- Local: `http://localhost:3001/api`
- Production: *Configure in environment*

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### POST `/auth/login`
Login and get JWT token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### Activities

#### GET `/activities`
Get all activities (with filters).

**Query params:**
- `filter`: `all` | `my` | `signedUp` | `upcoming` | `past`

#### POST `/activities`
Create a new activity.

**Body:**
```json
{
  "name": "Activity Name",
  "description": "Description",
  "date": "2024-01-15T18:00:00Z",
  "zone": "Black Zone",
  "minIP": 1300,
  "minFame": 1000000
}
```

#### GET `/activities/:id`
Get activity details.

#### PUT `/activities/:id`
Update activity (owner only).

#### DELETE `/activities/:id`
Delete activity (owner only).

### Roles

#### POST `/activities/:activityId/roles`
Create role for activity.

#### PUT `/roles/:id`
Update role.

#### DELETE `/roles/:id`
Delete role.

### Signups

#### POST `/signups`
Create signup.

**Body:**
```json
{
  "roleId": "role-id",
  "comment": "Optional comment"
}
```

#### DELETE `/signups/:id`
Cancel signup.

## Related

- [[Architecture Overview]]
- See `server/routes/` for implementation
