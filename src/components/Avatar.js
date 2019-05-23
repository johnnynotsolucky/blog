
import React from "react"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

const Avatar = ({ data, width = 30}) => {
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
}


export default Avatar

