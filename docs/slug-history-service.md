# Slug History Service Documentation

## Overview

The Slug History Service provides tracking, retrieval, and resolution of slug changes for job postings. It enables SEO-friendly redirects, analytics, and audit trails by maintaining a record of all slug changes.

---

## Architecture & Responsibilities

- **Factory Pattern:** Service is created via a factory function with injected DB/repository dependencies.
- **Single Responsibility:** Focuses solely on slug history management.
- **Extensible:** Easily integrates with any data layer or ORM.
- **Error Logging:** Uses Winston logger for error handling.

---

## Factory Usage

```ts
import { createSlugHistoryService } from '@/services/slug-history-service';

const slugHistoryService = createSlugHistoryService({
  createHistory: async record => {
    /* insert into DB */
  },
  getHistory: async jobId => {
    /* fetch from DB */
  },
  findBySlug: async slug => {
    /* fetch by slug from DB */
  },
});
```

---

## Public Methods

### 1. `trackSlugChange(jobId, oldSlug, newSlug, reason, createdBy?)`

**Purpose:** Track a slug change for a job posting, recording the reason and user.

#### Parameters

- `jobId` (number): The job posting ID.
- `oldSlug` (string|null): The previous slug (null for creation).
- `newSlug` (string): The new slug.
- `reason` ("creation" | "title_update" | "manual_update" | "conflict_resolution"): Reason for the change.
- `createdBy` (number, optional): User ID who made the change.

#### Returns

- `Promise<void>`

#### Example

```ts
await slugHistoryService.trackSlugChange(jobId, oldSlug, newSlug, 'title_update', userId);
```

#### Edge Cases

- Throws error if DB/repository fails.

---

### 2. `getSlugHistory(jobId)`

**Purpose:** Retrieve the complete slug history for a job posting.

#### Parameters

- `jobId` (number): The job posting ID.

#### Returns

- `Promise<SlugHistoryRecord[]>`: Array of slug history records.

#### Example

```ts
const history = await slugHistoryService.getSlugHistory(jobId);
```

#### Edge Cases

- Throws error if DB/repository fails.

---

### 3. `findJobByHistoricalSlug(slug)`

**Purpose:** Find a job posting by a historical slug (for redirect/lookup).

#### Parameters

- `slug` (string): The historical slug.

#### Returns

- `Promise<{ jobPostingId: number; currentSlug: string } | null>`: Job posting ID and current slug, or null if not found.

#### Example

```ts
const result = await slugHistoryService.findJobByHistoricalSlug(slug);
if (result) {
  res.redirect(301, `/jobs/${result.currentSlug}`);
} else {
  res.status(404).json({ error: 'Job not found' });
}
```

#### Edge Cases

- Throws error if DB/repository fails.

---

## Error Handling

- All methods throw errors if the underlying DB/repository fails.
- Winston logger is used for error logging.

---

## Integration Points

- **Slug Regeneration:** Call `trackSlugChange` whenever a slug is changed.
- **SEO Redirects:** Use `findJobByHistoricalSlug` to support 301 redirects from old slugs.
- **Audit & Analytics:** Use `getSlugHistory` for admin/audit views and analytics.

---

## Extensibility & Best Practices

- Use the factory to inject DB/repository dependencies once at app startup.
- Always track slug changes for SEO and auditability.
- Handle all error cases and log with Winston.
- Extend with additional metadata or hooks as needed.

---

## Related Files

- `src/services/slug-history-service.ts`
- `src/interfaces/slug/slug-history.ts`
