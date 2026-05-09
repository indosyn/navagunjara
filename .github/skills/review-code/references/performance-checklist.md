# Performance Review Checklist

## Database
- [ ] No N+1 query patterns
- [ ] Appropriate indexes exist for query patterns
- [ ] Large result sets are paginated
- [ ] Transactions scoped as narrowly as possible

## Memory & CPU
- [ ] No unnecessary object allocations in hot paths
- [ ] Large collections processed with streaming/pagination
- [ ] No blocking calls on async/event-loop threads
- [ ] Expensive computations cached where appropriate

## Network
- [ ] HTTP requests have timeouts and retries with backoff
- [ ] Batch API calls instead of individual requests in loops
- [ ] Response payload sizes are reasonable
- [ ] Connection pools configured and bounded

## Caching
- [ ] Frequently accessed read-heavy data is cached
- [ ] Cache invalidation strategy is clear
- [ ] Cache TTLs are appropriate for data freshness needs

## Front-End
- [ ] No layout thrashing or excessive DOM manipulation
- [ ] Images and assets optimized and lazy-loaded
- [ ] Bundle size impact assessed for new dependencies
