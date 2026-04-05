// ─── EXCALIBUR OS — Router & Navigation ─────────────────────────
// Section navigation, sub-tab dispatch, master draw()

EXC.modules = {};

EXC.register = function(name, mod) {
  EXC.modules[name] = mod;
};

EXC.go = function(section) {
  EXC.S.section = section;
  EXC.save();
  EXC.draw();
};

EXC.draw = function() {
  computeToday();

  var section = EXC.S.section || 'dashboard';
  var mod = EXC.modules[section];

  // Update header
  var hdrTitle = document.getElementById('hdr-title');
  var hdate = document.getElementById('hdate');
  if (hdrTitle && mod) hdrTitle.textContent = mod.title || section;
  if (hdate) {
    var logicalDate = new Date(TODAY + 'T12:00:00');
    var dateStr = logicalDate.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
    var prewake = isPreWake();
    hdate.textContent = dateStr + (prewake ? ' \u00b7 \ud83c\udf19 Pre-wake' : '');
  }

  // Render sub-tabs
  var tabsEl = document.getElementById('sub-tabs');
  if (tabsEl && mod && mod.tabs && mod.tabs.length > 0) {
    var subTab = mod.subTab || (mod.tabs[0] && mod.tabs[0].id);
    var h = '';
    mod.tabs.forEach(function(t) {
      h += '<button class="tab' + (t.id === subTab ? ' active' : '') + '" onclick="EXC.goSub(\'' + t.id + '\')">' +
           t.icon + ' ' + t.label + '</button>';
    });
    tabsEl.innerHTML = h;
    tabsEl.style.display = 'flex';
  } else if (tabsEl) {
    tabsEl.innerHTML = '';
    tabsEl.style.display = 'none';
  }

  // Render main content
  var mainEl = document.getElementById('main');
  if (mainEl && mod && mod.render) {
    mainEl.innerHTML = mod.render();
    if (mod.afterRender) mod.afterRender();
  } else if (mainEl) {
    mainEl.innerHTML = '<div class="empty"><div class="empty-icon">&#128679;</div>Module loading...</div>';
  }

  // Update bottom nav
  updateBottomNav(section);
};

EXC.goSub = function(subTab) {
  var section = EXC.S.section || 'dashboard';
  var mod = EXC.modules[section];
  if (mod) {
    mod.subTab = subTab;
    EXC.save();
    EXC.draw();
  }
};

function updateBottomNav(activeSection) {
  var nav = document.getElementById('bottom-nav');
  if (!nav) return;
  var btns = nav.querySelectorAll('.nav-btn');
  for (var i = 0; i < btns.length; i++) {
    var isActive = btns[i].getAttribute('data-section') === activeSection;
    btns[i].classList.toggle('active', isActive);
  }
}

// ─── Settings (placeholder) ────────────────────────────────────

EXC.openSettings = function() {
  var root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = '<div class="modal-bg" onclick="EXC.closeModal()">' +
    '<div class="modal" onclick="event.stopPropagation()">' +
    '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700;color:#f0f0ff">Settings</span>' +
    '<button onclick="EXC.closeModal()" style="font-size:18px;color:#555">&times;</button></div>' +
    '<div class="flabel">Wake Time</div>' +
    '<input type="time" class="finput" value="' + EXC.S.wakeTime + '" onchange="EXC.S.wakeTime=this.value;EXC.save();">' +
    '<div class="flabel">Bed Time</div>' +
    '<input type="time" class="finput" value="' + EXC.S.bedTime + '" onchange="EXC.S.bedTime=this.value;EXC.save();">' +
    '<div style="margin-top:12px"><button class="btn-sec" onclick="EXC.exportData()">Export All Data</button></div>' +
    '<div><button class="btn-sec" onclick="EXC.importData()">Import Data</button></div>' +
    '<div style="margin-top:16px;text-align:center;font-size:9px;color:#333">Excalibur OS v1.0</div>' +
    '</div></div>';
};

EXC.closeModal = function() {
  var root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
};

// ─── INIT ──────────────────────────────────────────────────────

(function() {
  EXC.load();
  computeToday();

  // Migrate: enable MgT second dose by default (from biohack-os)
  if (!EXC.S.supp.secondDose) EXC.S.supp.secondDose = {};
  if (!EXC.S.supp.secondDoseTiming) EXC.S.supp.secondDoseTiming = {};
  if (EXC.S.supp.secondDose['mgt'] === undefined) { EXC.S.supp.secondDose['mgt'] = true; EXC.save(); }
  if (!EXC.S.supp.secondDoseTiming['mgt']) { EXC.S.supp.secondDoseTiming['mgt'] = 'bedtime'; EXC.save(); }

  // Handle ?section= deep links
  var p = new URLSearchParams(location.search);
  if (p.get('section')) EXC.S.section = p.get('section');

  // Initial draw on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { EXC.draw(); });
  } else {
    EXC.draw();
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function(e) {
      console.warn('SW registration failed:', e);
    });
  }

  // Periodic refresh (update times, readiness, etc.)
  setInterval(function() { EXC.draw(); }, 60000);
})();
