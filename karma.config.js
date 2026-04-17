module.exports = (config) => {
  config.set({
    autoWatch: false,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    browsers: ['ChromeHeadless'],
    colors: true,
    concurrency: Infinity,
    files: [
      'test/**/*.test.js',
      {
        included: false,
        pattern: 'wasm/bin/dcmjs-native-codecs.wasm',
        served: true,
        watched: false,
      },
    ],
    flags: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--remote-debugging-port=9222',
    ],
    frameworks: ['browserify', 'mocha', 'chai', 'sinon'],
    logLevel: config.LOG_INFO,
    port: 9876,
    preprocessors: {
      'test/**/*.test.js': 'browserify',
    },
    reporters: ['mocha'],
    singleRun: true,
  });
};
