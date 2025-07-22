import { SlugHistoryService } from '../../../src/services/slug-history-service';
import { SlugChangeReason } from '../../../src/interfaces/slug/slug-history';

describe('SlugHistoryService', () => {
  let history: any[];
  let jobId = 1;
  let currentSlug = 'software-engineer';

  const createHistory = async (record: any) => {
    history.push({
      id: history.length + 1,
      ...record,
      createdAt: new Date(),
    });
  };
  const getHistory = async (jid: number) => history.filter(h => h.jobPostingId === jid);
  const findBySlug = async (slug: string) => {
    const found = history.find(h => h.oldSlug === slug || h.newSlug === slug);
    return found ? { jobPostingId: found.jobPostingId, currentSlug } : null;
  };

  beforeEach(() => {
    history = [];
    jobId = 1;
    currentSlug = 'software-engineer';
  });

  it('should track slug creation in history', async () => {
    await SlugHistoryService.trackSlugChange(
      jobId,
      null,
      'software-engineer',
      'creation',
      null,
      createHistory,
    );
    expect(history.length).toBe(1);
    expect(history[0].changeReason).toBe('creation');
    expect(history[0].oldSlug).toBeNull();
    expect(history[0].newSlug).toBe('software-engineer');
  });

  it('should track slug change in history', async () => {
    await SlugHistoryService.trackSlugChange(
      jobId,
      'software-engineer',
      'senior-frontend-developer',
      'title_update',
      null,
      createHistory,
    );
    expect(history.length).toBe(1);
    expect(history[0].changeReason).toBe('title_update');
    expect(history[0].oldSlug).toBe('software-engineer');
    expect(history[0].newSlug).toBe('senior-frontend-developer');
  });

  it('should retrieve complete slug history for job', async () => {
    await SlugHistoryService.trackSlugChange(
      jobId,
      null,
      'software-engineer',
      'creation',
      null,
      createHistory,
    );
    await SlugHistoryService.trackSlugChange(
      jobId,
      'software-engineer',
      'senior-frontend-developer',
      'title_update',
      null,
      createHistory,
    );
    const result = await SlugHistoryService.getSlugHistory(jobId, getHistory);
    expect(result.length).toBe(2);
    expect(result[0].changeReason).toBe('creation');
    expect(result[1].changeReason).toBe('title_update');
  });

  it('should find job by historical slug', async () => {
    await SlugHistoryService.trackSlugChange(
      jobId,
      null,
      'software-engineer',
      'creation',
      null,
      createHistory,
    );
    await SlugHistoryService.trackSlugChange(
      jobId,
      'software-engineer',
      'senior-frontend-developer',
      'title_update',
      null,
      createHistory,
    );
    currentSlug = 'senior-frontend-developer';
    const found = await SlugHistoryService.findJobByHistoricalSlug('software-engineer', findBySlug);
    expect(found).not.toBeNull();
    expect(found?.jobPostingId).toBe(jobId);
    expect(found?.currentSlug).toBe('senior-frontend-developer');
  });

  it('should return null for non-existent historical slug', async () => {
    await SlugHistoryService.trackSlugChange(
      jobId,
      null,
      'software-engineer',
      'creation',
      null,
      createHistory,
    );
    const found = await SlugHistoryService.findJobByHistoricalSlug('non-existent-slug', findBySlug);
    expect(found).toBeNull();
  });
});
