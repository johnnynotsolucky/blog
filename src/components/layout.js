import React from "react"
import { Link, StaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm, scale } from "../utils/typography"

const Avatar = ({ width = 30}) =>
  <StaticQuery
    query={bioQuery}
    render={data => {
      const { author } = data.site.siteMetadata
      return (
        <div>
          <Image
            fixed={data.avatar.childImageSharp.fixed}
            alt={author}
            style={{
              marginRight: rhythm(1 / 2),
              marginBottom: 0,
              borderRadius: `100%`,
              width,
              height: width,
              minWidth: width,
            }}
            imgStyle={{
              borderRadius: `50%`,
            }}
          />
        </div>
      )
    }}
  />

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
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
          <Avatar width={50} />
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
          <Avatar />
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
        <StaticQuery
          query={bioQuery}
          render={data => {
            const { social } = data.site.siteMetadata
            return (
              <footer>
                © {new Date().getFullYear()} <a href={`https://twitter.com/${social.twitter}`}>{social.twitter}</a>. Built with
                {` `}
                <a href="https://www.gatsbyjs.org">Gatsby</a>
              </footer>
            )
          }}
        />
      </div>
    )
  }
}

const bioQuery = graphql`
  query AvatarQuery {
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
