module.exports = (config) => {
  config.set({
    frameworks: ['browserify', 'mocha', 'chai', 'sinon'],
    files: [
      'test/**/*.test.js',
      {
        pattern: 'wasm/bin/dcmjs-native-codecs.wasm',
        included: false,
        watched: false,
        served: true,
      },
    ],
    preprocessors: {
      'test/**/*.test.js': 'browserify',
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
  });
};
