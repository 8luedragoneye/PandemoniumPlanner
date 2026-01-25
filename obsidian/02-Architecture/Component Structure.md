# Component Structure

## Overview

React components are organized by feature/functionality.

## Component Hierarchy

```
App
└── Layout
    ├── ActivityList
    │   ├── FilterButtons
    │   └── ActivityCard
    │       └── ActivityDetail
    │           ├── RoleManager
    │           └── SignupForm
    ├── CreateActivity
    └── EditActivity
```

## Key Components

### Layout
- Main app layout with navigation
- Handles authentication state
- Wraps all routes

### ActivityList
- Displays list of activities
- Handles filtering
- Shows ActivityCard components

### ActivityCard
- Individual activity display
- Shows basic info and status
- Links to ActivityDetail

### ActivityDetail
- Full activity view
- Shows roles and signups
- Owner can edit/delete

### CreateActivity / EditActivity
- Forms for activity creation/editing
- Handles validation
- Submits to API

### RoleManager
- Manage roles for an activity
- Add/edit/delete roles
- Shows role slots and attributes

### SignupForm
- Sign up for activity roles
- Shows role requirements
- Handles overlap detection

### FilterButtons
- Filter activities by various criteria
- Updates ActivityList display

## Component Patterns

- **Container/Presentational**: Some components separate logic from presentation
- **Custom Hooks**: Reusable logic in `hooks/` directory
- **Context API**: Global state (auth) via contexts

## Related

- [[Architecture Overview]]
- See `src/components/` for implementation
