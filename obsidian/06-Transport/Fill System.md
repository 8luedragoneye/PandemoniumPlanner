# Fill System

## Overview

The fill system optimizes transport inventories by filling unused slots and weight capacity.

## Fill Types

### Weight Fill
- Items with stack size ≥ 20
- Used to maximize weight capacity (97-100%)
- Primarily for Transporters

### Slot Fill
- Equipment items ≥ Tier 6 (including 4.2 and 5.1)
- Used to fill empty slots
- Can be used by both Fighters and Transporters

## Fill Providers

### Requirements
- Must have run at least once before
- Must manage own sources and destinations
- Must have minimum quantities available:
  - Slot Fill: 100 slots
  - Weight Fill: 20t

### Organization
- Providers register separately from session signups
- Organized in priority lists (see [[Fill Priority System]])
- Typically 1 provider serves 2 pairs per session

## Fair Use Policy

- Guidelines are rough estimates
- Use common sense
- Don't exploit technicalities

## Implementation

- See `FillProviderManager.tsx` and `FillAssignmentManager.tsx`
- Providers registered separately from activities
- Assignment happens during activity setup

## Related

- [[Transport System Overview]]
- [[Fill Priority System]]
