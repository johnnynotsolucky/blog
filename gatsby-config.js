module.exports = {
  siteMetadata: {
    title: `blog.tyrone.dev`,
    author: `Tyrone Tudehope`,
    description: `Blog`,
    siteUrl: `https://blog.tyrone.dev/`,
    social: {
      twitter: `tyronetudehope`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          'gatsby-remark-code-titles',
          'gatsby-remark-graphviz',
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: "gatsby-remark-embed-gist",
            options: {
              username: 'johnnynotsolucky',
              includeDefaultCss: true
            }
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: 'gatsby-plugin-feed-generator',
      options: {
        generator: `GatsbyJS`,
        rss: true, // Set to false to stop rss generation
        json: true, // Set to false to stop json feed generation
        siteQuery: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                author
              }
            }
          }
        `,
        feeds: [
          {
            name: 'feed', // This determines the name of your feed file => feed.json & feed.xml
            query: `
            {
              allMarkdownRemark(
                sort: {order: DESC, fields: [frontmatter___date]},
                filter: {
                  frontmatter: {published: {eq: true}}
                }
                limit: 100,
                ) {
                edges {
                  node {
                    html
                    fields {
                      slug
                    }
                    frontmatter {
                      date
                      title
                    }
                  }
                }
              }
            }
            `,
            normalize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.edges.map(edge => {
                return {
                  title: edge.node.frontmatter.title,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  html: edge.node.html,
                }
              })
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `blog.tyrone.dev`,
        short_name: `tyrone.dev blog`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `content/assets/gatsby-icon.png`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    `gatsby-plugin-catch-links`,
  ],
}
