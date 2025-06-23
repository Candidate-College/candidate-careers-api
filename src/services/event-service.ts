import { Event, EventData } from '@/models/event-model';

exports.getEvents = async (): Promise<EventData[]> => {
  return await Event.query().withGraphFetched('category');
};

exports.getEventByIdentifier = async (
  slug: string,
): Promise<EventData | null> => {
  return await Event.query().findOne({ slug }).withGraphFetched('category');
};

exports.createEvent = async (
  data: Omit<EventData, 'slug'>,
): Promise<EventData> => {
  return await Event.query().insert(data);
};

exports.updateEvent = async (
  slug: string,
  data: Partial<Omit<EventData, 'slug'>>,
): Promise<EventData | null> => {
  return await Event.query().finOne({ slug }).patch(data);
};

exports.deleteEvent = async (
  slug: string
): Promise<number> => {
  return await Event.query().delete().where('slug', slug);
};
