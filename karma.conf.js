module.exports = function(config) {
  config.set({
    frameworks: ['browserify', 'jasmine'],
    files: [
      'src/**/*.js',
      'test/**/*_spec.js'
    ],
    preprocessors: {
      'src/**/*.js': ['jshint', 'browserify'],
      'test/**/*.js': ['jshint', 'browserify']
    },
    browsers: ['Chrome'],
    browserify: {
      debug: true,
      bundleDelay: 2000
    }
  });
};
