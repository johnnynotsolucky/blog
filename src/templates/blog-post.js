import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

import Changelog from '../components/Changelog'


class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    const trimmedSlug = this.props.pageContext.slug.replace(/(^\/)|(\/$)/g, '')

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <h1
          style={{ marginBottom: '.25em' }}
        >{post.frontmatter.title}</h1>
        <Changelog changelog={post.frontmatter.changelog} />
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <div
          style={{
            marginBottom: '1.5em',
						fontSize: '1.05rem',
          }}
        >
          <a
            className='suggestion'
            href={`https://github.com/johnnynotsolucky/blog/issues/new?title=[${trimmedSlug}]`}
          >
            <span style={{ marginLeft: '.25em' }}>
              Make a suggestion
            </span>
          </a>
        </div>
        <hr
          style={{
            marginBottom: rhythm(1),
          }}
        />

        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(
      fields: { slug: { eq: $slug } }
    ) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date
        description
        tags
        changelog {
          date(formatString: "DD/MM/YYYY")
          message
        }
        published
        tags
      }
    }
  }
`
