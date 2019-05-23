import Typography from "typography"
import MoragaTheme from "typography-theme-moraga"

MoragaTheme.overrideThemeStyles = () => {
  return {
    "a.gatsby-resp-image-link": {
      boxShadow: `none`,
    },
  }
}

delete MoragaTheme.googleFonts

const typography = new Typography(MoragaTheme)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
