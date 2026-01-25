# Pairing System

## Overview

The pairing system matches Fighters with Transporters for efficient transport runs.

## Pairing Logic

1. **Preference Matching**: Users can specify preferred partners
2. **Automatic Pairing**: Organizer pairs remaining users
3. **Balance**: Attempts to balance Fighter/Transporter ratio

## Pair Responsibilities

### First 3 Runs
- Transport Partner 1's (Fighter) personal items

### Last 3 Runs
- Transport Partner 2's (Transporter) personal items

## Pair Inventory

- **Fighter**: 10-15 free slots, weight under 80%
- **Transporter**: All slots filled, weight 97-100%

## Edge Cases

- **More Fighters than Transporters**: Some Fighters switch to Transporter or reduce personal transport runs
- **Odd Number**: Single person gets extra personal transport or helps with fills
- **Early Departure**: Partner coordination required

## Implementation Notes

- See `TransportPairManager.tsx` component
- Pairing happens during activity creation/signup
- Pairs can be manually adjusted by activity owner

## Related

- [[Transport System Overview]]
- [[Fill System]]
