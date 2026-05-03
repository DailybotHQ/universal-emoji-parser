const path = require('path')
const CleanWebPackPlugin = require('clean-webpack-plugin')

module.exports = (env, argv) => {
  let config = {
    entry: {
      index: {
        import: './src/index.ts',
      },
    },
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: '[name].js',
      publicPath: 'dist/',
      libraryTarget: 'commonjs2',
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: { configFile: 'tsconfig.build.json' },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
      chunkIds: 'size',
      minimize: true,
    },
    plugins: [],
  }

  if (argv && argv.mode === 'production') {
    config.plugins.push(new CleanWebPackPlugin.CleanWebpackPlugin())
  }

  return config
}
