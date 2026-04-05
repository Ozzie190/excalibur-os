// ─── REST TIMER WEB WORKER ───────────────────────────────────
// Runs in background thread so timer survives phone backgrounding.
// Communicates with main thread via postMessage.

var timer = null;
var remaining = 0;

self.onmessage = function(e) {
  if (e.data.cmd === 'start') {
    remaining = e.data.seconds;
    if (timer) clearInterval(timer);
    timer = setInterval(function() {
      remaining--;
      self.postMessage({ type: 'tick', remaining: remaining });
      if (remaining <= 0) {
        clearInterval(timer);
        timer = null;
        self.postMessage({ type: 'done' });
      }
    }, 1000);
  }

  if (e.data.cmd === 'stop') {
    if (timer) clearInterval(timer);
    timer = null;
    remaining = 0;
    self.postMessage({ type: 'stopped' });
  }
};
