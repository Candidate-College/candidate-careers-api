import SlugGenerationService from '../../src/services/slug-generation-service';
import { validateSlug } from '../../src/validators/slug-validator';

describe('SlugGenerationService - Basic Slug Generation', () => {
  it('should generate slug from simple title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Software Engineer');
    expect(slug).toBe('software-engineer');
    expect(isUnique).toBe(true);
  });

  it('should generate slug from title with spaces', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior Frontend Developer');
    expect(slug).toBe('senior-frontend-developer');
  });

  it('should generate slug from title with special characters', async () => {
    const { slug } = await SlugGenerationService.generateSlug('C++ Developer (Remote)');
    expect(slug).toBe('c-developer-remote');
  });

  it('should generate slug from title with numbers', async () => {
    const { slug } = await SlugGenerationService.generateSlug('React Developer 2025');
    expect(slug).toBe('react-developer-2025');
  });

  it('should generate slug from title with mixed case', async () => {
    const { slug } = await SlugGenerationService.generateSlug('JavaScript DEVELOPER');
    expect(slug).toBe('javascript-developer');
  });

  it('should generate slug with unicode characters', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Développeur Frontend');
    // Accept either unicode or ascii equivalent
    expect(slug === 'développeur-frontend' || slug === 'developpeur-frontend').toBe(true);
  });

  it('should generate slug with emoji', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer 🚀');
    expect(slug).toBe('software-engineer');
  });

  it('should generate slug with excessive punctuation', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior!!! Developer???');
    expect(slug).toBe('senior-developer');
  });

  it('should generate slug with multiple spaces', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Software    Engineer');
    expect(slug).toBe('software-engineer');
  });

  it('should generate slug with underscores', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior_Frontend_Developer');
    expect(slug).toBe('senior-frontend-developer');
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

  it('should return error for single character title', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('X');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/short/i);
  });

  it('should return error for empty string', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/required/i);
  });

  it('should return error for whitespace only', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('   ');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/required/i);
  });
});

describe('SlugGenerationService - Uniqueness Resolution', () => {
  let existingSlugs: Set<string>;
  const slugExists = async (slug: string) => existingSlugs.has(slug);

  beforeEach(() => {
    existingSlugs = new Set();
  });

  it('should generate slug for duplicate title (first time)', async () => {
    existingSlugs.clear();
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (second time)', async () => {
    existingSlugs = new Set(['software-engineer']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-1');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (third time)', async () => {
    existingSlugs = new Set(['software-engineer', 'software-engineer-1']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-2');
    existingSlugs.add(uniqueSlug);
  });

  it('should increment counter for existing slug pattern', async () => {
    existingSlugs = new Set([
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
    existingSlugs = new Set(
      Array.from({ length: 1000 }, (_, i) =>
        i === 0 ? 'software-engineer' : `software-engineer-${i}`,
      ),
    );
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toMatch(/^software-engineer-[a-f0-9]{8}$/);
  });

  it('should not consider current job ID as conflict', async () => {
    existingSlugs = new Set(['software-engineer', 'software-engineer-1']);
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
  it('should validate properly formatted slug', () => {
    const result = validateSlug('software-engineer');
    expect(result.isValid).toBe(true);
  });

  it('should fail validation for uppercase slug', () => {
    const result = validateSlug('Software-Engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/lowercase/i);
  });

  it('should fail validation for special characters', () => {
    const result = validateSlug('software_engineer!');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/invalid/i);
  });

  it('should fail validation for spaces', () => {
    const result = validateSlug('software engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for too short slug', () => {
    const result = validateSlug('ab');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/short/i);
  });

  it('should fail validation for too long slug', () => {
    const longSlug = 'a'.repeat(101);
    const result = validateSlug(longSlug);
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/long/i);
  });

  it('should fail validation for leading hyphen', () => {
    const result = validateSlug('-software-engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for trailing hyphen', () => {
    const result = validateSlug('software-engineer-');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for consecutive hyphens', () => {
    const result = validateSlug('software--engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });
});

describe('SlugGenerationService - Reserved Slugs', () => {
  it('should fail or generate alternative for reserved word "admin"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('admin');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

  it('should fail or generate alternative for reserved word "api"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('api');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

  it('should fail or generate alternative for reserved word "jobs"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('jobs');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

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
    const slugExists = async (slug: string) => existingSlugs.has(slug);
    const baseSlug = 'software-engineer';
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
      expect(existingSlugs.has(uniqueSlug)).toBe(false);
      existingSlugs.add(uniqueSlug);
    }
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000); // 2 seconds for 1000 slugs is reasonable
    expect(existingSlugs.size).toBe(1000);
  });

  it('should resolve 100 conflicts efficiently', async () => {
    const existingSlugs = new Set<string>();
    const slugExists = async (slug: string) => existingSlugs.has(slug);
    const baseSlug = 'software-engineer';
    for (let i = 0; i < 100; i++) {
      existingSlugs.add(i === 0 ? baseSlug : `${baseSlug}-${i}`);
    }
    const start = Date.now();
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    const duration = Date.now() - start;
    expect(uniqueSlug).toBe('software-engineer-100');
    expect(duration).toBeLessThan(100); // Should be fast
  });

  it('should generate a single slug in under 100ms', async () => {
    const slugExists = async () => false;
    const start = Date.now();
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      'software-engineer',
      slugExists,
    );
    const duration = Date.now() - start;
    expect(uniqueSlug).toBe('software-engineer');
    expect(duration).toBeLessThan(100);
  });
});
