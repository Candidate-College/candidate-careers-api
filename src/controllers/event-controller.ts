import { Request } from 'express';
import { JsonResponse } from '@/types/express-extension';

const logger = require('@/utilities/logger');
const toResource = require('@/utilities/resource');
const eventService = require('@/services/event-service');
const eventResource = require('@/resources/event-resource');

exports.index = async (req: Request, res: JsonResponse) => {
  try {
    const data = await eventService.getEvents();

    return res.success('Successfully get events!', await toResource(data, eventResource));
  } catch (error: any) {
    logger.error(error);
    return res.error();
  }
};

exports.show = async (req: Request, res: JsonResponse) => {
  const { slug } = req.params;

  try {
    const data = await eventService.getEventByIdentifier(slug);
    if (!data) {
      return res.error(404, 'Event not found');
    }

    return res.success('Successfully get event by identifier!', await toResource(data, eventResource));
  } catch (error: any) {
    logger.error(error);
    return res.error();
  }
};

exports.store = async (req: Request, res: JsonResponse) => {
  try {
    const data = await eventService.createEvent(req.body);

    return res.success('Successfully create an event!', await toResource(data, eventResource));
  } catch (error: any) {
    logger.error(error);
    return res.error();
  }
};

exports.update = async (req: Request, res: JsonResponse) => {
  const { slug } = req.params;

  try {
    if (!await eventService.getEventByIdentifier(slug)) {
      return res.error(404, 'Event not found');
    }

    const data = await eventService.updateEvent(slug, req.body);

    return res.success('Successfully update an event!', await toResource(data, eventResource));
  } catch (error: any) {
    logger.error(error);
    return res.error();
  }
};

exports.destroy = async (req: Request, res: JsonResponse) => {
  const { slug } = req.params;

  try {
    if (!await eventService.getEventByIdentifier(slug)) {
      return res.error(404, 'Event not found');
    }

    const data = await eventService.deleteEvent(slug);

    return res.success(
      'Successfully delete an event!',
      { ...await toResource(data, eventResource), deleted_at: data.deleted_at },
    );
  } catch (error: any) {
    logger.error(error);
    return res.error();
  }
};
