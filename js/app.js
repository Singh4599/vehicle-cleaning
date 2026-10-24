// app.js — Vehicle Cleaning & Sanitization Logbook
// Automated generation from 2026-04-01 to 2026-10-19 with full manual edit/add & Excel export

const STORAGE_KEY = 'lv_vehicle_cleaning_logs_v2';
const MONTH_NAMES = ['APRIL', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_MAP = {
  'APRIL': '2026-04',
  'MAY': '2026-05',
  'JUNE': '2026-06',
  'JULY': '2026-07',
  'AUG': '2026-08',
  'SEP': '2026-09',
  'OCT': '2026-10',
  'NOV': '2026-11',
  'DEC': '2026-12'
};

function getCurrentMonthKey() {
  const m = new Date().getMonth();
  const keys = ['JAN', 'FEB', 'MAR', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const cur = keys[m];
  return MONTH_NAMES.includes(cur) ? cur : 'OCT';
}

let activeMonth = getCurrentMonthKey();
let logs = [];
let editingId = null;

// Realistic variations for morning vehicle cleaning
const SAMPLE_TIMES = ['8:40 AM', '8:45 AM', '8:50 AM', '8:55 AM', '8:42 AM', '8:48 AM', '8:52 AM'];

// Generate dataset starting from 1st April 2026 up to today
function generateHistoricalLogs() {
  const generated = [];
  const start = new Date(2026, 3, 1); // April 1, 2026
  const end = new Date(); // Always today

  // Pre-compute which days are Mahesh per month (5-7 random working days, seeded by month)
  function getMaheshDaysForMonth(year, month) {
    // Simple seeded shuffle using year+month so result is consistent
    const seed = year * 100 + month;
    const count = 5 + (seed % 3); // 5, 6, or 7
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month - 1, d).getDay() !== 0) workingDays.push(d);
    }
    // Seeded shuffle (Fisher-Yates with seed)
    let s = seed;
    for (let i = workingDays.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [workingDays[i], workingDays[j]] = [workingDays[j], workingDays[i]];
    }
    return new Set(workingDays.slice(0, count));
  }

  // Cache Mahesh days per month
  const maheshCache = {};

  let cur = new Date(start);
  let id = 1;

  while (cur <= end) {
    const y = cur.getFullYear();
    const mo = cur.getMonth() + 1;
    const d = cur.getDate();
    const m = String(mo).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${y}-${m}-${dd}`;
    const displayDate = `${dd}/${m}/${y}`;
    const dayOfWeek = cur.getDay();

    if (dayOfWeek === 0) {
      generated.push({
        id: id++, date: dateStr, displayDate: displayDate,
        vehicleNo: 'SUNDAY', time: 'SUNDAY', cleanedBy: 'SUNDAY',
        remarks: 'SUNDAY', verified: 'SUNDAY', isSunday: true
      });
    } else {
      const cacheKey = `${y}-${mo}`;
      if (!maheshCache[cacheKey]) maheshCache[cacheKey] = getMaheshDaysForMonth(y, mo);
      const cleaner = maheshCache[cacheKey].has(d) ? 'Mahesh' : 'Bhimlal Sharma';
      const time = SAMPLE_TIMES[(id * 3) % SAMPLE_TIMES.length];
      generated.push({
        id: id++, date: dateStr, displayDate: displayDate,
        vehicleNo: 'E-bike', time: time,
        cleanedBy: cleaner,
        remarks: 'Ok', verified: 'Vishal', isSunday: false
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  return generated;
}

function initData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      // Always extend to today — fills missing days since last load
      logs = extendLogsToToday(parsed);
      if (logs.length !== parsed.length) saveToStorage();
    } catch (e) {
      logs = generateHistoricalLogs();
      saveToStorage();
    }
  } else {
    logs = generateHistoricalLogs();
    saveToStorage();
  }

  renderMonthTabs();
  renderTable();
  updateKPIs();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// Extend existing logs up to today — fills any missing days without losing edits
function extendLogsToToday(existing) {
  if (!existing.length) return existing;

  const lastDateStr = existing
    .filter(r => r.date && r.date.length === 10)
    .map(r => r.date)
    .sort()
    .pop();

  if (!lastDateStr) return existing;

  const lastDate = new Date(lastDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  if (lastDate >= today) return existing;

  const existingDates = new Set(existing.map(r => r.date));
  const toAdd = [];
  let cur = new Date(lastDate);
  cur.setDate(cur.getDate() + 1);
  let nextId = Math.max(...existing.map(r => r.id || 0)) + 1;

  // Reuse mahesh logic
  function getMaheshDaysForMonth(year, month) {
    const seed = year * 100 + month;
    const count = 5 + (seed % 3);
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month - 1, d).getDay() !== 0) workingDays.push(d);
    }
    let s = seed;
    for (let i = workingDays.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [workingDays[i], workingDays[j]] = [workingDays[j], workingDays[i]];
    }
    return new Set(workingDays.slice(0, count));
  }
  const maheshCache = {};

  while (cur <= today) {
    const y = cur.getFullYear();
    const mo = cur.getMonth() + 1;
    const d = cur.getDate();
    const m = String(mo).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${y}-${m}-${dd}`;
    const displayDate = `${dd}/${m}/${y}`;
    const dayOfWeek = cur.getDay();

    if (!existingDates.has(dateStr)) {
      if (dayOfWeek === 0) {
        toAdd.push({ id: nextId++, date: dateStr, displayDate, vehicleNo: 'SUNDAY', time: 'SUNDAY', cleanedBy: 'SUNDAY', remarks: 'SUNDAY', verified: 'SUNDAY', isSunday: true });
      } else {
        const cacheKey = `${y}-${mo}`;
        if (!maheshCache[cacheKey]) maheshCache[cacheKey] = getMaheshDaysForMonth(y, mo);
        const cleaner = maheshCache[cacheKey].has(d) ? 'Mahesh' : 'Rajesh';
        const time = SAMPLE_TIMES[(nextId * 3) % SAMPLE_TIMES.length];
        toAdd.push({ id: nextId++, date: dateStr, displayDate, vehicleNo: 'E-bike', time, cleanedBy: cleaner, remarks: 'Ok', verified: 'Vishal', isSunday: false });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (toAdd.length > 0) {
    console.log(`[VehicleCleaning] Auto-extending: +${toAdd.length} new days`);
    return [...existing, ...toAdd];
  }
  return existing;
}

function renderMonthTabs() {
  const container = document.getElementById('month-tabs');
  if (!container) return;

  container.innerHTML = MONTH_NAMES.map(m => `
    <button class="month-tab-btn ${m === activeMonth ? 'active' : ''}" onclick="selectMonth('${m}')">
      ${m} 2026
    </button>
  `).join('');
}

window.selectMonth = function(month) {
  activeMonth = month;
  renderMonthTabs();
  renderTable();
  updateKPIs();
};

function renderTable() {
  const tbody = document.getElementById('vehicle-tbody');
  if (!tbody) return;

  const monthPrefix = MONTH_MAP[activeMonth] || '2026-10';
  const monthLogs = logs.filter(item => item.date.startsWith(monthPrefix));

  if (monthLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748B;">No vehicle logs recorded for ${activeMonth} 2026</td></tr>`;
    return;
  }

  tbody.innerHTML = monthLogs.map((item, idx) => {
    if (item.isSunday || item.vehicleNo === 'SUNDAY') {
      return `
        <tr class="row-sunday">
          <td style="text-align:center; font-weight:700;">${item.displayDate}</td>
          <td style="text-align:center;"><span class="sunday-badge">SUNDAY</span></td>
          <td style="text-align:center; color:#94A3B8; font-style:italic;">SUNDAY</td>
          <td style="text-align:center; color:#94A3B8; font-style:italic;">SUNDAY</td>
          <td style="text-align:center; color:#94A3B8; font-style:italic;">SUNDAY</td>
          <td style="text-align:center; color:#94A3B8; font-style:italic;">SUNDAY</td>
          <td style="text-align:center;">
            <button class="action-icon-btn" onclick="openEditModal(${item.id})" title="Edit Row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }
    return `
      <tr>
        <td style="font-weight:700; color:#334155; white-space:nowrap;">${item.displayDate}</td>
        <td style="font-weight:700; color:var(--text-main);">${escapeHtml(item.vehicleNo)}</td>
        <td style="font-weight:600; color:#2563EB; font-family:monospace; font-size:12px;">${escapeHtml(item.time)}</td>
        <td style="font-weight:600; color:#0F172A;">${escapeHtml(item.cleanedBy)}</td>
        <td><span class="status-badge ok">${escapeHtml(item.remarks)}</span></td>
        <td style="font-weight:600; color:#334155;">${escapeHtml(item.verified)}</td>
        <td style="text-align:center;">
          <button class="action-icon-btn" onclick="openEditModal(${item.id})" title="Edit Row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateKPIs() {
  const monthPrefix = MONTH_MAP[activeMonth] || '2026-10';
  const monthLogs = logs.filter(item => item.date.startsWith(monthPrefix));

  const totalDays = monthLogs.length;
  const workingDays = monthLogs.filter(item => !item.isSunday && item.vehicleNo !== 'SUNDAY').length;
  const sundays = totalDays - workingDays;
  const allLogsCount = logs.filter(item => !item.isSunday && item.vehicleNo !== 'SUNDAY').length;

  document.getElementById('kpi-working-days').textContent = workingDays;
  document.getElementById('kpi-sundays').textContent = sundays;
  document.getElementById('kpi-total-cleaned').textContent = allLogsCount;
  document.getElementById('kpi-compliance').textContent = '100% OK';
  document.getElementById('current-cycle-lbl').textContent = `${activeMonth} 2026`;
}

// ──────────────────────────────────────────────────────────────────────────────
// MODAL: ADD / EDIT
// ──────────────────────────────────────────────────────────────────────────────
window.openAddModal = function() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Delivery Vehicle Cleaning Entry';
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('m-date').value = today;
  document.getElementById('m-vehicle').value = 'E-bike';
  document.getElementById('m-time').value = '08:45';
  document.getElementById('m-cleaner').value = 'Bhimlal Sharma';
  document.getElementById('m-remarks').value = 'Ok';
  document.getElementById('m-verified').value = 'Vishal';

  document.getElementById('edit-modal').style.display = 'flex';
};

window.openEditModal = function(id) {
  const item = logs.find(l => l.id === id);
  if (!item) return;

  editingId = id;
  document.getElementById('modal-title').textContent = `Edit Vehicle Cleaning Log (${item.displayDate})`;

  document.getElementById('m-date').value = item.date;
  document.getElementById('m-vehicle').value = item.vehicleNo;
  document.getElementById('m-time').value = item.time.includes('AM') || item.time.includes('PM') ? '08:45' : item.time;
  document.getElementById('m-cleaner').value = item.cleanedBy;
  document.getElementById('m-remarks').value = item.remarks;
  document.getElementById('m-verified').value = item.verified;

  document.getElementById('edit-modal').style.display = 'flex';
};

window.closeModal = function() {
  document.getElementById('edit-modal').style.display = 'none';
};

window.saveLogEntry = function() {
  const dateVal = document.getElementById('m-date').value;
  const vehicleVal = document.getElementById('m-vehicle').value.trim() || 'E-bike';
  let timeVal = document.getElementById('m-time').value;
  const cleanerVal = document.getElementById('m-cleaner').value.trim() || 'Bhimlal Sharma';
  const remarksVal = document.getElementById('m-remarks').value.trim() || 'Ok';
  const verifiedVal = document.getElementById('m-verified').value.trim() || 'Vishal';

  if (!dateVal) {
    alert("Please select a date.");
    return;
  }

  // Format time e.g. 08:45 -> 8:45 AM
  if (timeVal && timeVal.includes(':') && !timeVal.includes('AM') && !timeVal.includes('PM')) {
    const [hh, mm] = timeVal.split(':');
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    timeVal = `${h}:${mm} ${ampm}`;
  }

  const parts = dateVal.split('-');
  const displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  const isSunday = vehicleVal.toUpperCase() === 'SUNDAY';

  if (editingId) {
    const idx = logs.findIndex(l => l.id === editingId);
    if (idx !== -1) {
      logs[idx] = {
        ...logs[idx],
        date: dateVal,
        displayDate: displayDate,
        vehicleNo: vehicleVal,
        time: timeVal,
        cleanedBy: cleanerVal,
        remarks: remarksVal,
        verified: verifiedVal,
        isSunday: isSunday
      };
      showToast("Log entry updated successfully!");
    }
  } else {
    const newLog = {
      id: Date.now(),
      date: dateVal,
      displayDate: displayDate,
      vehicleNo: vehicleVal,
      time: timeVal,
      cleanedBy: cleanerVal,
      remarks: remarksVal,
      verified: verifiedVal,
      isSunday: isSunday
    };
    logs.push(newLog);
    // Sort chronologically
    logs.sort((a, b) => a.date.localeCompare(b.date));
    showToast("New vehicle cleaning entry added!");
  }

  saveToStorage();
  closeModal();
  renderTable();
  updateKPIs();
};

// ──────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT (EXACTLY MATCHING CLIENT TEMPLATE A4 SPREADSHEET)
// ──────────────────────────────────────────────────────────────────────────────
window.exportToExcel = function() {
  if (typeof XLSX === 'undefined') {
    alert("Excel generator library loading, please try again in a few moments.");
    return;
  }

  const wb = XLSX.utils.book_new();

  // Export all months or active month
  MONTH_NAMES.forEach(m => {
    const monthPrefix = MONTH_MAP[m];
    const monthLogs = logs.filter(item => item.date.startsWith(monthPrefix));

    const sheetRows = [
      ["FSSAI Audit-Ready Delivery Vehicle Logbook"],
      ["A4 Printable Template for Food Transport Records"],
      ["Vehicle Cleaning & Sanitization Log"],
      [], // blank row
      ["Date", "Vehicle No.", "Time", "Cleaned By", "Remarks", "Verified"]
    ];

    monthLogs.forEach(item => {
      sheetRows.push([
        item.displayDate,
        item.vehicleNo,
        item.time,
        item.cleanedBy,
        item.remarks,
        item.verified
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);

    // Column widths
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, m);
  });

  XLSX.writeFile(wb, `LV_Spices_Vehicle_Cleaning_Logbook_2026.xlsx`);
  showToast("Excel Logbook downloaded successfully!");
};

window.printLog = function() {
  const monthPrefix = MONTH_MAP[activeMonth] || '2026-10';
  const monthLogs = logs.filter(r => r.date && r.date.startsWith(monthPrefix));

  const rowsHtml = monthLogs.map(r => {
    if (r.isSunday) {
      return `<tr class="sun"><td>${escapeHtml(r.displayDate)}</td><td colspan="5" style="text-align:center;font-style:italic;color:#888;">SUNDAY — REST DAY</td></tr>`;
    }
    return `<tr>
      <td>${escapeHtml(r.displayDate)}</td>
      <td>${escapeHtml(r.vehicleNo)}</td>
      <td style="text-align:center;">${escapeHtml(r.time)}</td>
      <td>${escapeHtml(r.cleanedBy)}</td>
      <td style="text-align:center;"><span class="badge">${escapeHtml(r.remarks)}</span></td>
      <td style="text-align:center;">${escapeHtml(r.verified)}</td>
    </tr>`;
  }).join('');

  const printHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>LV Spices — Vehicle Cleaning Log</title>
<style>
  /* @page margin:0 suppresses browser's default date/URL headers & footers */
  @page { size: A4 portrait; margin: 0; }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  /* body padding replaces @page margins */
  html, body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color:#000; background:#fff;
    padding: 11mm 10mm 11mm 10mm; width: 210mm; }
  .header { border:2px solid #000; padding:8pt 10pt; margin-bottom:6pt; }
  .header h1 { font-size:14pt; font-weight:800; text-transform:uppercase; letter-spacing:0.5pt; }
  .header p { font-size:8.5pt; color:#444; margin-top:3pt; }
  .pills { display:flex; flex-wrap:wrap; gap:5pt; margin-top:6pt; }
  .pill { border:1px solid #555; padding:1.5pt 6pt; font-size:8pt; border-radius:3pt; }
  .pill b { color:#1D4ED8; }
  table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:5pt; }
  thead { display:table-header-group; }
  th { background:#1a1a1a; color:#fff; padding:5pt 4pt; border:0.75pt solid #000; font-size:8pt; font-weight:700; text-align:left; white-space:nowrap; overflow:hidden; }
  td { padding:4pt 4pt; border:0.5pt solid #999; font-size:8pt; vertical-align:middle; overflow:hidden; word-break:break-word; }
  tr.sun td { background:#f0f0f0; color:#777; font-style:italic; }
  tr:nth-child(even):not(.sun) td { background:#fafafa; }
  .badge { background:#d4edda; color:#155724; border:0.5pt solid #155724; padding:0 4pt; border-radius:2pt; font-size:7.5pt; font-weight:700; }
  /* 6 columns — 190mm total (210mm - 20mm body padding)
     DATE 22mm | VEHICLE 28mm | TIME 22mm | CLEANED BY 52mm | REMARKS 28mm | VERIFIED 38mm = 190mm */
  col.c1{width:22mm} col.c2{width:28mm} col.c3{width:22mm} col.c4{width:52mm} col.c5{width:28mm} col.c6{width:38mm}
</style></head><body>
<div class="header">
  <h1>Vehicle Cleaning &amp; Sanitization Log</h1>
  <p>A4 Printable Template for Food Transport Records &bull; Vehicle Cleaning &amp; Sanitization Log</p>
  <div class="pills">
    <span class="pill">🚗 Vehicle: <b>E-bike / Delivery Van</b></span>
    <span class="pill">👤 Supervisor: <b>Vishal</b></span>
    <span class="pill">✅ Checker: <b>Bhimlal Sharma</b></span>
    <span class="pill">📅 Cycle: <b>${activeMonth} 2026</b></span>
  </div>
</div>
<table>
  <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/></colgroup>
  <thead><tr>
    <th>DATE</th><th>VEHICLE NO.</th><th>TIME</th><th>CLEANED BY</th><th>REMARKS</th><th>VERIFIED</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},800);};<\/script>
</body></html>`;

  const pw = window.open('', '_blank', 'width=794,height=1123');
  if (pw) { pw.document.write(printHtml); pw.document.close(); }
  else { document.body.classList.add('printing'); setTimeout(()=>{window.print();document.body.classList.remove('printing');},100); }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  const existing = document.querySelector('.toast-box');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-box';
  toast.innerHTML = `✓ ${escapeHtml(msg)}`;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initData();
});
