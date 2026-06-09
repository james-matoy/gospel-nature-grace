import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    blog: collection({
      label: 'Blog',
      path: 'src/content/blog/*',
      entryLayout: 'content',
      format: {
        contentField: 'content',
      },
      slugField: 'title',
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
          },
        }),
        date: fields.date({
          label: 'Publication date',
        }),
        cover: fields.image({
          label: 'Cover image',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/blog',
              publicPath: '/images/blog/',
            },
          },
        }),
      },
    }),
  },
});