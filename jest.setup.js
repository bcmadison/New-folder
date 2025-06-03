// jest.setup.js
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

HTMLCanvasElement.prototype.getContext = jest.fn(() => null); 