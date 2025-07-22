import SlugGenerationService from '../../../src/services/slug-generation-service';
import { validateSlug } from '../../../src/validators/slug-validator';

describe('SlugGenerationService - Basic Slug Generation', () => {
  const cases = [
    { title: 'Software Engineer', expected: 'software-engineer' },
    { title: 'Senior Frontend Developer', expected: 'senior-frontend-developer' },
    { title: 'C++ Developer (Remote)', expected: 'c-developer-remote' },
    { title: 'React Developer 2025', expected: 'react-developer-2025' },
    { title: 'JavaScript DEVELOPER', expected: 'javascript-developer' },
    { title: 'Développeur Frontend', expected: ['développeur-frontend', 'developpeur-frontend'] },
    { title: 'Software Engineer 🚀', expected: 'software-engineer' },
    { title: 'Senior!!! Developer???', expected: 'senior-developer' },
    { title: 'Software    Engineer', expected: 'software-engineer' },
    { title: 'Senior_Frontend_Developer', expected: 'senior-frontend-developer' },
  ];

  test.each(cases)('should generate slug for "$title"', async ({ title, expected }) => {
    const { slug } = await SlugGenerationService.generateSlug(title);
    if (Array.isArray(expected)) {
      expect(expected.includes(slug)).toBe(true);
    } else {
      expect(slug).toBe(expected);
    }
  });

  it('should truncate slug to 100 characters for very long title', async () => {
    const longTitle = 'A'.repeat(120);
    const { slug } = await SlugGenerationService.generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(100);
  });

  it('should generate slug for short title (min 3 chars)', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Dev');
    expect(slug).toBe('dev');
    expect(isUnique).toBe(true);
  });

  test.each([
    { title: 'X', reason: /short/i },
    { title: '', reason: /required/i },
    { title: '   ', reason: /required/i },
  ])('should return error for invalid title "$title"', async ({ title, reason }) => {
    const { isUnique, reason: actualReason } = await SlugGenerationService.generateSlug(title);
    expect(isUnique).toBe(false);
    expect(actualReason).toMatch(reason);
  });
});

describe('SlugGenerationService - Uniqueness Resolution', () => {
  let existingSlugs: Set<string>;
  const setupSlugs = (slugs: string[]) => {
    existingSlugs = new Set(slugs);
  };
  const slugExists = async (slug: string) => existingSlugs.has(slug);

  beforeEach(() => {
    existingSlugs = new Set();
  });

  it('should generate slug for duplicate title (first time)', async () => {
    setupSlugs([]);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (second time)', async () => {
    setupSlugs(['software-engineer']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-1');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (third time)', async () => {
    setupSlugs(['software-engineer', 'software-engineer-1']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-2');
    existingSlugs.add(uniqueSlug);
  });

  it('should increment counter for existing slug pattern', async () => {
    setupSlugs([
      'software-engineer',
      'software-engineer-1',
      'software-engineer-2',
      'software-engineer-3',
    ]);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-4');
  });

  it('should fallback to UUID suffix after 999 conflicts', async () => {
    setupSlugs(
      Array.from({ length: 1000 }, (_, i) =>
        i === 0 ? 'software-engineer' : `software-engineer-${i}`,
      ),
    );
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toMatch(/^software-engineer-[a-f0-9]{8}$/);
  });

  it('should not consider current job ID as conflict', async () => {
    setupSlugs(['software-engineer', 'software-engineer-1']);
    // Simulate excludeJobId logic (here, just ignore for test)
    const slugExistsExclude = async (slug: string, excludeJobId?: number | null) => {
      if (excludeJobId === 123 && slug === 'software-engineer') return false;
      return existingSlugs.has(slug);
    };
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      baseSlug,
      slugExistsExclude,
      123,
    );
    expect(uniqueSlug).toBe('software-engineer');
  });
});

describe('SlugGenerationService - Slug Validation', () => {
  const validationCases = [
    { slug: 'software-engineer', valid: true, error: null },
    { slug: 'Software-Engineer', valid: false, error: /lowercase/i },
    { slug: 'software_engineer!', valid: false, error: /invalid/i },
    { slug: 'software engineer', valid: false, error: /format|invalid/i },
    { slug: 'ab', valid: false, error: /short/i },
    { slug: 'a'.repeat(101), valid: false, error: /long/i },
    { slug: '-software-engineer', valid: false, error: /format|invalid/i },
    { slug: 'software-engineer-', valid: false, error: /format|invalid/i },
    { slug: 'software--engineer', valid: false, error: /format|invalid/i },
  ];

  test.each(validationCases)('should validate "$slug"', ({ slug, valid, error }) => {
    const result = validateSlug(slug);
    expect(result.isValid).toBe(valid);
    if (!valid && error) {
      expect((result.errors || []).join(' ')).toMatch(error);
    }
  });
});

describe('SlugGenerationService - Reserved Slugs', () => {
  test.each([{ reserved: 'admin' }, { reserved: 'api' }, { reserved: 'jobs' }])(
    'should fail or generate alternative for reserved word "$reserved"',
    async ({ reserved }) => {
      const { isUnique, reason } = await SlugGenerationService.generateSlug(reserved);
      expect(isUnique).toBe(false);
      expect(reason).toMatch(/reserved/i);
    },
  );

  it('should fail validation for manual slug against reserved words', () => {
    const result = validateSlug('admin');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/reserved/i);
  });
});

describe('SlugGenerationService - Slug Regeneration', () => {
  let existingSlugs: Set<string>;
  let history: any[];
  const slugExists = async (slug: string) => existingSlugs.has(slug);
  const trackSlugChange = async (
    jobId: number,
    oldSlug: string,
    newSlug: string,
    reason: string,
  ) => {
    history.push({ jobId, oldSlug, newSlug, reason });
  };
  const jobId = 1;

  beforeEach(() => {
    existingSlugs = new Set();
    history = [];
  });

  it('should regenerate slug and track history on title change', async () => {
    existingSlugs.add('software-engineer');
    const newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Senior Frontend Developer',
      slugExists,
      trackSlugChange,
      'software-engineer',
    );
    expect(newSlug).toBe('senior-frontend-developer');
    expect(history.length).toBe(1);
    expect(history[0].oldSlug).toBe('software-engineer');
    expect(history[0].newSlug).toBe('senior-frontend-developer');
    expect(history[0].reason).toBe('title_update');
  });

  it('should not track history if title does not change slug', async () => {
    // Add the current slug to the set, but simulate excludeJobId logic if needed
    existingSlugs.add('software-engineer');
    const slugExistsExclude = async (slug: string, excludeJobId?: number | null) => {
      // Simulate that the current job's slug is not a conflict
      if (slug === 'software-engineer' && excludeJobId === jobId) return false;
      return existingSlugs.has(slug);
    };
    const newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Software Engineer',
      slugExistsExclude,
      trackSlugChange,
      'software-engineer',
    );
    expect(newSlug).toBe('software-engineer');
    expect(history.length).toBe(0);
  });

  it('should resolve conflict and track history if new slug conflicts', async () => {
    existingSlugs = new Set(['senior-frontend-developer']);
    const newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Senior Frontend Developer',
      slugExists,
      trackSlugChange,
      'software-engineer',
    );
    expect(newSlug).toBe('senior-frontend-developer-1');
    expect(history.length).toBe(1);
    expect(history[0].oldSlug).toBe('software-engineer');
    expect(history[0].newSlug).toBe('senior-frontend-developer-1');
  });

  it('should maintain complete slug history for multiple updates', async () => {
    let oldSlug = 'software-engineer';
    let newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Senior Frontend Developer',
      slugExists,
      trackSlugChange,
      oldSlug,
    );
    existingSlugs.add(newSlug);
    oldSlug = newSlug;
    newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Lead Frontend Developer',
      slugExists,
      trackSlugChange,
      oldSlug,
    );
    expect(history.length).toBe(2);
    expect(history[0].newSlug).toBe('senior-frontend-developer');
    expect(history[1].newSlug).toBe('lead-frontend-developer');
  });
});

describe('SlugGenerationService - Performance Testing', () => {
  it('should generate 1000 unique slugs sequentially within reasonable time', async () => {
    const existingSlugs = new Set<string>();
    const slugExists = (slug: string) => existingSlugs.has(slug);
    const baseSlug = 'software-engineer';
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      const uniqueSlug = await SlugGenerationService.ensureUniqueness(
        baseSlug,
        async (slug: string) => slugExists(slug),
      );
      expect(existingSlugs.has(uniqueSlug)).toBe(false);
      existingSlugs.add(uniqueSlug);
    }
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000); // Allow a bit more time for CI
    expect(existingSlugs.size).toBe(1000);
  });

  it('should resolve 100 conflicts efficiently', async () => {
    const existingSlugs = new Set<string>();
    const slugExists = (slug: string) => existingSlugs.has(slug);
    const baseSlug = 'software-engineer';
    for (let i = 0; i < 100; i++) {
      existingSlugs.add(i === 0 ? baseSlug : `${baseSlug}-${i}`);
    }
    const start = Date.now();
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      baseSlug,
      async (slug: string) => slugExists(slug),
    );
    const duration = Date.now() - start;
    expect(uniqueSlug).toBe('software-engineer-100');
    expect(duration).toBeLessThan(100); // Should be fast
  });

  it('should generate a single slug in under 100ms', async () => {
    const slugExists = (_slug: string) => false;
    const start = Date.now();
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      'software-engineer',
      async (slug: string) => slugExists(slug),
    );
    const duration = Date.now() - start;
    expect(uniqueSlug).toBe('software-engineer');
    expect(duration).toBeLessThan(100);
  });
});

describe('SlugGenerationService - Database Integration', () => {
  it('should save slug correctly during job creation', async () => {
    const db: { slug: string }[] = [];
    const slugExists = async (slug: string) => db.some(j => j.slug === slug);
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Software Engineer');
    expect(isUnique).toBe(true);
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
    db.push({ slug: uniqueSlug });
    expect(db[0].slug).toBe('software-engineer');
  });

  it('should update slug correctly during job modification', async () => {
    const db: { slug: string }[] = [{ slug: 'software-engineer' }];
    const slugExists = async (slug: string) => db.some(j => j.slug === slug);
    const { slug } = await SlugGenerationService.generateSlug('Senior Frontend Developer');
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
    db[0].slug = uniqueSlug;
    expect(db[0].slug).toBe('senior-frontend-developer');
  });

  it('should handle database constraint violation on duplicate slug', async () => {
    const db: { slug: string }[] = [{ slug: 'software-engineer' }];
    const slugExists = async (slug: string) => db.some(j => j.slug === slug);
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer');
    // Simulate unique constraint violation
    let uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-1');
    db.push({ slug: uniqueSlug });
    // Try again, should get next available
    uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-2');
  });

  it('should handle database failure during slug generation', async () => {
    const slugExists = async (_slug: string) => {
      throw new Error('DB connection failed');
    };
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer');
    await expect(SlugGenerationService.ensureUniqueness(slug, slugExists)).rejects.toThrow(
      'DB connection failed',
    );
  });
});
