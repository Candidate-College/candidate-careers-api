module.exports = {
  slug: { type: 'string', in: 'param' },

  /* identity form */
  email: { type: 'email' },
  name: { type: 'string' },
  domicile: { type: 'text' },
  university: { type: 'string' },
  major: { type: 'string' },
  semester: { type: 'number', max: 16 },
  whatsapp: { type: 'string', max: 16 },

  /* social media form */
  instagram: { type: 'url' },
  tiktok: { type: 'url' },
  x: { type: 'url' },
  linkedin: { type: 'url' },

  /* following CC form */
  candidate_college_ig: { type: 'image' },
  sekolah_menulis_ig: { type: 'image' },
  mindful_journey_ig: { type: 'image' },
  sequoia_ig: { type: 'image' },
  candidate_college_tiktok: { type: 'image' },
  candidate_college_x: { type: 'image' },

  /* test json */
  // identity: {
  //   type: 'object',
  //   fields: {
  //     email: { type: 'email' },
  //     name: { type: 'string' },
  //     domicile: { type: 'text' },
  //     university: { type: 'string' },
  //     major: { type: 'string' },
  //     semester: { type: 'number', max: 16 },
  //     whatsapp: { type: 'string', max: 16 },
  //   },
  // },

  // social_media: {
  //   type: 'object',
  //   fields: {
  //     instagram: { type: 'url' },
  //     tiktok: { type: 'url' },
  //     x: { type: 'url' },
  //     linkedin: { type: 'url' },
  //   },
  // },

  // image: {
  //   type: 'object',
  //   // optional: true,
  //   fields: {
  //     candidateCollegeIg: { type: 'image' },
  //     candidateCollegeTiktok: { type: 'image' },
  //     candidateCollegeX: { type: 'image' },
  //     sekolahMenulisIg: { type: 'image' },
  //     mindfulJourneyIg: { type: 'image' },
  //     sequoiaIg: { type: 'image' },
      
  //     batches: {
  //       type: 'array',
  //       items: [
  //         { type: 'string' },
  //         { type: 'object',
  //           fields: {
  //             name: { type: 'string' },
  //           },
  //         },
  //       ],
  //     },

  //     inferences: {
  //       type: 'array',
  //       items: { type: 'string' },
  //     },
  //   },
  // },
};
