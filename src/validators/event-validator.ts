module.exports = {
  category_id: { type: 'number' },
  title: { type: 'string' },
  snippet: { type: 'string', optional: true },
  content: { type: 'text' },
  cover: { type: 'image', optional: true },
  starts_at: { type: 'timestamp' },
  ends_at: { type: 'timestamp' },

  // Pagination
  page: { type: 'number', in: 'query' },
  perPage: { type: 'number', in: 'query' },

  // Filter
  sortBy: {
    type: 'string',
    in: 'query',
    value: { only: ['starts_at', 'ends_at'] },
  },
  sortDirection: {
    type: 'string',
    in: 'query',
    value: { only: ['asc', 'desc'] },
  },

  slug: { type: 'string', in: 'param' },

  // additional_informations: {
  //   type: 'json',
  //   nested: {
  //     '*.location': { type: 'string' },
  //   },
  //   optional: true,
  // },
};
