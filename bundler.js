const Bundler = require('parcel-bundler')
const Path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

const options = {
  outDir: './dist',
  outFile: 'index.html',
  publicUrl: '/',
  watch: !isProduction,
  cache: true,
  autoInstall: true,
}

const bundler = new Bundler(
  [
	Path.join(__dirname, './_site/**/*.html'),
  ],
  options,
)

if (isProduction) {
  (async function () {
    await bundler.bundle()
  })();
} else {
  const app = require('express')()
  const fs = require('fs')
  // Hacky :sad_face:
  async function serveIndexHtml (req, res, next) {
    let url = req.url
    const pathToAsset = Path.join(__dirname, options.outDir, url)
    if (fs.existsSync(pathToAsset) && fs.lstatSync(pathToAsset).isDirectory()) {
      req.url = `${url}/index.html`
    }
    next()
  }

  app.use(serveIndexHtml)
  app.use(bundler.middleware())
  app.listen(8080)
}
