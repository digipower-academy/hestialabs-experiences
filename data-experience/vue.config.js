import webpack from 'webpack'
import { defineConfig } from '@vue/cli-service'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { readdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const isDev = process.env.NODE_ENV === 'development'

// resolve every @hestia.ai/<experience> import to the local monorepo package
const experiencesDir = path.resolve(__dirname, '../packages/packages/experiences')
const experienceAliases = Object.fromEntries(
  readdirSync(experiencesDir).map(name => [`@hestia.ai/${name}`, path.join(experiencesDir, name)])
)

export default defineConfig({
  publicPath: isDev ? '/' : './',
  devServer: {
    allowedHosts: 'all',
    port: 8080
  },
  configureWebpack: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, 'src'),
        '@': path.resolve(__dirname, 'src'),
        // https://github.com/micromatch/picomatch/pull/23
        picomatch: 'picomatch-browser',
        ...experienceAliases
      },
      fallback: {
        fs: false,
        crypto: false, // require.resolve("crypto-browserify") to add polyfill
        path: require.resolve('path-browserify'),
        util: require.resolve('util/')
      }
    },
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                inline: 'fallback',
                filename: '[name].[contenthash:7].js'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        // for init() in sql.js
        'process.release': {}
      })
    ],
    experiments: {
      topLevelAwait: true
    }
  },
  // Fix issue when project path has a special symbol like '(' or ')'.
  // Bug of copy-webpack-plugin or fast-glob, because cli will add the absolute path of the index.html
  // in the public folder to the ignore list, if the path has a special symbol, copy-webpack-plugin will
  // not match the path and will not ignore it. Therefore index.html will emit twice.
  // source: https://github.com/vuejs/vue-cli/issues/7043#issuecomment-1069791347
  chainWebpack: (config) => {
    if (isDev) {
      config.plugin('copy').tap((args) => {
        const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g
        const publicDir = path.resolve(process.VUE_CLI_SERVICE.context, 'public').replace(/\\/g, '/')
        const escapePublicDir = publicDir.replace(UNESCAPED_GLOB_SYMBOLS_RE, '\\$2')
        args[0].patterns[0].globOptions.ignore = args[0].patterns[0].globOptions.ignore.map(i => i.replace(publicDir, escapePublicDir))
        return args
      })
    }
  },
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true,
      enableBridge: false
    }
  }
})
