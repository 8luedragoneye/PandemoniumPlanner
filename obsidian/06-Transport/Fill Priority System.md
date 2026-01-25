# Fill Priority System

## Overview

Point-based system for managing fill provider assignments fairly.

## Point System

### Earning Points
- **+1 point**: Participating in a session (mitlaufen)

### Losing Points
- **-1 point**: Being assigned to a pair in a session
- **-1 point**: Problems with sources/destinations that could have been prevented

## Assignment Logic

1. Providers organized in priority lists (separate for slots and weight)
2. Standard assignment: 1 provider → 2 pairs
3. With 12 pairs per session: ~6 providers needed
4. Provider with only 1 assignment gets priority faster next time

## Special Cases

- Provider can be assigned without participating in session
- Still gets +1 point for participation if they join
- Point system ensures fair rotation

## Implementation Status

- **Status**: Planned / In Progress
- See [[Feature Roadmap]] for current status
- Component: `FillAssignmentManager.tsx`

## Related

- [[Transport System Overview]]
- [[Fill System]]
