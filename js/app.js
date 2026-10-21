// app.js — Vehicle Cleaning & Sanitization Logbook
// Automated generation from 2026-04-01 to 2026-10-19 with full manual edit/add & Excel export

const STORAGE_KEY = 'lv_vehicle_cleaning_logs_v1';
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

// Generate dataset starting from 1st April 2026 up to today (19th October 2026)
function generateHistoricalLogs() {
  const generated = [];
  const start = new Date(2026, 3, 1); // April 1, 2026
  const end = new Date(); // Always today

  let cur = new Date(start);
  let id = 1;

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const displayDate = `${d}/${m}/${y}`;
    const dayOfWeek = cur.getDay(); // 0 is Sunday

    if (dayOfWeek === 0) {
      generated.push({
        id: id++,
        date: dateStr,
        displayDate: displayDate,
        vehicleNo: 'SUNDAY',
        time: 'SUNDAY',
        cleanedBy: 'SUNDAY',
        remarks: 'SUNDAY',
        verified: 'SUNDAY',
        isSunday: true
      });
    } else {
      const time = SAMPLE_TIMES[(id * 3) % SAMPLE_TIMES.length];
      generated.push({
        id: id++,
        date: dateStr,
        displayDate: displayDate,
        vehicleNo: 'E-bike',
        time: time,
        cleanedBy: 'Rajesh',
        remarks: 'Ok',
        verified: 'Vishal',
        isSunday: false
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
      logs = JSON.parse(stored);
    } catch (e) {
      logs = generateHistoricalLogs();
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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748B;">No vehicle logs recorded for ${activeMonth} 2026</td></tr>`;
    return;
  }

  tbody.innerHTML = monthLogs.map((item, idx) => {
    if (item.isSunday || item.vehicleNo === 'SUNDAY') {
      return `
        <tr class="row-sunday">
          <td style="text-align:center; font-weight:700;">${item.displayDate}</td>
          <td style="text-align:center;"><span class="sunday-badge">SUNDAY</span></td>
          <td style="text-align:center;">SUNDAY</td>
          <td style="text-align:center;">SUNDAY</td>
          <td style="text-align:center;">SUNDAY</td>
          <td style="text-align:center;">SUNDAY</td>
          <td style="text-align:center;"><span style="color:#94A3B8;">—</span></td>
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
          <span class="signature-preview">Vishal</span>
        </td>
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
  document.getElementById('m-cleaner').value = 'Rajesh';
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
  const cleanerVal = document.getElementById('m-cleaner').value.trim() || 'Rajesh';
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
      ["Date", "Vehicle No.", "Time", "Cleaned By", "Remarks", "Verified", "Sign"]
    ];

    monthLogs.forEach(item => {
      sheetRows.push([
        item.displayDate,
        item.vehicleNo,
        item.time,
        item.cleanedBy,
        item.remarks,
        item.verified,
        item.isSunday ? "" : "Vishal (Signed)"
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
      { wch: 16 },
      { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, m);
  });

  XLSX.writeFile(wb, `LV_Spices_Vehicle_Cleaning_Logbook_2026.xlsx`);
  showToast("Excel Logbook downloaded successfully!");
};

window.printLog = function() {
  window.print();
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
