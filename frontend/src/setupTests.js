// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';


// Polyfill TextEncoder and TextDecoder for Jest environment
if (typeof global.TextEncoder === 'undefined') {
	global.TextEncoder = TextEncoder;
}


// Some environments (like older versions of jsdom) may not have TextDecoder
if (typeof window !== 'undefined' && typeof window.TextEncoder === 'undefined') {
	window.TextEncoder = TextEncoder;
}


// Some environments (like older versions of jsdom) may not have TextDecoder
if (typeof global.TextDecoder === 'undefined') {
	global.TextDecoder = TextDecoder;
}


// Some environments (like older versions of jsdom) may not have TextDecoder
if (typeof window !== 'undefined' && typeof window.TextDecoder === 'undefined') {
	window.TextDecoder = TextDecoder;
}
