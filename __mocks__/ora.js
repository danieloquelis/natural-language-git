// Mock ora for tests
const ora = (options) => ({
  text: options?.text || '',
  spinner: options?.spinner || 'dots',
  start: () => {},
  stop: () => {},
  succeed: () => {},
  fail: () => {},
  isSpinning: false,
});

module.exports = ora;
module.exports.default = ora;
