import "@testing-library/jest-dom";

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock global fetch
global.fetch = jest.fn();

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = init.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }
  };
}

if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = init.headers || {};
      this.body = init.body || null;
    }
  };
}

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = jest.fn(() => 'mock-url');
}

console.error = jest.fn();
console.warn = jest.fn();