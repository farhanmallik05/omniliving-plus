import '@testing-library/jest-dom';

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

// Polyfill EventSource
class MockEventSource {
  onmessage = null;
  onerror = null;
  close() {}
}
(window as any).EventSource = MockEventSource;
(globalThis as any).EventSource = MockEventSource;

// Polyfill HTMLMediaElement play & pause
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

// Polyfill SpeechSynthesis
const mockSpeechSynthesis = {
  speak: () => {},
  cancel: () => {},
  pause: () => {},
  resume: () => {},
  getVoices: () => []
};
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
});

// Polyfill navigator.vibrate
Object.defineProperty(window.navigator, 'vibrate', {
  writable: true,
  value: () => true
});

// Polyfill AudioContext
class MockAudioContext {
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      }
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      }
    };
  }
  destination = {};
  currentTime = 0;
  resume = async () => {};
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext
});

// Polyfill fetch
(globalThis as any).fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ rules: [], status: 'ok' })
  } as any);
