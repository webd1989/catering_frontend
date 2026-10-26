/* =====================================================================
   Mobile card view for ALL tables (Mamu's Infusion ERP)
   ---------------------------------------------------------------------
   Copies each column heading (<th>) into data-label on every <td>, so
   theme-fresh.css can render rows as stacked cards on phones.
   Works with Angular re-renders via MutationObserver. No HTML changes.
   Load in src/index.html after script.js:
     <script src="assets/js/responsive-tables.js"></script>
   ===================================================================== */
(function () {
  'use strict';

  function labelTable(table) {
    var headRow = table.tHead ? table.tHead.rows[0] : null;
    if (!headRow) {
      // tables without <thead>: first row with <th> cells
      var first = table.rows[0];
      if (first && first.querySelector('th')) { headRow = first; }
    }
    if (!headRow) { return; }

    // Build header labels honoring colspan
    var labels = [];
    for (var i = 0; i < headRow.cells.length; i++) {
      var th = headRow.cells[i];
      var text = (th.innerText || th.textContent || '').replace(/\s+/g, ' ').trim();
      var span = th.colSpan || 1;
      for (var k = 0; k < span; k++) { labels.push(text); }
    }
    table.classList.add('mi-responsive');

    var body = table.tBodies.length ? table.tBodies[0] : table;
    var rows = body.rows;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row === headRow) { continue; }
      var col = 0;
      var cells = row.cells;
      // a row made of one wide cell (pagination / "no records") → full width
      if (cells.length === 1 && (cells[0].colSpan || 1) > 1) {
        row.classList.add('mi-row-full');
        continue;
      }
      for (var c = 0; c < cells.length; c++) {
        var td = cells[c];
        var label = labels[col] || '';
        if (td.getAttribute('data-label') !== label) { td.setAttribute('data-label', label); }
        // Action column: no label, buttons in a row
        if (/^(action|actions|#|s\.?\s?no\.?)$/i.test(label)) {
          td.classList.add(/action/i.test(label) ? 'mi-cell-actions' : 'mi-cell-index');
        }
        col += td.colSpan || 1;
      }
    }
  }

  function run(root) {
    var tables = (root || document).querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) { labelTable(tables[i]); }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) { return; }
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(function () { scheduled = false; run(); }, 50);
  }

  document.addEventListener('DOMContentLoaded', function () {
    run();
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) { schedule(); return; }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });

  // expose for manual calls if ever needed
  window.miResponsiveTables = run;
})();
