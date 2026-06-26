import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*',
      schema: {
        name: fields.slug({ name: { label: 'Category Name' } }),
      },
    }),
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
        description: fields.text({
          label: 'Description',
          multiline: true,
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
        category: fields.relationship({
          label: 'Blog Category',
          collection: 'categories',
          validation: { isRequired: true },
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
        category: fields.relationship({
          label: 'Page Category',
          collection: 'categories',
        }),
      },
    }),
  },
});
