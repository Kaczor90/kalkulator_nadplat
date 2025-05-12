// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Setup to handle Material UI v7 ripple effect in tests
// Material UI v7 uses requestAnimationFrame for the ripple effect
// This ensures tests work properly with the ripple effect
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
  return 0;
};
