// In development (NODE_ENV=development in .env), symlink the monorepo's
// experience packages into node_modules/@hestia.ai/.
try {
  const dotenv = require('dotenv')
  dotenv.config()
  if (process.env.NODE_ENV === 'development') {
    const { linkLocalExperiences } = require('../scripts/link-local-experiences.cjs')
    linkLocalExperiences(__dirname)
  }
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    // dev dependencies or the monorepo are absent,
    // e.g. when this package is installed from npm
    process.exit(0)
  }
  throw error
}
