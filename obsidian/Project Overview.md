# Project Overview

## What is NOX Planer?

NOX Planer is an activity organizer for the Albion Online alliance **Schattenwandler**. It helps alliance members organize activities, manage sign-ups, and coordinate transport runs.

## Core Features

- **User Authentication**: Self-registration with email, password, and name
- **Activity Management**: Any user can create activities; creator becomes owner
- **Role System**: Owners define roles with custom attributes
- **Sign-ups**: Users can join activities with role confirmation
- **Overlap Detection**: Warns users about overlapping timeframes
- **Status Management**: Activities have statuses (recruiting, full, running)
- **Filtering**: Filter by my activities, signed up, upcoming, past
- **Transport System**: Advanced transport pairing and fill management
- **Fill System**: Weight and slot fill optimization with priority system

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- React Router v6
- date-fns + date-fns-tz (CET timezone)
- CSS with CSS variables (Albion theme)

### Backend
- Express.js
- Prisma ORM
- SQLite (local) / PostgreSQL (production)
- PocketBase (alternative backend option)

## Project Status

See [[Feature Roadmap]] for current status and planned features.

## Related Documents

- [[Architecture Overview]]
- [[Feature Roadmap]]
- [[Transport System]]
- [[Development Setup]]
