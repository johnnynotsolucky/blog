import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

const Changelog = ({ changelog }) => {

  if (changelog.length > 0) {
    return (
      <ul
        style={{
          display: `flex`,
          flexDirection: 'column',
          flexWrap: `wrap`,
          justifyContent: `space-between`,
          listStyle: `none`,
          padding: 0,
          marginLeft: 0,
          fontFamily: ['Montserrat', 'sans-serif'],
          fontSize: '0.8rem',
        }}
      >
        {changelog.map(change => {
          return (<li style={{ marginBottom: 'calc(1.56rem / 4)' }}>
            <span
              style = {{
                padding: '.1em .3em',
                borderRadius: '.3em',
                color: '#0077aa',
                background: '#f9f2f4',
              }}
            >
              {change.date}
            </span>
            <span

            >
            {' '} - {change.message}
            </span>
          </li>)
        })}
      </ul>
    )
  }

  return null
}

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <h1
          style={{ marginBottom: '.1em' }}
        >{post.frontmatter.title}</h1>
        <Changelog changelog={post.frontmatter.changelog} />
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
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
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        tags
        changelog {
          date(formatString: "DD/MM/YYYY HH:mm")
          message
        }
        tags
      }
    }
  }
`
