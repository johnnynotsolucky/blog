import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../../components/layout"
import SEO from "../../components/seo"
import { rhythm } from "../../utils/typography"

import Changelog from '../../components/Changelog'

class DraftIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = `${data.site.siteMetadata.title} - work in progress`
    console.log(JSON.stringify(data, null, 2))
    const posts = data.allMarkdownRemark.edges

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title="work in progress"
        />
        {posts
          .filter(({ node }) => !node.frontmatter.published)
          .map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <div key={node.fields.slug}>
              <h3
                style={{
                  marginBottom: rhythm(1 / 4),
                }}
              >
                <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
                  {title}
                </Link>
              </h3>
              <p
                style={{marginBottom: '0'}}
                dangerouslySetInnerHTML={{
                  __html: node.frontmatter.description || node.excerpt,
                }}
              />
              <Changelog
                changelog={node.frontmatter.changelog}
                limit={true}
                reverse={true}
              />
            </div>
          )
        })}
      </Layout>
    )
  }
}

export default DraftIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: {
        fields: [frontmatter___date],
        order: DESC,
      }
      filter: {
        frontmatter: {published: {eq: false}}
      }
      limit: 1000
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date
            title
            description
            changelog {
              date(formatString: "DD/MM/YYYY")
              message
            }
            tags
            published
          }
        }
      }
    }
  }
`

