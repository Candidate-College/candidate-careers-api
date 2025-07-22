jest.mock('slugify', () => () => {
  throw new Error('Internal error');
});

import SlugGenerationService from '../../../src/services/slug-generation-service';

describe('SlugGenerationService - Error Handling (Mocked)', () => {
  it('should handle service failure during slug generation', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('Software Engineer');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/internal error/i);
  });
});

describe('SlugGenerationService - Error Handling (General)', () => {
  it('should handle invalid title input to slug service', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug(null as any);
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/required/i);
  });

  it('should handle database connection failure during validation', async () => {
    const slugExists = async (_slug: string) => {
      throw new Error('DB connection failed');
    };
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer');
    await expect(SlugGenerationService.ensureUniqueness(slug, slugExists)).rejects.toThrow(
      'DB connection failed',
    );
  });

  it('should handle slug service timeout', async () => {
    // Simulate a timeout by passing a slugExists that never resolves
    const slugExists = (_slug: string) => new Promise<boolean>(() => {});
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer');
    const promise = SlugGenerationService.ensureUniqueness(slug, slugExists);
    // Use Promise.race to simulate timeout
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100));
    await expect(Promise.race([promise, timeout])).rejects.toThrow('Timeout');
  });
});
