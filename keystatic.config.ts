import { config, fields, collection, singleton } from '@keystatic/core';

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
    pages: collection({
      label: 'Pages',
      path: 'src/content/pages/*',
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
        cover: fields.image({
          label: 'Cover image',
          directory: 'public/images/pages',
          publicPath: '/images/pages/',
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/pages',
              publicPath: '/images/pages/',
            },
          },
        }),
      },
    }),
  },
});