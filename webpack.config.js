const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/renderer/index.jsx',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'bundle.js',
      publicPath: '/'
    },
    target: 'web', // electron-renderer 대신 web 사용 (HMR 호환성)
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: { // resolve 블록 하나로 통합
      extensions: ['.js', '.jsx'],
      alias: {
        'process/browser': 'process/browser.js'
      },
      fallback: {
        "global": require.resolve("global"),
        "events": require.resolve("events/"),
        "crypto": require.resolve("crypto-browserify"),
        "buffer": require.resolve("buffer/"),
        "stream": require.resolve("stream-browserify"),
        "process": require.resolve("process/browser.js")
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html'
      }),
      // global 변수 폴리필 추가
      new (require('webpack').ProvidePlugin)({
        global: 'global',
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js'
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'build')
      },
      port: 3001,
      hot: true,
      historyApiFallback: true
    },
    devtool: isDevelopment ? 'source-map' : false
  };
};
