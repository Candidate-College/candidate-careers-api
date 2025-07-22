import SlugGenerationService from '../../../src/services/slug-generation-service';

describe('SlugGenerationService - SEO Optimization', () => {
  it('should remove stop words from slug', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug(
      'The Best Software Engineer',
      { removeStopWords: true },
    );
    expect(slug).toBe('best-software-engineer');
    expect(isUnique).toBe(true);
  });

  it('should maintain important keywords in slug', async () => {
    const { slug } = await SlugGenerationService.generateSlug(
      'Senior React Developer for Analytics Platform',
      { removeStopWords: true },
    );
    // Should contain at least 'react' and 'developer'
    expect(slug).toMatch(/react/);
    expect(slug).toMatch(/developer/);
  });

  it('should optimize slug length for SEO best practices', async () => {
    const longTitle =
      'Senior Frontend Developer with Experience in React, Vue, Angular, Svelte, and Modern Web Technologies for Large Scale Applications';
    const { slug, isUnique } = await SlugGenerationService.generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug.length).toBeGreaterThanOrEqual(3);
    expect(isUnique).toBe(true);
  });
});
