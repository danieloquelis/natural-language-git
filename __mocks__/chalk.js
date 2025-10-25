// Mock chalk for tests - supports chaining
const createChainableMock = () => {
  const mock = {
    cyan: (text) => text,
    green: (text) => text,
    red: (text) => text,
    yellow: (text) => text,
    blue: (text) => text,
    dim: (text) => text,
  };

  // Make bold and underline chainable
  mock.bold = Object.assign((text) => text, {
    underline: (text) => text,
  });

  mock.underline = (text) => text;

  return mock;
};

module.exports = createChainableMock();
module.exports.default = module.exports;
