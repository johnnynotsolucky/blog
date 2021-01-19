import React from "react"
import { Link, StaticQuery, graphql } from "gatsby"
import Avatar from './Avatar'

import { rhythm, scale } from "../utils/typography"

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`

    return (
      <StaticQuery
        query={query}
        render={data => {
          let header
          if (location.pathname === rootPath) {
            header = (
              <h1
                style={{
                  ...scale(1),
                  display: 'flex',
                  fontFamily: `Montserrat, sans-serif`,
                  marginBottom: rhythm(1),
                  marginTop: 0,
                }}
              >
                <Avatar data={data} width={50} />
                <Link
                  style={{
                    boxShadow: `none`,
                    textDecoration: `none`,
                    color: `inherit`,
                  }}
                  to={`/`}
                >
                  {title}
                </Link>
              </h1>
            )
          } else {
            header = (
              <h3
                style={{
                  display: 'flex',
                  fontFamily: `Montserrat, sans-serif`,
                  lineHeight: '1.25em',
                  marginTop: 0,
                }}
              >
                <Avatar data={data} />
                <Link
                  style={{
                    boxShadow: `none`,
                    textDecoration: `none`,
                    color: `inherit`,
                  }}
                  to={`/`}
                >
                  {title}
                </Link>
              </h3>
            )
          }

          const { social } = data.site.siteMetadata

          return (
            <div
              style={{
                marginLeft: `auto`,
                marginRight: `auto`,
                maxWidth: rhythm(40),
                padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
              }}
            >
              <header>{header}</header>
              <main>{children}</main>
              <footer>
                © {new Date().getFullYear()} <a href={`https://twitter.com/${social.twitter}`}>{social.twitter}</a>. Built with
                {` `}
                <a href="https://www.gatsbyjs.org">Gatsby</a>
              </footer>
            </div>
          )
        }}
      />
    )
  }
}

const query = graphql`
  query LayoutQuery {
    avatar: file(absolutePath: { regex: "/avatar.jpg/" }) {
      childImageSharp {
        fixed(width: 50, height: 50) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        social {
          twitter
        }
      }
    }
  }
`

export default Layout
