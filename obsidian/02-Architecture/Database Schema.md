# Database Schema

## Overview

The project uses Prisma ORM with SQLite for local development and PostgreSQL for production.

## Models

### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Activity
```prisma
model Activity {
  id          String   @id @default(cuid())
  name        String
  description String?
  date        DateTime
  zone        String?
  minIP       Int?
  minFame     Int?
  status      String   @default("recruiting")
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  roles       Role[]
  signups     Signup[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Role
```prisma
model Role {
  id         String   @id @default(cuid())
  name       String
  slots      Int
  attributes Json     // Flexible JSON for custom requirements
  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  signups    Signup[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Signup
```prisma
model Signup {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Relationships

- User → Activities (one-to-many, owner)
- Activity → Roles (one-to-many)
- Activity → Signups (one-to-many, through roles)
- User → Signups (one-to-many)
- Role → Signups (one-to-many)

## Cascade Deletes

- Deleting an Activity deletes all its Roles
- Deleting a Role deletes all its Signups

## Related

- [[Architecture Overview]]
- See `prisma/schema.prisma` for full schema
