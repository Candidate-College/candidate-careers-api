import SlugGenerationService from '../../../src/services/slug-generation-service';
import { SlugHistoryService } from '../../../src/services/slug-history-service';
import URLConstructionService from '../../../src/services/url-construction-service';

describe('SlugGenerationService - Integration Testing', () => {
  let db: { id: number; title: string; slug: string }[];
  let history: any[];
  let jobId = 1;

  const slugExists = async (slug: string, excludeJobId?: number | null) => {
    return db.some(j => j.slug === slug && (!excludeJobId || j.id !== excludeJobId));
  };
  const trackSlugChange = async (
    jobId: number,
    oldSlug: string,
    newSlug: string,
    reason: string,
  ) => {
    history.push({ jobId, oldSlug, newSlug, reason });
  };
  const getHistory = async (jid: number) => history.filter(h => h.jobId === jid);
  const findBySlug = async (slug: string) => {
    const found = history.find(h => h.oldSlug === slug || h.newSlug === slug);
    if (!found) return null;
    const job = db.find(j => j.id === found.jobId);
    return job ? { jobPostingId: job.id, currentSlug: job.slug } : null;
  };

  beforeEach(() => {
    db = [];
    history = [];
    jobId = 1;
  });

  it('should create job with automatic slug generation', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Software Engineer');
    expect(isUnique).toBe(true);
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
    db.push({ id: jobId, title: 'Software Engineer', slug: uniqueSlug });
    expect(db[0].slug).toBe('software-engineer');
  });

  it('should update job and trigger slug regeneration with history', async () => {
    db.push({ id: jobId, title: 'Software Engineer', slug: 'software-engineer' });
    const newSlug = await SlugGenerationService.regenerateSlug(
      jobId,
      'Senior Frontend Developer',
      slugExists,
      trackSlugChange,
      'software-engineer',
    );
    db[0].slug = newSlug;
    expect(db[0].slug).toBe('senior-frontend-developer');
    expect(history.length).toBe(1);
    expect(history[0].oldSlug).toBe('software-engineer');
    expect(history[0].newSlug).toBe('senior-frontend-developer');
  });

  it('should access job via public slug URL', () => {
    db.push({ id: jobId, title: 'Software Engineer', slug: 'software-engineer' });
    const url = URLConstructionService.generatePublicURL({ slug: db[0].slug });
    expect(url).toMatch(/\/jobs\/software-engineer$/);
  });

  it('should redirect from historical slug', async () => {
    db.push({ id: jobId, title: 'Software Engineer', slug: 'senior-frontend-developer' });
    history.push({
      jobId,
      oldSlug: 'software-engineer',
      newSlug: 'senior-frontend-developer',
      reason: 'title_update',
    });
    const found = await SlugHistoryService.findJobByHistoricalSlug('software-engineer', findBySlug);
    expect(found).not.toBeNull();
    expect(found?.currentSlug).toBe('senior-frontend-developer');
  });
});
