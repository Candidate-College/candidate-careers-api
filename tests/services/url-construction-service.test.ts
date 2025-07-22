import URLConstructionService from '../../src/services/url-construction-service';

describe('URLConstructionService', () => {
  it('should generate public URL from slug', () => {
    const url = URLConstructionService.generatePublicURL({ slug: 'software-engineer' });
    expect(url).toMatch(/\/jobs\/software-engineer$/);
  });

  it('should generate admin URL from UUID', () => {
    const url = URLConstructionService.generateAdminURL({
      uuid: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(url).toMatch(/\/job-postings\/123e4567-e89b-12d3-a456-426614174000$/);
  });

  it('should generate shareable URL with tracking', () => {
    const url = URLConstructionService.generateShareableURL({
      slug: 'software-engineer',
      trackingParams: { utm_source: 'newsletter', utm_campaign: 'spring2025' },
    });
    expect(url).toMatch(/utm_source=newsletter/);
    expect(url).toMatch(/utm_campaign=spring2025/);
  });

  it('should handle empty trackingParams gracefully', () => {
    const url = URLConstructionService.generateShareableURL({
      slug: 'software-engineer',
      trackingParams: {},
    });
    expect(url).toMatch(/\/jobs\/software-engineer$/);
  });

  it('should throw error for invalid slug in public URL', () => {
    expect(() => URLConstructionService.generatePublicURL({ slug: '' })).toThrow();
  });

  it('should throw error for invalid uuid in admin URL', () => {
    expect(() => URLConstructionService.generateAdminURL({ uuid: '' })).toThrow();
  });

  it('should throw error for invalid slug in shareable URL', () => {
    expect(() => URLConstructionService.generateShareableURL({ slug: '' })).toThrow();
  });
});
