/**
 * FastXMoto - Used Bikes Record Management & Dealership Portal
 * Comprehensive Application Logic with Admin Auth & Dedicated Workshop Hub
 */

// Application State
let bikes = [];
let currentFilterStatus = 'ALL';
let currentFilterBrand = 'ALL';
let currentSearchQuery = '';
let currentSort = 'date-desc';
let currentViewMode = window.innerWidth < 768 ? 'grid' : 'table'; // 'table' or 'grid' (default to touch-friendly card grid on mobile)
let currentCurrency = 'INR';

// Active Module State
let currentModule = 'inventory'; // 'inventory' or 'workshop'

// Workshop Module Filters
let currentWsStatus = 'ALL'; // 'ALL', 'IN_WORKSHOP', 'COMPLETED'
let currentWsCategory = 'ALL';
let currentWsSearch = '';

// Standard Admin Authentication Credentials
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = 'FastX@2026';
const FALLBACK_ADMIN_PASS = 'admin123';

// Currency formatting configuration
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1, locale: 'en-IN' },
  USD: { symbol: '$', rate: 0.012, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.011, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.0095, locale: 'en-GB' },
  AED: { symbol: 'AED ', rate: 0.044, locale: 'en-AE' }
};

// Chart instances
let financialsChart = null;
let brandChart = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadData();
  setupEventListeners();
  setupAuthEventListeners();
  setupWorkshopEventListeners();

  // Set initial view mode button state based on screen size
  if (currentViewMode === 'grid') {
    const tableBtn = document.getElementById('view-mode-table');
    const gridBtn = document.getElementById('view-mode-grid');
    gridBtn?.classList.add('bg-brand-500', 'text-white');
    gridBtn?.classList.remove('text-slate-400');
    tableBtn?.classList.remove('bg-brand-500', 'text-white');
    tableBtn?.classList.add('text-slate-400');
  }

  initCharts();
  renderApp();
  lucide.createIcons();
});

// ============================================================================
// 1. ADMIN AUTHENTICATION ENGINE
// ============================================================================

/**
 * Check if admin is currently authenticated
 */
function initAuth() {
  const loginScreen = document.getElementById('admin-login-screen');
  const isAuthSession = sessionStorage.getItem('fastxmoto_auth') === 'true';
  const isAuthRemember = localStorage.getItem('fastxmoto_auth_remember') === 'true';

  if (isAuthSession || isAuthRemember) {
    loginScreen?.classList.add('hidden');
  } else {
    loginScreen?.classList.remove('hidden');
  }
}

/**
 * Get current configured admin password
 */
function getAdminPassword() {
  return localStorage.getItem('fastxmoto_admin_pwd') || DEFAULT_ADMIN_PASS;
}

/**
 * Setup Auth Form Events
 */
function setupAuthEventListeners() {
  const loginForm = document.getElementById('admin-login-form');
  const togglePwdBtn = document.getElementById('toggle-pwd-visibility-btn');
  const pwdInput = document.getElementById('login-password');
  const pwdIcon = document.getElementById('toggle-pwd-icon');
  const autofillBtn = document.getElementById('autofill-credentials-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // Password visibility toggle
  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener('click', () => {
      const isPassword = pwdInput.type === 'password';
      pwdInput.type = isPassword ? 'text' : 'password';
      if (pwdIcon) {
        pwdIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        lucide.createIcons();
      }
    });
  }

  // Autofill button helper
  if (autofillBtn) {
    autofillBtn.addEventListener('click', () => {
      const usernameInput = document.getElementById('login-username');
      if (usernameInput) usernameInput.value = DEFAULT_ADMIN_USER;
      if (pwdInput) pwdInput.value = getAdminPassword();
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username')?.value.trim();
      const password = pwdInput?.value;
      const remember = document.getElementById('login-remember')?.checked;
      const errorMsg = document.getElementById('login-error-msg');
      const errorText = document.getElementById('login-error-text');

      const expectedPwd = getAdminPassword();

      if (username === DEFAULT_ADMIN_USER && (password === expectedPwd || password === FALLBACK_ADMIN_PASS)) {
        // Successful login
        sessionStorage.setItem('fastxmoto_auth', 'true');
        if (remember) {
          localStorage.setItem('fastxmoto_auth_remember', 'true');
        } else {
          localStorage.removeItem('fastxmoto_auth_remember');
        }

        if (errorMsg) errorMsg.classList.add('hidden');
        document.getElementById('admin-login-screen')?.classList.add('hidden');

        // Confetti celebration
        triggerCelebrationConfetti();
      } else {
        // Failed login
        if (errorMsg) {
          errorMsg.classList.remove('hidden');
          if (errorText) errorText.textContent = 'Invalid credentials. Default is admin / FastX@2026';
        }
        loginForm.classList.add('animate-shake');
        setTimeout(() => loginForm.classList.remove('animate-shake'), 400);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out from the Admin Portal?')) {
        sessionStorage.removeItem('fastxmoto_auth');
        localStorage.removeItem('fastxmoto_auth_remember');
        document.getElementById('admin-login-screen')?.classList.remove('hidden');
      }
    });
  }

  // Change Password Modal events
  setupChangePasswordModal();
}

/**
 * Change Admin Password Modal Logic
 */
function setupChangePasswordModal() {
  const openBtn = document.getElementById('open-change-pwd-btn');
  const modal = document.getElementById('change-pwd-modal');
  const closeBtn = document.getElementById('close-change-pwd-modal-btn');
  const cancelBtn = document.getElementById('cancel-change-pwd-btn');
  const form = document.getElementById('change-pwd-form');
  const msgEl = document.getElementById('change-pwd-msg');

  const closeModal = () => modal?.classList.add('modal-hidden');

  openBtn?.addEventListener('click', () => {
    form?.reset();
    if (msgEl) msgEl.classList.add('hidden');
    modal?.classList.remove('modal-hidden');
    lucide.createIcons();
  });

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('pwd-current')?.value;
    const newPwd = document.getElementById('pwd-new')?.value;
    const confirmPwd = document.getElementById('pwd-confirm')?.value;

    const actualCurrent = getAdminPassword();

    if (currentPwd !== actualCurrent && currentPwd !== FALLBACK_ADMIN_PASS) {
      if (msgEl) {
        msgEl.textContent = 'Current password does not match.';
        msgEl.className = 'p-2.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30';
        msgEl.classList.remove('hidden');
      }
      return;
    }

    if (!newPwd || newPwd.length < 6) {
      if (msgEl) {
        msgEl.textContent = 'New password must be at least 6 characters.';
        msgEl.className = 'p-2.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30';
        msgEl.classList.remove('hidden');
      }
      return;
    }

    if (newPwd !== confirmPwd) {
      if (msgEl) {
        msgEl.textContent = 'New passwords do not match.';
        msgEl.className = 'p-2.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30';
        msgEl.classList.remove('hidden');
      }
      return;
    }

    // Save new password
    localStorage.setItem('fastxmoto_admin_pwd', newPwd);
    if (msgEl) {
      msgEl.textContent = 'Password successfully updated!';
      msgEl.className = 'p-2.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      msgEl.classList.remove('hidden');
    }

    setTimeout(() => {
      closeModal();
    }, 1200);
  });
}

// ============================================================================
// 2. DATA MANAGEMENT & EXCEL SHEET DATABASE ENGINE
// ============================================================================

/**
 * Load bikes from FastXMoto_Database.xlsx API or localStorage (zero demo data)
 */
async function loadData() {
  const cleanDemoKey = 'fastxmoto_zero_demo_v4';
  if (!localStorage.getItem(cleanDemoKey)) {
    localStorage.removeItem('fastxmoto_bikes_records');
    localStorage.setItem(cleanDemoKey, 'true');
    bikes = [];
  } else {
    const savedData = localStorage.getItem('fastxmoto_bikes_records');
    if (savedData) {
      try {
        bikes = JSON.parse(savedData);
      } catch (e) {
        console.error("Failed to parse saved bikes:", e);
        bikes = [];
      }
    } else {
      bikes = [];
    }
  }

  // Filter out any lingering mock demo bikes
  bikes = bikes.filter(b => !['BIKE-2026-001', 'BIKE-2026-002'].includes(b.id) && b.sellerName !== 'Vikram Malhotra');

  // Fetch live from Excel sheet database API
  try {
    const resp = await fetch('/api/database');
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.bikes)) {
        bikes = result.bikes;
        localStorage.setItem('fastxmoto_bikes_records', JSON.stringify(bikes));
        console.log(`Loaded ${bikes.length} bikes from FastXMoto_Database.xlsx`);
        renderApp();
        renderWorkshopHub();
      }
    }
  } catch (err) {
    console.log('Server Excel API offline or static mode, using local database cache.');
  }

  const savedCurrency = localStorage.getItem('fastxmoto_currency');
  if (savedCurrency && CURRENCY_CONFIG[savedCurrency]) {
    currentCurrency = savedCurrency;
    const currSelect = document.getElementById('currency-selector');
    if (currSelect) currSelect.value = savedCurrency;
  }
}

/**
 * Persist bikes to localStorage and sync live to FastXMoto_Database.xlsx
 */
function saveData() {
  localStorage.setItem('fastxmoto_bikes_records', JSON.stringify(bikes));
  
  // Sync live to FastXMoto_Database.xlsx via server API
  try {
    fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bikes: bikes })
    }).then(resp => resp.json()).then(res => {
      console.log('Excel Database sync response:', res);
    }).catch(err => {
      console.log('Background Excel database sync notice:', err.message);
    });
  } catch (e) {
    // Standalone static fallback
  }
}

/**
 * Export full database to FastXMoto_Database.xlsx using SheetJS (client fallback)
 */
function exportDatabaseToExcel() {
  if (typeof XLSX === 'undefined') {
    window.location.href = '/api/export-excel';
    return;
  }

  const masterRows = bikes.map(b => {
    const buyPrice = Number(b.purchasePrice) || 0;
    const refurbTotal = (b.refurbishments || []).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    const costBasis = buyPrice + refurbTotal;
    const sellPrice = Number(b.sellingPrice) || 0;
    const profit = b.status === 'Sold' ? sellPrice - costBasis : 0;
    return {
      'ID': b.id,
      'Registration_Number': b.regNumber,
      'Brand': b.brand,
      'Model': b.model,
      'Year': b.year,
      'Engine_CC': b.engineCC || '',
      'Purchase_Date': b.purchaseDate || '',
      'Purchase_Price': buyPrice,
      'Seller_Name': b.sellerName || '',
      'Seller_Phone': b.sellerPhone || '',
      'Workshop_Total_Cost': refurbTotal,
      'Total_Cost_Basis': costBasis,
      'Status': b.status || 'In Stock',
      'Selling_Price': sellPrice,
      'Sale_Date': b.saleDate || '',
      'Buyer_Name': b.buyerName || '',
      'Buyer_Phone': b.buyerPhone || '',
      'Net_Profit': profit,
      'Created_At': b.createdAt || ''
    };
  });

  const repairRows = [];
  bikes.forEach(b => {
    (b.refurbishments || []).forEach(r => {
      repairRows.push({
        'Repair_ID': r.id,
        'Registration_Number': b.regNumber,
        'Vehicle_Name': `${b.brand} ${b.model}`,
        'Repair_Description': r.description,
        'Repair_Cost': Number(r.cost) || 0,
        'Repair_Date': r.date || ''
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(masterRows);
  const ws2 = XLSX.utils.json_to_sheet(repairRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Vehicles_Master');
  XLSX.utils.book_append_sheet(wb, ws2, 'Workshop_Repairs');
  XLSX.writeFile(wb, 'FastXMoto_Database.xlsx');
}

/**
 * Import vehicle and workshop records from an Excel file (.xlsx)
 */
function importFromExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    alert('Excel processor library is loading. Please try again.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const repairsByReg = {};
      if (workbook.SheetNames.includes('Workshop_Repairs')) {
        const repairsSheet = workbook.Sheets['Workshop_Repairs'];
        const repairsData = XLSX.utils.sheet_to_json(repairsSheet);
        repairsData.forEach(r => {
          const reg = normalizeReg(r['Registration_Number'] || r['RegNumber']);
          if (!reg) return;
          if (!repairsByReg[reg]) repairsByReg[reg] = [];
          repairsByReg[reg].push({
            id: r['Repair_ID'] || `ref-${Date.now()}-${Math.random()}`,
            description: r['Repair_Description'] || r['Description'] || '',
            cost: Number(r['Repair_Cost'] || r['Cost']) || 0,
            date: r['Repair_Date'] || r['Date'] || ''
          });
        });
      }

      const importedBikes = [];
      const masterSheetName = workbook.SheetNames.includes('Vehicles_Master') ? 'Vehicles_Master' : workbook.SheetNames[0];
      const masterSheet = workbook.Sheets[masterSheetName];
      const masterData = XLSX.utils.sheet_to_json(masterSheet);

      masterData.forEach((row, idx) => {
        const reg = (row['Registration_Number'] || row['RegNumber'] || row['regNumber'] || '').trim().toUpperCase();
        if (!reg) return;
        const cleanReg = normalizeReg(reg);
        importedBikes.push({
          id: row['ID'] || row['id'] || `BIKE-${Date.now()}-${idx + 1}`,
          regNumber: reg,
          brand: row['Brand'] || row['brand'] || 'Motorcycle',
          model: row['Model'] || row['model'] || reg,
          variant: row['Variant'] || row['variant'] || '',
          year: parseInt(row['Year'] || row['year']) || 2023,
          engineCC: parseInt(row['Engine_CC'] || row['engineCC']) || null,
          purchaseDate: row['Purchase_Date'] || row['purchaseDate'] || new Date().toISOString().split('T')[0],
          purchasePrice: parseFloat(row['Purchase_Price'] || row['purchasePrice']) || 0,
          sellerName: row['Seller_Name'] || row['sellerName'] || 'Previous Owner',
          sellerPhone: row['Seller_Phone'] || row['sellerPhone'] || '',
          status: row['Status'] || row['status'] || 'In Stock',
          sellingPrice: parseFloat(row['Selling_Price'] || row['sellingPrice']) || 0,
          saleDate: row['Sale_Date'] || row['saleDate'] || '',
          buyerName: row['Buyer_Name'] || row['buyerName'] || '',
          buyerPhone: row['Buyer_Phone'] || row['buyerPhone'] || '',
          refurbishments: repairsByReg[cleanReg] || [],
          documents: { rcBook: false, insurance: false, puc: false },
          createdAt: row['Created_At'] || new Date().toISOString()
        });
      });

      if (importedBikes.length > 0) {
        bikes = importedBikes;
        saveData();
        renderApp();
        renderWorkshopHub();
        updateCharts();
        alert(`✓ Successfully loaded ${importedBikes.length} records from Excel Database into FastXMoto!`);
      } else {
        alert('No vehicle records found in the uploaded Excel file.');
      }
    } catch (err) {
      console.error('Failed to import Excel sheet:', err);
      alert('Error reading Excel file. Please ensure it is a valid .xlsx file.');
    }
    e.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Format currency amount based on active currency setting
 */
function formatCurrency(amountINR) {
  if (amountINR === undefined || amountINR === null || isNaN(amountINR)) return `${CURRENCY_CONFIG[currentCurrency].symbol}0`;
  const config = CURRENCY_CONFIG[currentCurrency];
  const converted = amountINR * config.rate;
  
  if (currentCurrency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(converted);
  } else {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currentCurrency,
      maximumFractionDigits: 0
    }).format(converted);
  }
}

/**
 * Calculate cost basis for a bike (Purchase Price + Sum of Refurbishments)
 */
function getCostBasis(bike) {
  const buyPrice = Number(bike.purchasePrice) || 0;
  const refurbTotal = (bike.refurbishments || []).reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
  return buyPrice + refurbTotal;
}

/**
 * Escape HTML special characters for safe markup insertion
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalize vehicle registration number for cross-module lookup (e.g. "MH 12 AB 4589" -> "MH12AB4589")
 */
function normalizeReg(reg) {
  return (reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Calculate profit/loss and margin % for a bike
 */
function getBikeProfitMetrics(bike) {
  const costBasis = getCostBasis(bike);
  const sellPrice = Number(bike.sellingPrice) || 0;
  const profit = sellPrice - costBasis;
  const margin = costBasis > 0 ? (profit / costBasis) * 100 : 0;
  return { costBasis, sellPrice, profit, margin };
}

// ============================================================================
// 3. MODULE NAVIGATION & WORKSHOP HUB EVENTS
// ============================================================================

function switchModule(moduleName) {
  currentModule = moduleName;
  const inventoryModule = document.getElementById('module-inventory');
  const workshopModule = document.getElementById('module-workshop');

  const navTabInv = document.getElementById('nav-tab-inventory');
  const navTabWs = document.getElementById('nav-tab-workshop');
  const mobTabInv = document.getElementById('mobile-nav-tab-inventory');
  const mobTabWs = document.getElementById('mobile-nav-tab-workshop');

  if (moduleName === 'inventory') {
    inventoryModule?.classList.remove('hidden');
    workshopModule?.classList.add('hidden');

    navTabInv?.classList.add('bg-brand-500', 'text-white', 'shadow-md');
    navTabInv?.classList.remove('text-slate-300');
    navTabWs?.classList.remove('bg-purple-600', 'text-white', 'shadow-md');
    navTabWs?.classList.add('text-slate-300');

    mobTabInv?.classList.add('bg-brand-500', 'text-white');
    mobTabInv?.classList.remove('bg-surface-800', 'text-slate-300');
    mobTabWs?.classList.remove('bg-purple-600', 'text-white');
    mobTabWs?.classList.add('bg-surface-800', 'text-slate-300');

    renderApp();
  } else {
    workshopModule?.classList.remove('hidden');
    inventoryModule?.classList.add('hidden');

    navTabWs?.classList.add('bg-purple-600', 'text-white', 'shadow-md');
    navTabWs?.classList.remove('text-slate-300');
    navTabInv?.classList.remove('bg-brand-500', 'text-white', 'shadow-md');
    navTabInv?.classList.add('text-slate-300');

    mobTabWs?.classList.add('bg-purple-600', 'text-white');
    mobTabWs?.classList.remove('bg-surface-800', 'text-slate-300');
    mobTabInv?.classList.remove('bg-brand-500', 'text-white');
    mobTabInv?.classList.add('bg-surface-800', 'text-slate-300');

    renderWorkshopHub();
  }
  lucide.createIcons();
}

function setupWorkshopEventListeners() {
  // Navigation tabs
  document.getElementById('nav-tab-inventory')?.addEventListener('click', () => switchModule('inventory'));
  document.getElementById('nav-tab-workshop')?.addEventListener('click', () => switchModule('workshop'));
  document.getElementById('mobile-nav-tab-inventory')?.addEventListener('click', () => switchModule('inventory'));
  document.getElementById('mobile-nav-tab-workshop')?.addEventListener('click', () => switchModule('workshop'));

  // Live detection of vehicle as user types or selects Registration Number
  const regInput = document.getElementById('ws-input-reg-no');
  const detectedBadge = document.getElementById('ws-detected-bike-badge');
  const detectedText = document.getElementById('ws-detected-bike-text');

  const checkRegInput = () => {
    const rawVal = regInput?.value.trim() || '';
    const cleanVal = normalizeReg(rawVal);

    if (!cleanVal) {
      detectedBadge?.classList.add('hidden');
      return;
    }

    const matchedBike = bikes.find(b => normalizeReg(b.regNumber) === cleanVal);
    if (matchedBike) {
      if (detectedBadge && detectedText) {
        detectedText.textContent = `Found in Inventory: ${matchedBike.brand} ${matchedBike.model} (${matchedBike.year}) • ${matchedBike.status}`;
        detectedBadge.className = 'mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1 font-medium';
        detectedBadge.classList.remove('hidden');
      }
    } else {
      if (detectedBadge && detectedText) {
        detectedText.textContent = `Vehicle Not Found in Inventory (Add bike first)`;
        detectedBadge.className = 'mt-1.5 text-[11px] text-rose-400 flex items-center gap-1 font-medium';
        detectedBadge.classList.remove('hidden');
      }
    }
  };

  regInput?.addEventListener('input', checkRegInput);
  regInput?.addEventListener('change', checkRegInput);

  // Direct Quick-Add Repair Form Submission
  const directForm = document.getElementById('ws-direct-repair-form');
  if (directForm) {
    directForm.addEventListener('submit', handleDirectRepairSubmit);
  }

  // Workshop Table Simple Search
  const wsSearchInput = document.getElementById('ws-simple-search');
  if (wsSearchInput) {
    wsSearchInput.addEventListener('input', (e) => {
      currentWsSearch = e.target.value.toLowerCase().trim();
      renderWorkshopHub();
    });
  }

  // Success Alert "View in Inventory" button
  document.getElementById('ws-success-view-inventory-btn')?.addEventListener('click', () => {
    switchModule('inventory');
  });
}

// ============================================================================
// 4. WORKSHOP & VEHICLE REPAIRS ENGINE (STREAMLINED BY REGISTRATION NO.)
// ============================================================================

/**
 * Handle direct repair submission by Registration Number
 */
function handleDirectRepairSubmit(e) {
  e.preventDefault();
  const regInput = document.getElementById('ws-input-reg-no');
  const descInput = document.getElementById('ws-input-repair-desc');
  const costInput = document.getElementById('ws-input-repair-cost');
  const alertEl = document.getElementById('ws-repair-success-alert');
  const msgEl = document.getElementById('ws-repair-success-msg');

  const rawReg = regInput?.value.trim().toUpperCase() || '';
  const desc = descInput?.value.trim() || '';
  const cost = parseFloat(costInput?.value);

  if (!rawReg || !desc || isNaN(cost) || cost < 0) {
    alert('Please enter a valid Registration Number, repair description, and non-negative cost amount.');
    return;
  }

  const cleanReg = normalizeReg(rawReg);
  let bike = bikes.find(b => normalizeReg(b.regNumber) === cleanReg);

  // If vehicle is not in inventory, show error message "Vehicle Not Found"
  if (!bike) {
    const errorAlert = document.getElementById('ws-repair-error-alert');
    const errorMsg = document.getElementById('ws-repair-error-msg');
    const successAlert = document.getElementById('ws-repair-success-alert');
    if (successAlert) successAlert.classList.add('hidden');

    if (errorAlert && errorMsg) {
      errorMsg.textContent = `Vehicle Not Found (Registration "${rawReg}" is not in inventory). Please add the bike first.`;
      errorAlert.classList.remove('hidden');
      setTimeout(() => errorAlert.classList.add('hidden'), 7000);
    }
    alert('Vehicle Not Found');
    regInput?.focus();
    return;
  }

  // Clear any existing error alert
  document.getElementById('ws-repair-error-alert')?.classList.add('hidden');

  // Add repair & update cost basis
  if (!bike.refurbishments) bike.refurbishments = [];
  bike.refurbishments.push({
    id: 'ref-' + Date.now(),
    description: desc,
    cost: cost,
    date: new Date().toISOString().split('T')[0]
  });

  saveData();
  renderWorkshopHub();
  renderApp();

  // Show success confirmation
  if (alertEl && msgEl) {
    msgEl.innerHTML = `✓ Added <strong>${formatCurrency(cost)}</strong> repair ("${escapeHtml(desc)}") for <strong>${bike.regNumber}</strong> (${bike.brand} ${bike.model}). Reflected in Inventory & Cost Basis!`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 8000);
  }

  // Reset fields for next entry
  if (regInput) regInput.value = '';
  if (descInput) descInput.value = '';
  if (costInput) costInput.value = '';
  document.getElementById('ws-detected-bike-badge')?.classList.add('hidden');
  regInput?.focus();

  triggerCelebrationConfetti();
}

/**
 * Render the streamlined Workshop Hub
 */
function renderWorkshopHub() {
  // 1. Populate Datalist Autocomplete with all bikes in inventory
  const datalist = document.getElementById('ws-reg-datalist');
  if (datalist) {
    datalist.innerHTML = bikes.map(b => `
      <option value="${b.regNumber}">${b.brand} ${b.model} (${b.year}) - ${b.status}</option>
    `).join('');
  }

  // 2. Compute total workshop spend across all vehicles
  let totalSpend = 0;
  let bikesWithRepairsCount = 0;

  bikes.forEach(b => {
    const refurbTotal = (b.refurbishments || []).reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    totalSpend += refurbTotal;
    if (refurbTotal > 0) bikesWithRepairsCount++;
  });

  const summarySpendEl = document.getElementById('ws-summary-total-spend');
  if (summarySpendEl) summarySpendEl.textContent = formatCurrency(totalSpend);

  const navBadgeEl = document.getElementById('nav-workshop-badge');
  if (navBadgeEl) navBadgeEl.textContent = bikesWithRepairsCount;
  const mobNavBadgeEl = document.getElementById('mobile-nav-workshop-badge');
  if (mobNavBadgeEl) mobNavBadgeEl.textContent = bikesWithRepairsCount;

  // 3. Filter bikes for workshop display
  const filteredBikes = bikes.filter(bike => {
    const hasRepairs = (bike.refurbishments && bike.refurbishments.length > 0);
    if (!hasRepairs) return false;

    if (currentWsSearch) {
      const q = currentWsSearch;
      const matchReg = (bike.regNumber || '').toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
      const matchModel = (bike.brand + ' ' + bike.model).toLowerCase().includes(q);
      const matchRepairs = (bike.refurbishments || []).some(r => (r.description || '').toLowerCase().includes(q));
      if (!matchReg && !matchModel && !matchRepairs) return false;
    }
    return true;
  });

  // 4. Update count badge
  const countBadge = document.getElementById('ws-records-count-badge');
  if (countBadge) countBadge.textContent = `${filteredBikes.length} ${filteredBikes.length === 1 ? 'vehicle' : 'vehicles'}`;

  // 5. Render Table Body
  const tbody = document.getElementById('ws-simple-table-body');
  const emptyState = document.getElementById('ws-simple-empty-state');
  if (!tbody) return;

  if (filteredBikes.length === 0) {
    tbody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  tbody.innerHTML = filteredBikes.map(bike => {
    const refurbItems = bike.refurbishments || [];
    const totalBikeSpend = refurbItems.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

    return `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <!-- Registration No. -->
        <td class="py-3 px-4">
          <span class="inline-block px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 font-mono font-bold uppercase tracking-wider text-xs">
            ${bike.regNumber}
          </span>
        </td>

        <!-- Vehicle Model -->
        <td class="py-3 px-3">
          <div class="font-bold text-white text-xs">${bike.brand} ${bike.model}</div>
          <div class="text-[11px] text-slate-400 font-mono">${bike.year}${bike.variant ? ' • ' + bike.variant : ''}</div>
        </td>

        <!-- Itemized Repairs Logged -->
        <td class="py-3 px-3">
          <div class="flex flex-wrap gap-1.5 max-w-xl">
            ${refurbItems.map((r, idx) => `
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[11px]">
                <span class="font-medium">${r.description}</span>
                <span class="font-mono font-bold text-white text-[10px]">${formatCurrency(r.cost)}</span>
                <button type="button" onclick="removeWorkshopRepair('${bike.id}', ${idx})" class="text-purple-400 hover:text-rose-400 transition-colors ml-0.5 font-bold" title="Delete this repair">
                  ×
                </button>
              </span>
            `).join('')}
          </div>
        </td>

        <!-- Total Workshop Cost -->
        <td class="py-3 px-3 text-right">
          <span class="font-mono font-extrabold text-sm text-purple-300">
            ${formatCurrency(totalBikeSpend)}
          </span>
        </td>

        <!-- Inventory Status -->
        <td class="py-3 px-3 text-center">
          ${getStatusBadge(bike.status)}
        </td>

        <!-- Actions -->
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <!-- Add More Repair (prefills reg no) -->
            <button onclick="prefillWorkshopReg('${bike.regNumber}')" class="px-2.5 py-1 rounded-lg bg-surface-750 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1" title="Add another repair for this vehicle">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Add</span>
            </button>

            <!-- View in Inventory -->
            <button onclick="viewBikeInInventory('${bike.regNumber}')" class="px-2.5 py-1 rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1" title="Jump to Inventory">
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              <span>Inventory</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

/**
 * Quick button to prefill Reg Number into top form and focus repair input
 */
function prefillWorkshopReg(regNumber) {
  const regInput = document.getElementById('ws-input-reg-no');
  const descInput = document.getElementById('ws-input-repair-desc');
  if (regInput) {
    regInput.value = regNumber;
    regInput.dispatchEvent(new Event('input'));
  }
  descInput?.focus();
}

/**
 * Remove an individual repair from a vehicle
 */
function removeWorkshopRepair(bikeId, repairIndex) {
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike || !bike.refurbishments) return;

  if (confirm(`Remove this repair entry from ${bike.regNumber}? Cost basis in inventory will be adjusted automatically.`)) {
    bike.refurbishments.splice(repairIndex, 1);
    saveData();
    renderWorkshopHub();
    renderApp();
  }
}

/**
 * Jump to Inventory module with this vehicle filtered
 */
function viewBikeInInventory(regNumber) {
  switchModule('inventory');
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.value = regNumber;
    currentSearchQuery = regNumber.toLowerCase().trim();
    renderApp();
  }
}

/**
 * Jump to Workshop module for a specific bike
 */
function jumpToWorkshopForBike(regNumber) {
  switchModule('workshop');
  prefillWorkshopReg(regNumber);
}

function openWorkshopJobModal(bikeId) {
  const bike = bikes.find(b => b.id === bikeId);
  if (bike) {
    jumpToWorkshopForBike(bike.regNumber);
  } else {
    switchModule('workshop');
  }
}

// ============================================================================
// 5. GLOBAL SEARCH, FILTER & INVENTORY APP CORE
// ============================================================================

function setupEventListeners() {
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderApp();
    });
  }

  // Currency Selector
  const currencySelector = document.getElementById('currency-selector');
  if (currencySelector) {
    currencySelector.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem('fastxmoto_currency', currentCurrency);
      document.querySelectorAll('.currency-label').forEach(el => {
        el.textContent = CURRENCY_CONFIG[currentCurrency].symbol;
      });
      renderApp();
      renderWorkshopHub();
      updateCharts();
    });
  }

  // Status Filter Tabs
  document.querySelectorAll('.status-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-tab-btn').forEach(b => {
        b.classList.remove('bg-brand-500', 'text-white', 'shadow-md');
        b.classList.add('bg-surface-850', 'text-slate-300');
      });
      btn.classList.add('bg-brand-500', 'text-white', 'shadow-md');
      btn.classList.remove('bg-surface-850', 'text-slate-300');

      currentFilterStatus = btn.dataset.status;
      renderApp();
    });
  });

  // Brand Filter
  document.getElementById('filter-brand')?.addEventListener('change', (e) => {
    currentFilterBrand = e.target.value;
    renderApp();
  });

  // Sort Filter
  document.getElementById('sort-selector')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderApp();
  });

  // View Mode Switcher
  const tableBtn = document.getElementById('view-mode-table');
  const gridBtn = document.getElementById('view-mode-grid');
  tableBtn?.addEventListener('click', () => {
    currentViewMode = 'table';
    tableBtn.classList.add('bg-brand-500', 'text-white');
    tableBtn.classList.remove('text-slate-400');
    gridBtn?.classList.remove('bg-brand-500', 'text-white');
    gridBtn?.classList.add('text-slate-400');
    renderRecords();
  });
  gridBtn?.addEventListener('click', () => {
    currentViewMode = 'grid';
    gridBtn.classList.add('bg-brand-500', 'text-white');
    gridBtn.classList.remove('text-slate-400');
    tableBtn?.classList.remove('bg-brand-500', 'text-white');
    tableBtn?.classList.add('text-slate-400');
    renderRecords();
  });

  // Toggle Analytics
  document.getElementById('toggle-analytics-btn')?.addEventListener('click', () => {
    const analyticsPanel = document.getElementById('analytics-panel');
    analyticsPanel?.classList.toggle('hidden');
    if (!analyticsPanel?.classList.contains('hidden')) {
      updateAnalyticsMonthlyView();
      updateCharts();
    }
  });

  // Analytics Month Selector
  document.getElementById('analytics-month-select')?.addEventListener('change', (e) => {
    selectedAnalyticsMonth = e.target.value;
    updateAnalyticsMonthlyView();
    updateCharts();
  });

  // Monthly Activity Filter Buttons
  document.querySelectorAll('.monthly-act-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.monthly-act-btn').forEach(b => {
        b.classList.remove('active', 'bg-brand-500', 'text-white');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'bg-brand-500', 'text-white');
      btn.classList.remove('text-slate-400');
      selectedMonthlyActivityFilter = btn.dataset.activity;
      updateAnalyticsMonthlyView();
    });
  });

  // Data Dropdown
  const exportDropdownBtn = document.getElementById('export-dropdown-btn');
  const exportDropdownMenu = document.getElementById('export-dropdown-menu');
  exportDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdownMenu?.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    exportDropdownMenu?.classList.add('hidden');
  });

  // Export / Import Excel Database
  document.getElementById('excel-db-download-btn')?.addEventListener('click', (e) => {
    // If backend endpoint is reachable, let browser download FastXMoto_Database.xlsx directly;
    // SheetJS client fallback is also triggered if needed
    if (typeof XLSX !== 'undefined') {
      e.preventDefault();
      exportDatabaseToExcel();
    }
  });
  document.getElementById('menu-download-excel-btn')?.addEventListener('click', (e) => {
    if (typeof XLSX !== 'undefined') {
      e.preventDefault();
      exportDatabaseToExcel();
    }
  });
  document.getElementById('import-excel-input')?.addEventListener('change', importFromExcel);

  // CSV & JSON Backups
  document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);
  document.getElementById('footer-export-btn')?.addEventListener('click', exportToCSV);
  document.getElementById('export-json-btn')?.addEventListener('click', exportToJSON);
  document.getElementById('import-json-input')?.addEventListener('change', importFromJSON);

  // Clear All Records Button
  document.getElementById('clear-all-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all bike records? This will delete all current records from the database.')) {
      bikes = [];
      saveData();
      renderApp();
      renderWorkshopHub();
      updateCharts();
      alert('All records cleared successfully.');
    }
  });

  // Modal Open Buttons
  document.getElementById('open-add-bike-modal-btn')?.addEventListener('click', () => openBikeModal());
  document.getElementById('empty-add-bike-btn')?.addEventListener('click', () => openBikeModal());

  // Setup Registration Number Auto-lookup in Add/Edit Bike Modal
  setupModalRegistrationLookup();

  // Modal Close Buttons
  setupModalCloseButtons();

  // Bike Form Save
  document.getElementById('save-bike-record-btn')?.addEventListener('click', handleSaveBikeRecord);
  setupFormLiveCalculations();

  // Quick Sale
  document.getElementById('quick-sale-form')?.addEventListener('submit', handleQuickSaleSubmit);
  document.getElementById('qs-selling-price')?.addEventListener('input', updateQuickSaleProfitPreview);

  // Print Summary
  document.getElementById('footer-print-summary-btn')?.addEventListener('click', () => window.print());
  document.getElementById('print-invoice-btn')?.addEventListener('click', () => window.print());
}

function setupModalCloseButtons() {
  const bikeModal = document.getElementById('bike-modal');
  const closeBikeModal = () => bikeModal?.classList.add('modal-hidden');
  document.getElementById('close-bike-modal-btn')?.addEventListener('click', closeBikeModal);
  document.getElementById('cancel-bike-modal-btn')?.addEventListener('click', closeBikeModal);

  const qsModal = document.getElementById('quick-sale-modal');
  const closeQsModal = () => qsModal?.classList.add('modal-hidden');
  document.getElementById('close-qs-modal-btn')?.addEventListener('click', closeQsModal);
  document.getElementById('cancel-qs-modal-btn')?.addEventListener('click', closeQsModal);

  const refurbModal = document.getElementById('refurb-modal');
  const closeRefurbModal = () => refurbModal?.classList.add('modal-hidden');
  document.getElementById('close-refurb-modal-btn')?.addEventListener('click', closeRefurbModal);
  document.getElementById('done-refurb-modal-btn')?.addEventListener('click', closeRefurbModal);

  document.getElementById('close-invoice-modal-btn')?.addEventListener('click', () => {
    document.getElementById('invoice-modal')?.classList.add('modal-hidden');
  });
}

function getFilteredBikes() {
  return bikes.filter(bike => {
    if (currentFilterStatus !== 'ALL' && bike.status !== currentFilterStatus) return false;
    if (currentFilterBrand !== 'ALL' && bike.brand !== currentFilterBrand) return false;

    if (currentSearchQuery) {
      const q = currentSearchQuery;
      const matchBrand = (bike.brand || '').toLowerCase().includes(q);
      const matchModel = (bike.model || '').toLowerCase().includes(q);
      const matchReg = (bike.regNumber || '').toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
      const matchBuyer = (bike.buyerName || '').toLowerCase().includes(q);
      const matchSeller = (bike.sellerName || '').toLowerCase().includes(q);
      const matchChassis = (bike.chassisNumber || '').toLowerCase().includes(q);

      if (!matchBrand && !matchModel && !matchReg && !matchBuyer && !matchSeller && !matchChassis) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    const metricsA = getBikeProfitMetrics(a);
    const metricsB = getBikeProfitMetrics(b);

    switch (currentSort) {
      case 'date-desc':
        return new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0);
      case 'date-asc':
        return new Date(a.purchaseDate || 0) - new Date(b.purchaseDate || 0);
      case 'profit-desc':
        return metricsB.profit - metricsA.profit;
      case 'price-desc':
        return (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0);
      case 'price-asc':
        return (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0);
      case 'year-desc':
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      case 'km-asc':
        return (Number(a.odometerKm) || 0) - (Number(b.odometerKm) || 0);
      default:
        return 0;
    }
  });
}

function renderApp() {
  renderKPIs();
  renderStatusPillCounts();
  renderRecords();
  populateAnalyticsMonthSelector();
  updateAnalyticsMonthlyView();
  updateCharts();

  // Update Workshop Badge in nav
  const wsActiveCount = bikes.filter(b => b.status === 'Refurbishing').length;
  const navBadge = document.getElementById('nav-workshop-badge');
  if (navBadge) navBadge.textContent = wsActiveCount;
  const mobNavBadge = document.getElementById('mobile-nav-workshop-badge');
  if (mobNavBadge) mobNavBadge.textContent = wsActiveCount;
}

function renderKPIs() {
  let inStockCount = 0;
  let inStockInvested = 0;
  let soldCount = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalCostForSold = 0;
  let totalRefurbishOverall = 0;
  let reservedCount = 0;

  bikes.forEach(bike => {
    const costBasis = getCostBasis(bike);
    const refurbTotal = (bike.refurbishments || []).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    totalRefurbishOverall += refurbTotal;

    if (bike.status === 'In Stock' || bike.status === 'Refurbishing') {
      inStockCount++;
      inStockInvested += costBasis;
    } else if (bike.status === 'Sold') {
      soldCount++;
      const sellPrice = Number(bike.sellingPrice) || 0;
      totalRevenue += sellPrice;
      totalProfit += (sellPrice - costBasis);
      totalCostForSold += costBasis;
    } else if (bike.status === 'Reserved') {
      reservedCount++;
      inStockInvested += costBasis;
    }
  });

  const profitMarginPercent = totalCostForSold > 0 ? ((totalProfit / totalCostForSold) * 100).toFixed(1) : 0;

  const kpiStockCount = document.getElementById('kpi-stock-count');
  const kpiInventoryValue = document.getElementById('kpi-inventory-value');
  const kpiSoldCount = document.getElementById('kpi-sold-count');
  const kpiSalesRevenue = document.getElementById('kpi-sales-revenue');
  const kpiNetProfit = document.getElementById('kpi-net-profit');
  const kpiProfitMargin = document.getElementById('kpi-profit-margin');
  const kpiRefurbishTotal = document.getElementById('kpi-refurbish-total');
  const kpiReservedCount = document.getElementById('kpi-reserved-count');

  if (kpiStockCount) kpiStockCount.textContent = inStockCount;
  if (kpiInventoryValue) kpiInventoryValue.textContent = formatCurrency(inStockInvested);
  if (kpiSoldCount) kpiSoldCount.textContent = soldCount;
  if (kpiSalesRevenue) kpiSalesRevenue.textContent = formatCurrency(totalRevenue);
  if (kpiNetProfit) {
    kpiNetProfit.textContent = (totalProfit >= 0 ? '+' : '') + formatCurrency(totalProfit);
    kpiNetProfit.className = `text-3xl font-extrabold font-mono-numbers ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (kpiProfitMargin) kpiProfitMargin.textContent = `${profitMarginPercent}% Net Margin`;
  if (kpiRefurbishTotal) kpiRefurbishTotal.textContent = formatCurrency(totalRefurbishOverall);
  if (kpiReservedCount) kpiReservedCount.textContent = `${reservedCount} reserved`;
}

function renderStatusPillCounts() {
  const counts = { ALL: bikes.length, 'In Stock': 0, 'Sold': 0, 'Reserved': 0, 'Refurbishing': 0 };
  bikes.forEach(b => {
    if (counts[b.status] !== undefined) counts[b.status]++;
  });

  document.getElementById('count-all').textContent = `(${counts.ALL})`;
  document.getElementById('count-instock').textContent = `(${counts['In Stock']})`;
  document.getElementById('count-sold').textContent = `(${counts['Sold']})`;
  document.getElementById('count-reserved').textContent = `(${counts['Reserved']})`;
  document.getElementById('count-refurbishing').textContent = `(${counts['Refurbishing']})`;
}

function getStatusBadge(status) {
  switch (status) {
    case 'In Stock':
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-instock">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> In Stock
              </span>`;
    case 'Sold':
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-sold">
                <i data-lucide="check" class="w-3 h-3"></i> Sold
              </span>`;
    case 'Reserved':
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-reserved">
                <i data-lucide="clock" class="w-3 h-3"></i> Reserved
              </span>`;
    case 'Refurbishing':
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-refurbishing">
                <i data-lucide="wrench" class="w-3 h-3"></i> In Workshop
              </span>`;
    default:
      return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">${status}</span>`;
  }
}

function renderRecords() {
  const filtered = getFilteredBikes();
  const tableView = document.getElementById('table-view');
  const gridView = document.getElementById('grid-view');
  const emptyState = document.getElementById('empty-state');
  const tbody = document.getElementById('bikes-table-body');

  if (filtered.length === 0) {
    tableView?.classList.add('hidden');
    gridView?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  if (currentViewMode === 'table') {
    tableView?.classList.remove('hidden');
    gridView?.classList.add('hidden');
    renderTableView(filtered, tbody);
  } else {
    gridView?.classList.remove('hidden');
    tableView?.classList.add('hidden');
    renderGridView(filtered, gridView);
  }

  lucide.createIcons();
}

function renderTableView(list, tbody) {
  if (!tbody) return;

  tbody.innerHTML = list.map(bike => {
    const metrics = getBikeProfitMetrics(bike);
    const refurbTotal = (bike.refurbishments || []).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    const isSold = bike.status === 'Sold';
    
    let profitBadge = '';
    if (isSold) {
      const isPositive = metrics.profit >= 0;
      profitBadge = `
        <div class="flex flex-col">
          <span class="font-mono-numbers font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}">
            ${isPositive ? '+' : ''}${formatCurrency(metrics.profit)}
          </span>
          <span class="text-[10px] ${isPositive ? 'text-emerald-300' : 'text-rose-300'} font-medium">
            ${isPositive ? '+' : ''}${metrics.margin.toFixed(1)}% margin
          </span>
        </div>
      `;
    } else {
      profitBadge = `
        <div class="flex flex-col text-slate-400">
          <span class="text-[11px] font-mono-numbers font-medium">Est. ${metrics.profit >= 0 ? '+' : ''}${formatCurrency(metrics.profit)}</span>
          <span class="text-[10px] text-slate-400">Cost: ${formatCurrency(metrics.costBasis)}</span>
        </div>
      `;
    }

    const bikeImage = bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80';

    return `
      <tr class="table-row-hover transition-colors border-b border-slate-800/80">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <img src="${bikeImage}" alt="${bike.brand} ${bike.model}" class="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/60 shadow-sm flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80'">
            <div>
              <div class="font-bold text-white text-sm hover:text-brand-400 transition-colors flex items-center gap-2">
                ${bike.brand} ${bike.model}
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-normal">${bike.year}</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono-numbers flex items-center gap-2 mt-0.5">
                <span class="font-bold text-brand-400 uppercase tracking-wider">${bike.regNumber}</span>
                ${bike.variant ? `<span>•</span><span>${bike.variant}</span>` : ''}
              </div>
            </div>
          </div>
        </td>

        <td class="py-3.5 px-3">
          <div class="text-[11px] space-y-0.5">
            <div class="font-bold text-slate-200">${bike.engineCC ? bike.engineCC + ' CC' : 'Standard'}</div>
            <div class="text-slate-400">${bike.year || ''} ${bike.variant ? '• ' + bike.variant : ''}</div>
          </div>
        </td>

        <td class="py-3.5 px-3">
          <div class="text-[11px] space-y-0.5">
            <div class="font-bold font-mono-numbers text-slate-100">${formatCurrency(bike.purchasePrice)}</div>
            <div class="text-slate-400 truncate max-w-[120px]" title="${bike.sellerName}">From: <span class="text-slate-300">${bike.sellerName}</span></div>
            <div class="text-[10px] text-slate-400">${bike.purchaseDate || 'N/A'}</div>
          </div>
        </td>

        <td class="py-3.5 px-3">
          <div class="text-[11px]">
            <button onclick="openWorkshopJobModal('${bike.id}')" class="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 transition-colors" title="Manage Workshop Costs in Hub">
              <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
              <span class="font-mono-numbers font-semibold">${formatCurrency(refurbTotal)}</span>
              <span class="text-[10px] text-purple-400 opacity-75 group-hover:opacity-100">(${bike.refurbishments?.length || 0})</span>
            </button>
          </div>
        </td>

        <td class="py-3.5 px-3">
          <div class="space-y-1">
            ${getStatusBadge(bike.status)}
            ${isSold ? `
              <div class="text-[11px] font-mono-numbers font-bold text-blue-400">${formatCurrency(bike.sellingPrice)}</div>
              <div class="text-[10px] text-slate-400 truncate max-w-[130px]" title="${bike.buyerName}">To: <span class="text-slate-300">${bike.buyerName}</span></div>
            ` : `
              <div class="text-[11px] text-slate-400">Target: <span class="font-mono-numbers text-slate-200">${formatCurrency(bike.sellingPrice)}</span></div>
            `}
          </div>
        </td>

        <td class="py-3.5 px-3">
          ${profitBadge}
        </td>

        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${bike.status === 'In Stock' || bike.status === 'Refurbishing' || bike.status === 'Reserved' ? `
              <button onclick="openQuickSaleModal('${bike.id}')" class="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-semibold text-[11px] shadow transition-colors flex items-center gap-1" title="Record Sale">
                <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Sell</span>
              </button>
            ` : ''}

            <button onclick="generateBillOfSale('${bike.id}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors" title="Print Bill of Sale / Challan">
              <i data-lucide="printer" class="w-3.5 h-3.5 text-brand-400"></i>
            </button>

            <button onclick="openBikeModal('${bike.id}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors" title="Edit Record">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>

            <button onclick="deleteBikeRecord('${bike.id}')" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors" title="Delete Record">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderGridView(list, grid) {
  if (!grid) return;

  grid.innerHTML = list.map(bike => {
    const metrics = getBikeProfitMetrics(bike);
    const refurbTotal = (bike.refurbishments || []).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    const isSold = bike.status === 'Sold';
    const bikeImage = bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80';

    return `
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between group">
        <div>
          <div class="relative h-48 bg-slate-900 overflow-hidden">
            <img src="${bikeImage}" alt="${bike.brand} ${bike.model}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40"></div>
            
            <div class="absolute top-3 left-3">
              ${getStatusBadge(bike.status)}
            </div>

            <div class="absolute top-3 right-3">
              <span class="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-mono-numbers text-xs font-bold border border-white/10 uppercase">
                ${bike.regNumber}
              </span>
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <span class="text-xs text-brand-400 font-semibold tracking-wide uppercase">${bike.brand}</span>
                <h3 class="text-base font-extrabold text-white leading-tight">${bike.model}</h3>
              </div>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800/80 backdrop-blur text-slate-300 font-mono-numbers">${bike.year}</span>
            </div>
          </div>

          <div class="p-4 grid grid-cols-2 gap-2 border-b border-slate-800 text-center text-[11px] bg-surface-850/40">
            <div class="p-1.5 rounded-lg bg-surface-800/50">
              <span class="text-slate-400 block text-[10px]">Engine Capacity</span>
              <span class="font-bold text-slate-200">${bike.engineCC ? bike.engineCC + ' CC' : 'Standard'}</span>
            </div>
            <div class="p-1.5 rounded-lg bg-surface-800/50">
              <span class="text-slate-400 block text-[10px]">Make Year</span>
              <span class="font-bold text-brand-400 font-mono-numbers">${bike.year || '2023'}</span>
            </div>
          </div>

          <div class="p-4 space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Purchase Price:</span>
              <span class="font-mono-numbers text-slate-200 font-semibold">${formatCurrency(bike.purchasePrice)}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span class="flex items-center gap-1 cursor-pointer hover:text-purple-300" onclick="openWorkshopJobModal('${bike.id}')">
                <i data-lucide="wrench" class="w-3 h-3 text-purple-400"></i> Workshop Costs:
              </span>
              <span class="font-mono-numbers text-purple-300 font-semibold">${formatCurrency(refurbTotal)}</span>
            </div>
            <div class="flex justify-between text-slate-200 font-bold pt-1.5 border-t border-slate-800">
              <span>${isSold ? 'Sold Price:' : 'Target Price:'}</span>
              <span class="font-mono-numbers ${isSold ? 'text-blue-400 text-sm' : 'text-slate-100'}">${formatCurrency(bike.sellingPrice)}</span>
            </div>

            <div class="p-2.5 rounded-xl ${isSold ? (metrics.profit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-rose-500/10 border border-rose-500/25') : 'bg-surface-800 border border-slate-700/60'} flex items-center justify-between mt-2">
              <span class="text-[11px] text-slate-400">${isSold ? 'Realized Net Profit:' : 'Projected Profit:'}</span>
              <div class="text-right">
                <span class="font-mono-numbers font-extrabold ${metrics.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                  ${metrics.profit >= 0 ? '+' : ''}${formatCurrency(metrics.profit)}
                </span>
                <span class="text-[10px] block ${metrics.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-semibold">
                  (${metrics.margin >= 0 ? '+' : ''}${metrics.margin.toFixed(1)}%)
                </span>
              </div>
            </div>

            ${isSold && bike.buyerName ? `
              <div class="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                <i data-lucide="user" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Sold to <strong class="text-slate-200">${bike.buyerName}</strong> on ${bike.saleDate || 'N/A'}</span>
              </div>
            ` : `
              <div class="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Bought from <strong class="text-slate-200">${bike.sellerName}</strong></span>
              </div>
            `}
          </div>
        </div>

        <div class="p-4 pt-0 flex items-center justify-between gap-2">
          ${bike.status !== 'Sold' ? `
            <button onclick="openQuickSaleModal('${bike.id}')" class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5">
              <i data-lucide="badge-dollar-sign" class="w-4 h-4"></i>
              Mark Sold
            </button>
          ` : `
            <button onclick="generateBillOfSale('${bike.id}')" class="flex-1 py-2 px-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
              <i data-lucide="file-text" class="w-4 h-4"></i>
              Bill of Sale
            </button>
          `}

          <div class="flex items-center gap-1">
            <button onclick="openWorkshopJobModal('${bike.id}')" class="w-8 h-8 rounded-xl bg-surface-800 hover:bg-purple-500/20 hover:text-purple-300 text-slate-400 flex items-center justify-center transition-colors" title="Manage Workshop Costs">
              <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openBikeModal('${bike.id}')" class="w-8 h-8 rounded-xl bg-surface-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors" title="Edit Bike">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteBikeRecord('${bike.id}')" class="w-8 h-8 rounded-xl bg-surface-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors" title="Delete Bike">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 6. BIKE CRUD, QUICK SALE & BILL OF SALE
// ============================================================================

let formRefurbishments = [];

function openBikeModal(bikeId = null) {
  const modal = document.getElementById('bike-modal');
  const title = document.getElementById('bike-modal-title');
  const form = document.getElementById('bike-form');
  const formId = document.getElementById('form-bike-id');
  const lookupBadge = document.getElementById('modal-reg-lookup-badge');

  lookupBadge?.classList.add('hidden');

  if (bikeId) {
    const bike = bikes.find(b => b.id === bikeId);
    if (!bike) return;

    title.textContent = `Edit Record: ${bike.brand} ${bike.model} (${bike.regNumber})`;
    formId.value = bike.id;

    document.getElementById('form-brand').value = bike.brand || '';
    document.getElementById('form-model').value = bike.model || '';
    const variantEl = document.getElementById('form-variant');
    if (variantEl) variantEl.value = bike.variant || '';
    document.getElementById('form-reg-number').value = bike.regNumber || '';
    document.getElementById('form-year').value = bike.year || 2023;
    document.getElementById('form-engine-cc').value = bike.engineCC || '';

    document.getElementById('form-purchase-date').value = bike.purchaseDate || '';
    document.getElementById('form-purchase-price').value = bike.purchasePrice || '';
    document.getElementById('form-seller-name').value = bike.sellerName || '';
    document.getElementById('form-seller-phone').value = bike.sellerPhone || '';

    document.getElementById('form-status').value = bike.status || 'In Stock';
    document.getElementById('form-selling-price').value = bike.sellingPrice || '';
    document.getElementById('form-sale-date').value = bike.saleDate || '';
    document.getElementById('form-buyer-name').value = bike.buyerName || '';
    document.getElementById('form-buyer-phone').value = bike.buyerPhone || '';

    formRefurbishments = (bike.refurbishments || []).map(r => ({ ...r }));
  } else {
    title.textContent = 'Add Motorcycle Record';
    form.reset();
    formId.value = '';
    document.getElementById('form-purchase-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-year').value = new Date().getFullYear();
    document.getElementById('form-status').value = 'In Stock';
    formRefurbishments = [];
  }

  // Clear inline refurbishment fields
  const inlineDesc = document.getElementById('form-refurb-desc-inline');
  const inlineCost = document.getElementById('form-refurb-cost-inline');
  if (inlineDesc) inlineDesc.value = '';
  if (inlineCost) inlineCost.value = '';

  renderFormRefurbishments();
  updateFormCalculatedProfit();

  modal?.classList.remove('modal-hidden');
  lucide.createIcons();
}

/**
 * Live auto-lookup in Add Motorcycle Modal by Registration No.
 * Entering an existing Registration No. immediately populates specifications & buying details,
 * allowing the user to seamlessly add Section 4 Selling Information anytime.
 */
function setupModalRegistrationLookup() {
  const regInput = document.getElementById('form-reg-number');
  const lookupBadge = document.getElementById('modal-reg-lookup-badge');
  const lookupText = document.getElementById('modal-reg-lookup-text');

  if (!regInput) return;

  const handleLookup = () => {
    const rawReg = regInput.value.trim();
    const cleanReg = normalizeReg(rawReg);

    if (!cleanReg) {
      lookupBadge?.classList.add('hidden');
      return;
    }

    const currentEditingId = document.getElementById('form-bike-id')?.value;
    const existingBike = bikes.find(b => normalizeReg(b.regNumber) === cleanReg);

    if (existingBike && (!currentEditingId || existingBike.id !== currentEditingId)) {
      // Auto-populate specifications, purchase, and selling details
      document.getElementById('form-bike-id').value = existingBike.id;
      document.getElementById('form-brand').value = existingBike.brand || '';
      document.getElementById('form-model').value = existingBike.model || '';
      document.getElementById('form-year').value = existingBike.year || new Date().getFullYear();
      document.getElementById('form-engine-cc').value = existingBike.engineCC || '';
      document.getElementById('form-purchase-date').value = existingBike.purchaseDate || '';
      document.getElementById('form-purchase-price').value = existingBike.purchasePrice || 0;
      document.getElementById('form-seller-name').value = existingBike.sellerName || '';
      document.getElementById('form-seller-phone').value = existingBike.sellerPhone || '';

      // Section 4 Selling Information
      document.getElementById('form-status').value = existingBike.status || 'In Stock';
      document.getElementById('form-selling-price').value = existingBike.sellingPrice || '';
      document.getElementById('form-sale-date').value = existingBike.saleDate || '';
      document.getElementById('form-buyer-name').value = existingBike.buyerName || '';
      document.getElementById('form-buyer-phone').value = existingBike.buyerPhone || '';

      formRefurbishments = (existingBike.refurbishments || []).map(r => ({ ...r }));
      renderFormRefurbishments();
      updateFormCalculatedProfit();

      const modalTitle = document.getElementById('bike-modal-title');
      if (modalTitle) {
        modalTitle.textContent = `Update Record: ${existingBike.brand} ${existingBike.model} (${existingBike.regNumber})`;
      }

      if (lookupBadge && lookupText) {
        lookupText.textContent = `Found in Database: ${existingBike.brand} ${existingBike.model} (${existingBike.year}) • Status: ${existingBike.status}. Loaded! Fill Section 4 below to add/update selling information.`;
        lookupBadge.classList.remove('hidden');
      }
    } else if (!existingBike && !currentEditingId) {
      lookupBadge?.classList.add('hidden');
    }
  };

  regInput.addEventListener('input', handleLookup);
  regInput.addEventListener('change', handleLookup);
}

function renderFormRefurbishments() {
  const container = document.getElementById('form-refurb-list');
  const totalEl = document.getElementById('form-refurb-total');
  if (!container) return;

  if (formRefurbishments.length === 0) {
    container.innerHTML = `<div class="text-[11px] text-slate-500 italic py-1">No repair/refurbishment expenses logged yet.</div>`;
    if (totalEl) totalEl.textContent = formatCurrency(0);
    return;
  }

  let total = 0;
  container.innerHTML = formRefurbishments.map((item, index) => {
    total += Number(item.cost) || 0;
    return `
      <div class="flex items-center justify-between gap-2 bg-surface-850 p-2 rounded-lg border border-slate-800">
        <div class="flex-1">
          <span class="text-slate-200 font-medium block">${item.description}</span>
          <span class="text-[10px] text-slate-500">${item.date || 'No date'}</span>
        </div>
        <span class="font-mono-numbers font-bold text-purple-300 text-xs">${formatCurrency(item.cost)}</span>
        <button type="button" onclick="removeFormRefurbItem(${index})" class="text-slate-500 hover:text-rose-400 p-1">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = formatCurrency(total);
  lucide.createIcons();
}

function removeFormRefurbItem(index) {
  formRefurbishments.splice(index, 1);
  renderFormRefurbishments();
  updateFormCalculatedProfit();
}

// Inline Add Repair button in Bike Modal
document.getElementById('form-add-refurb-inline-btn')?.addEventListener('click', () => {
  const descInput = document.getElementById('form-refurb-desc-inline');
  const costInput = document.getElementById('form-refurb-cost-inline');

  const desc = descInput?.value.trim();
  const cost = parseFloat(costInput?.value);

  if (!desc) {
    alert('Please enter a description for the repair/refurbishment expense.');
    descInput?.focus();
    return;
  }
  if (isNaN(cost) || cost < 0) {
    alert('Please enter a valid cost amount in ₹.');
    costInput?.focus();
    return;
  }

  formRefurbishments.push({
    id: 'ref-' + Date.now(),
    description: desc,
    cost: cost,
    date: new Date().toISOString().split('T')[0]
  });

  if (descInput) descInput.value = '';
  if (costInput) costInput.value = '';

  renderFormRefurbishments();
  updateFormCalculatedProfit();
});

document.getElementById('form-add-refurb-btn')?.addEventListener('click', () => {
  const desc = prompt('Enter Expense Description (e.g., New Battery, Detailing, Brake Pad):');
  if (!desc || !desc.trim()) return;

  const costStr = prompt('Enter Expense Cost in ₹:');
  const cost = parseFloat(costStr);
  if (isNaN(cost) || cost < 0) {
    alert('Invalid cost entered');
    return;
  }

  formRefurbishments.push({
    id: 'ref-' + Date.now(),
    description: desc.trim(),
    cost: cost,
    date: new Date().toISOString().split('T')[0]
  });

  renderFormRefurbishments();
  updateFormCalculatedProfit();
});

function setupFormLiveCalculations() {
  document.getElementById('form-purchase-price')?.addEventListener('input', updateFormCalculatedProfit);
  document.getElementById('form-selling-price')?.addEventListener('input', updateFormCalculatedProfit);
}

function updateFormCalculatedProfit() {
  const buy = parseFloat(document.getElementById('form-purchase-price')?.value) || 0;
  const sell = parseFloat(document.getElementById('form-selling-price')?.value) || 0;
  const refurbTotal = formRefurbishments.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  const costBasis = buy + refurbTotal;
  const profit = sell - costBasis;
  const margin = costBasis > 0 ? (profit / costBasis) * 100 : 0;

  const profitEl = document.getElementById('form-calc-profit');
  const marginEl = document.getElementById('form-calc-margin');

  if (profitEl) {
    profitEl.textContent = (profit >= 0 ? '+' : '') + formatCurrency(profit);
    profitEl.className = `font-bold text-sm font-mono-numbers ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (marginEl) {
    marginEl.textContent = `(${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%)`;
    marginEl.className = `text-xs px-2 py-0.5 rounded font-semibold ${margin >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`;
  }
}

function handleSaveBikeRecord() {
  const brand = document.getElementById('form-brand')?.value.trim();
  const model = document.getElementById('form-model')?.value.trim();
  const regNumber = document.getElementById('form-reg-number')?.value.trim().toUpperCase();
  const purchasePrice = parseFloat(document.getElementById('form-purchase-price')?.value);
  const sellerName = document.getElementById('form-seller-name')?.value.trim() || 'Previous Owner';

  if (!brand || !model || !regNumber || isNaN(purchasePrice) || purchasePrice < 0) {
    alert('Please fill mandatory fields: Brand, Model, Registration No., and non-negative Purchase Price.');
    return;
  }

  // Include any pending inline refurbishment input before saving
  const inlineDesc = document.getElementById('form-refurb-desc-inline')?.value.trim();
  const inlineCost = parseFloat(document.getElementById('form-refurb-cost-inline')?.value);
  if (inlineDesc && !isNaN(inlineCost) && inlineCost > 0) {
    formRefurbishments.push({
      id: 'ref-' + Date.now(),
      description: inlineDesc,
      cost: inlineCost,
      date: new Date().toISOString().split('T')[0]
    });
  }

  const cleanReg = normalizeReg(regNumber);
  const existingId = document.getElementById('form-bike-id')?.value;
  // If existingId is not set, also check if bikes already has this registration number
  const matchedBike = existingId ? bikes.find(b => b.id === existingId) : bikes.find(b => normalizeReg(b.regNumber) === cleanReg);

  const sellingPrice = parseFloat(document.getElementById('form-selling-price')?.value) || 0;
  const saleDate = document.getElementById('form-sale-date')?.value || '';
  const buyerName = document.getElementById('form-buyer-name')?.value.trim() || '';
  const buyerPhone = document.getElementById('form-buyer-phone')?.value.trim() || '';
  let status = document.getElementById('form-status')?.value || 'In Stock';

  // Auto-set status to Sold if selling details provided and currently In Stock
  if (sellingPrice > 0 && (saleDate || buyerName) && status === 'In Stock') {
    status = 'Sold';
  }

  const bikeRecord = {
    id: matchedBike ? matchedBike.id : `BIKE-${new Date().getFullYear()}-${String(bikes.length + 1).padStart(3, '0')}`,
    brand: brand,
    model: model,
    variant: document.getElementById('form-variant')?.value.trim() || matchedBike?.variant || '',
    regNumber: regNumber,
    year: parseInt(document.getElementById('form-year')?.value) || new Date().getFullYear(),
    engineCC: parseInt(document.getElementById('form-engine-cc')?.value) || null,
    odometerKm: matchedBike?.odometerKm || 0,
    color: matchedBike?.color || '',
    condition: matchedBike?.condition || 'Good',
    chassisNumber: matchedBike?.chassisNumber || '',
    engineNumber: matchedBike?.engineNumber || '',
    image: matchedBike?.image || '',

    purchaseDate: document.getElementById('form-purchase-date')?.value || new Date().toISOString().split('T')[0],
    sellerName: sellerName,
    sellerPhone: document.getElementById('form-seller-phone')?.value.trim() || '',
    sellerAddress: matchedBike?.sellerAddress || '',
    sellerIdProof: matchedBike?.sellerIdProof || '',
    purchasePrice: purchasePrice,

    refurbishments: formRefurbishments,

    // Section 4: Selling Information & Status (Not mandatory - scalable anytime)
    status: status,
    sellingPrice: sellingPrice,
    saleDate: saleDate,
    buyerName: buyerName,
    buyerPhone: buyerPhone,
    buyerAddress: matchedBike?.buyerAddress || '',
    paymentMode: matchedBike?.paymentMode || '',
    saleNotes: matchedBike?.saleNotes || '',

    rcStatus: matchedBike?.rcStatus || 'Original Available',
    insuranceValidTill: matchedBike?.insuranceValidTill || '',
    pucValidTill: matchedBike?.pucValidTill || '',
    nocAvailable: matchedBike?.nocAvailable ?? true,
    createdAt: matchedBike?.createdAt || new Date().toISOString()
  };

  if (matchedBike) {
    const idx = bikes.findIndex(b => b.id === matchedBike.id);
    if (idx !== -1) {
      bikes[idx] = bikeRecord;
    } else {
      bikes.unshift(bikeRecord);
    }
  } else {
    bikes.unshift(bikeRecord);
  }

  saveData();
  document.getElementById('bike-modal')?.classList.add('modal-hidden');
  renderApp();
  renderWorkshopHub();
}

function deleteBikeRecord(bikeId) {
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike) return;

  if (confirm(`Are you sure you want to delete the record for ${bike.brand} ${bike.model} (${bike.regNumber})? This cannot be undone.`)) {
    bikes = bikes.filter(b => b.id !== bikeId);
    saveData();
    renderApp();
    renderWorkshopHub();
  }
}

function openQuickSaleModal(bikeId) {
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike) return;

  const modal = document.getElementById('quick-sale-modal');
  document.getElementById('qs-bike-id').value = bike.id;
  document.getElementById('qs-bike-title').textContent = `${bike.brand} ${bike.model} • ${bike.regNumber}`;

  const costBasis = getCostBasis(bike);
  const refurbTotal = (bike.refurbishments || []).reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  document.getElementById('qs-cost-purchase').textContent = formatCurrency(bike.purchasePrice);
  document.getElementById('qs-cost-refurb').textContent = formatCurrency(refurbTotal);
  document.getElementById('qs-cost-total').textContent = formatCurrency(costBasis);

  const targetPrice = bike.sellingPrice || (costBasis * 1.2);
  document.getElementById('qs-selling-price').value = targetPrice;
  document.getElementById('qs-sale-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('qs-buyer-name').value = bike.buyerName || '';
  document.getElementById('qs-buyer-phone').value = bike.buyerPhone || '';

  updateQuickSaleProfitPreview();

  modal?.classList.remove('modal-hidden');
  lucide.createIcons();
}

function updateQuickSaleProfitPreview() {
  const bikeId = document.getElementById('qs-bike-id')?.value;
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike) return;

  const costBasis = getCostBasis(bike);
  const sellPrice = parseFloat(document.getElementById('qs-selling-price')?.value) || 0;
  const profit = sellPrice - costBasis;
  const margin = costBasis > 0 ? (profit / costBasis) * 100 : 0;

  const profitEl = document.getElementById('qs-calc-profit');
  const marginEl = document.getElementById('qs-calc-margin');

  if (profitEl) {
    profitEl.textContent = (profit >= 0 ? '+' : '') + formatCurrency(profit);
    profitEl.className = `text-lg font-extrabold font-mono-numbers ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (marginEl) {
    marginEl.textContent = `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}% Margin`;
    marginEl.className = `text-xs px-2.5 py-1 rounded-full font-bold ${margin >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`;
  }
}

function handleQuickSaleSubmit(e) {
  e.preventDefault();
  const bikeId = document.getElementById('qs-bike-id')?.value;
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike) return;

  const buyerName = document.getElementById('qs-buyer-name')?.value.trim();
  const buyerPhone = document.getElementById('qs-buyer-phone')?.value.trim();
  const saleDate = document.getElementById('qs-sale-date')?.value;
  const sellingPrice = parseFloat(document.getElementById('qs-selling-price')?.value);

  if (!buyerName || !buyerPhone || !saleDate || isNaN(sellingPrice)) {
    alert('Please fill all required sale details.');
    return;
  }

  bike.status = 'Sold';
  bike.buyerName = buyerName;
  bike.buyerPhone = buyerPhone;
  bike.saleDate = saleDate;
  bike.sellingPrice = sellingPrice;

  saveData();
  document.getElementById('quick-sale-modal')?.classList.add('modal-hidden');
  renderApp();
  renderWorkshopHub();

  triggerCelebrationConfetti();
}

function triggerCelebrationConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function generateBillOfSale(bikeId) {
  const bike = bikes.find(b => b.id === bikeId);
  if (!bike) return;

  const modal = document.getElementById('invoice-modal');
  const container = document.getElementById('printable-invoice-container');
  if (!container) return;

  const invoiceNo = `FXM-INV-${bike.id.replace('BIKE-', '')}-${new Date().getFullYear()}`;
  const dealDate = bike.saleDate || new Date().toISOString().split('T')[0];
  const costBasis = getCostBasis(bike);
  const sellingPrice = bike.sellingPrice || (costBasis * 1.2);

  container.innerHTML = `
    <div class="border-b-2 border-slate-900 pb-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <img src="logo.jpg" alt="FastX Moto Logo" class="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-sm">
            <div>
              <span class="text-3xl font-black tracking-tight text-slate-900">FastX<span class="text-orange-600">Moto</span></span>
              <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-900 text-white ml-2">Dealership</span>
            </div>
          </div>
          <p class="text-xs text-slate-600 font-medium">Certified Pre-Owned Motorcycles & Sales Documentation</p>
          <p class="text-[11px] text-slate-500 mt-1">Plot 42, FastX Auto Hub, Main Ring Road, Pune - 411038</p>
          <p class="text-[11px] text-slate-500">Phone: +91 98200 99880 | Email: sales@fastxmoto.com</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider rounded mb-2">
            Delivery Challan & Bill of Sale
          </span>
          <div class="text-xs space-y-0.5 text-slate-600">
            <div><strong class="text-slate-900">Invoice No:</strong> <span class="font-mono text-slate-900 font-bold">${invoiceNo}</span></div>
            <div><strong class="text-slate-900">Date of Sale:</strong> ${dealDate}</div>
            <div><strong class="text-slate-900">Record ID:</strong> ${bike.id}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600 block mb-1">Sold To (Buyer / New Owner)</span>
        <div class="font-bold text-slate-900 text-sm mb-1">${bike.buyerName || 'Valued Customer / Direct Sale'}</div>
        <div class="text-slate-600 space-y-0.5">
          <div><strong>Phone:</strong> ${bike.buyerPhone || 'N/A'}</div>
          <div><strong>Status:</strong> Delivery Accepted / Form 29 & 30 Executed</div>
        </div>
      </div>
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Previous Registered Owner (Seller)</span>
        <div class="font-bold text-slate-900 text-sm mb-1">${bike.sellerName}</div>
        <div class="text-slate-600 space-y-0.5">
          <div><strong>Contact:</strong> ${bike.sellerPhone || 'N/A'}</div>
          <div><strong>Clearance:</strong> NOC & RTO Endorsed</div>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-900 block mb-2">Motorcycle Technical Schedule</span>
      <table class="w-full text-left text-xs border border-slate-200">
        <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
          <tr>
            <th class="p-2.5">Make & Model</th>
            <th class="p-2.5">Reg. Number</th>
            <th class="p-2.5">Year</th>
            <th class="p-2.5">Engine CC</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-slate-800">
          <tr>
            <td class="p-2.5 font-bold">${bike.brand} ${bike.model} <span class="text-slate-500 font-normal">(${bike.variant || 'Standard'})</span></td>
            <td class="p-2.5 font-mono font-bold text-orange-600 uppercase">${bike.regNumber}</td>
            <td class="p-2.5 font-mono">${bike.year}</td>
            <td class="p-2.5">${bike.engineCC ? bike.engineCC + ' CC' : 'Standard'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mb-6">
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-900 block mb-2">Financial Statement</span>
      <table class="w-full text-xs text-left border border-slate-200">
        <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
          <tr>
            <th class="p-2.5">Description</th>
            <th class="p-2.5 text-center">Qty</th>
            <th class="p-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-slate-800">
          <tr>
            <td class="p-2.5">
              <div class="font-bold">Agreed Vehicle Consideration Price</div>
              <div class="text-[11px] text-slate-500">Includes complete physical handover, keys, tool kit, and original documents.</div>
            </td>
            <td class="p-2.5 text-center">1</td>
            <td class="p-2.5 text-right font-mono font-bold">${formatCurrency(sellingPrice)}</td>
          </tr>
          <tr>
            <td class="p-2.5">
              <div class="font-bold">RTO Ownership Transfer & Documentation Handling</div>
              <div class="text-[11px] text-slate-500">Form 29 & 30 preparation, Police clearance verification, NOC processing.</div>
            </td>
            <td class="p-2.5 text-center">1</td>
            <td class="p-2.5 text-right font-mono text-emerald-600 font-semibold">Included / Free</td>
          </tr>
        </tbody>
        <tfoot class="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
          <tr>
            <td colspan="2" class="p-3 text-right uppercase text-xs">Total Amount Paid in Full:</td>
            <td class="p-3 text-right font-mono text-base text-orange-600">${formatCurrency(sellingPrice)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="mt-2 text-[11px] text-slate-600 flex justify-between">
        <span><strong>Handover Status:</strong> Verified & Keys Handed Over</span>
        <span><strong>Deal Clearance:</strong> Verified & Final</span>
      </div>
    </div>

    <div class="mb-8 p-3 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
      <div class="font-bold text-slate-800 uppercase">Terms of Sale & Legal Handover Undertaking:</div>
      <ol class="list-decimal pl-4 space-y-0.5">
        <li>The Buyer has thoroughly inspected, test-driven, and accepted the motorcycle in its current "as-is, where-is" mechanical condition.</li>
        <li>From the date and exact hour of delivery (${dealDate}), all traffic challans, third-party civil/criminal liabilities, and road usage shall be the sole responsibility of the Buyer.</li>
        <li>The Buyer undertakes to complete the RTO ownership transfer within 30 days of receiving Form 29 & 30.</li>
        <li>FastXMoto guarantees clear vehicle title free of hypothecation or stolen claims.</li>
      </ol>
    </div>

    <div class="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-center text-xs">
      <div>
        <div class="h-12 border-b border-dashed border-slate-400 mb-2"></div>
        <span class="font-bold text-slate-900 block">Buyer's Signature</span>
        <span class="text-[10px] text-slate-500">I accept delivery & vehicle condition</span>
      </div>
      <div>
        <div class="h-12 border-b border-dashed border-slate-400 mb-2"></div>
        <span class="font-bold text-slate-900 block">Previous Owner / Seller</span>
        <span class="text-[10px] text-slate-500">Title transferred</span>
      </div>
      <div>
        <div class="h-12 border-b border-dashed border-slate-400 mb-2 flex items-center justify-center">
          <span class="text-[11px] font-mono text-slate-400">[ SEAL / SIGNATURE ]</span>
        </div>
        <span class="font-bold text-slate-900 block">FastXMoto Dealership</span>
        <span class="text-[10px] text-slate-500">Authorized Signatory</span>
      </div>
    </div>
  `;

  modal?.classList.remove('modal-hidden');
  lucide.createIcons();
}

// ============================================================================
// 7. CHART.JS INTEGRATION
// ============================================================================

function initCharts() {
  const finCtx = document.getElementById('financials-chart')?.getContext('2d');
  const brandCtx = document.getElementById('brand-chart')?.getContext('2d');

  if (finCtx) {
    financialsChart = new Chart(finCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Sales Revenue',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Purchase & Repairs Cost',
            data: [],
            backgroundColor: 'rgba(168, 85, 247, 0.65)',
            borderColor: '#a855f7',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Net Profit',
            data: [],
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (val) => formatCurrency(val)
            }
          }
        }
      }
    });
  }

  if (brandCtx) {
    brandChart = new Chart(brandCtx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#f97316', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 }, boxWidth: 12 }
          }
        },
        cutout: '65%'
      }
    });
  }
}

let selectedAnalyticsMonth = 'ALL';
let selectedMonthlyActivityFilter = 'ALL';

function formatMonthKeyName(monthKey) {
  if (!monthKey || monthKey === 'ALL') return 'All Time';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function populateAnalyticsMonthSelector() {
  const select = document.getElementById('analytics-month-select');
  if (!select) return;

  const monthsSet = new Set();
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  monthsSet.add(currentMonthKey);

  bikes.forEach(bike => {
    if (bike.purchaseDate && bike.purchaseDate.length >= 7) {
      monthsSet.add(bike.purchaseDate.substring(0, 7));
    }
    if (bike.saleDate && bike.saleDate.length >= 7) {
      monthsSet.add(bike.saleDate.substring(0, 7));
    }
    (bike.refurbishments || []).forEach(r => {
      if (r.date && r.date.length >= 7) {
        monthsSet.add(r.date.substring(0, 7));
      }
    });
  });

  const sortedMonths = Array.from(monthsSet).sort().reverse();

  let optionsHtml = `<option value="ALL" ${selectedAnalyticsMonth === 'ALL' ? 'selected' : ''}>All Time (Cumulative)</option>`;
  sortedMonths.forEach(m => {
    const isSelected = selectedAnalyticsMonth === m ? 'selected' : '';
    optionsHtml += `<option value="${m}" ${isSelected}>${formatMonthKeyName(m)}</option>`;
  });

  select.innerHTML = optionsHtml;
}

function updateAnalyticsMonthlyView() {
  const isAll = selectedAnalyticsMonth === 'ALL';
  const monthName = isAll ? 'All Time' : formatMonthKeyName(selectedAnalyticsMonth);

  // Period labels
  const titlePeriodEl = document.getElementById('financials-chart-period');
  const brandPeriodEl = document.getElementById('brand-chart-period');
  const reviewSubEl = document.getElementById('monthly-review-subtitle');
  if (titlePeriodEl) titlePeriodEl.textContent = monthName;
  if (brandPeriodEl) brandPeriodEl.textContent = monthName;
  if (reviewSubEl) {
    reviewSubEl.textContent = isAll 
      ? 'Cumulative audit of all vehicle purchases, customer sales, and workshop repair costs' 
      : `Audit of vehicle purchases, customer sales, and workshop repair costs for ${monthName}`;
  }

  // 1. Calculate Monthly Purchases
  const boughtBikes = bikes.filter(b => {
    if (isAll) return true;
    return (b.purchaseDate || '').startsWith(selectedAnalyticsMonth);
  });
  const buyCount = boughtBikes.length;
  const buySpend = boughtBikes.reduce((sum, b) => sum + (Number(b.purchasePrice) || 0), 0);

  // 2. Calculate Monthly Sales
  const soldBikes = bikes.filter(b => {
    if (b.status !== 'Sold') return false;
    if (isAll) return true;
    return (b.saleDate || '').startsWith(selectedAnalyticsMonth);
  });
  const soldCount = soldBikes.length;
  const soldRev = soldBikes.reduce((sum, b) => sum + (Number(b.sellingPrice) || 0), 0);
  const soldCostBasis = soldBikes.reduce((sum, b) => sum + getCostBasis(b), 0);
  const netProfit = soldRev - soldCostBasis;
  const margin = soldCostBasis > 0 ? (netProfit / soldCostBasis) * 100 : 0;

  // 3. Calculate Monthly Workshop Repairs
  const repairItems = [];
  bikes.forEach(b => {
    (b.refurbishments || []).forEach(r => {
      const rDate = r.date || b.purchaseDate || '';
      if (isAll || rDate.startsWith(selectedAnalyticsMonth)) {
        repairItems.push({
          ...r,
          bike: b,
          date: r.date || b.purchaseDate || 'N/A'
        });
      }
    });
  });
  const repairsSpend = repairItems.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  // 4. Update KPI strip elements
  const buyCountEl = document.getElementById('monthly-kpi-buy-count');
  const buySpendEl = document.getElementById('monthly-kpi-buy-spend');
  const soldCountEl = document.getElementById('monthly-kpi-sold-count');
  const soldRevEl = document.getElementById('monthly-kpi-sold-rev');
  const repairsCountEl = document.getElementById('monthly-kpi-repairs-count');
  const repairsSpendEl = document.getElementById('monthly-kpi-repairs-spend');
  const netProfitEl = document.getElementById('monthly-kpi-net-profit');
  const profitMarginEl = document.getElementById('monthly-kpi-profit-margin');

  if (buyCountEl) buyCountEl.textContent = buyCount;
  if (buySpendEl) buySpendEl.textContent = formatCurrency(buySpend);
  if (soldCountEl) soldCountEl.textContent = soldCount;
  if (soldRevEl) soldRevEl.textContent = formatCurrency(soldRev);
  if (repairsCountEl) repairsCountEl.textContent = repairItems.length;
  if (repairsSpendEl) repairsSpendEl.textContent = formatCurrency(repairsSpend);

  if (netProfitEl) {
    netProfitEl.textContent = (netProfit >= 0 ? '+' : '') + formatCurrency(netProfit);
    netProfitEl.className = `text-xl font-extrabold font-mono-numbers ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (profitMarginEl) {
    profitMarginEl.textContent = `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}% Margin`;
    profitMarginEl.className = `px-2 py-0.5 rounded font-bold text-xs ${margin >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`;
  }

  // 5. Build Unified Activities List
  const activities = [];

  // Purchases
  boughtBikes.forEach(b => {
    activities.push({
      date: b.purchaseDate || 'N/A',
      type: 'BUY',
      badge: 'PURCHASE',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      bike: b,
      particulars: `Bought from ${b.sellerName || 'Direct Owner'}${b.sellerPhone ? ' • ' + b.sellerPhone : ''}`,
      amountHtml: `<span class="font-mono text-emerald-400 font-bold">-${formatCurrency(b.purchasePrice)}</span>
                   <div class="text-[10px] text-slate-400">Inventory Investment</div>`
    });
  });

  // Sales
  soldBikes.forEach(b => {
    const profit = (Number(b.sellingPrice) || 0) - getCostBasis(b);
    const isPos = profit >= 0;
    activities.push({
      date: b.saleDate || 'N/A',
      type: 'SELL',
      badge: 'SOLD',
      badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      bike: b,
      particulars: `Sold to ${b.buyerName || 'Valued Customer'}${b.buyerPhone ? ' • ' + b.buyerPhone : ''}`,
      amountHtml: `<span class="font-mono text-blue-400 font-bold">+${formatCurrency(b.sellingPrice)}</span>
                   <div class="text-[10px] ${isPos ? 'text-emerald-400' : 'text-rose-400'} font-semibold">Net Profit: ${isPos ? '+' : ''}${formatCurrency(profit)}</div>`
    });
  });

  // Repairs
  repairItems.forEach(r => {
    activities.push({
      date: r.date,
      type: 'REPAIR',
      badge: 'WORKSHOP',
      badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      bike: r.bike,
      particulars: `Service: ${r.description}`,
      amountHtml: `<span class="font-mono text-purple-300 font-bold">-${formatCurrency(r.cost)}</span>
                   <div class="text-[10px] text-slate-400">Workshop Expense</div>`
    });
  });

  // Sort activities newest date first
  activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Update Activity counts
  const countAll = activities.length;
  const countBuy = activities.filter(a => a.type === 'BUY').length;
  const countSell = activities.filter(a => a.type === 'SELL').length;
  const countRepair = activities.filter(a => a.type === 'REPAIR').length;

  const mactAll = document.getElementById('mact-count-all');
  const mactBuy = document.getElementById('mact-count-buy');
  const mactSell = document.getElementById('mact-count-sell');
  const mactRepair = document.getElementById('mact-count-repair');
  if (mactAll) mactAll.textContent = countAll;
  if (mactBuy) mactBuy.textContent = countBuy;
  if (mactSell) mactSell.textContent = countSell;
  if (mactRepair) mactRepair.textContent = countRepair;

  renderMonthlyReviewTable(activities);
}

function renderMonthlyReviewTable(activities) {
  const tbody = document.getElementById('monthly-review-tbody');
  const emptyEl = document.getElementById('monthly-review-empty');
  if (!tbody) return;

  const filtered = activities.filter(a => {
    if (selectedMonthlyActivityFilter === 'ALL') return true;
    return a.type === selectedMonthlyActivityFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  tbody.innerHTML = filtered.map(item => `
    <tr class="hover:bg-slate-800/40 transition-colors">
      <td class="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
        ${item.date}
      </td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.badgeClass}">
          ${item.badge}
        </span>
      </td>
      <td class="py-3 px-4">
        <div class="font-bold text-white text-xs">${item.bike.brand} ${item.bike.model}</div>
        <div class="text-[11px] font-mono text-brand-400 uppercase font-semibold">${item.bike.regNumber}</div>
      </td>
      <td class="py-3 px-3 text-slate-300 text-xs">
        ${item.particulars}
      </td>
      <td class="py-3 px-4 text-right">
        ${item.amountHtml}
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function updateCharts() {
  if (!financialsChart || !brandChart) return;

  const isAll = selectedAnalyticsMonth === 'ALL';

  if (isAll) {
    const monthlyData = {};
    bikes.forEach(bike => {
      const dateStr = bike.saleDate || bike.purchaseDate;
      if (!dateStr) return;
      const monthKey = dateStr.substring(0, 7);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
      }

      const costBasis = getCostBasis(bike);
      if (bike.status === 'Sold') {
        const sell = Number(bike.sellingPrice) || 0;
        monthlyData[monthKey].revenue += sell;
        monthlyData[monthKey].cost += costBasis;
        monthlyData[monthKey].profit += (sell - costBasis);
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    financialsChart.data.labels = sortedMonths.map(m => {
      const [y, mon] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mon) - 1, 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    financialsChart.data.datasets[0].data = sortedMonths.map(m => monthlyData[m].revenue);
    financialsChart.data.datasets[1].data = sortedMonths.map(m => monthlyData[m].cost);
    financialsChart.data.datasets[2].data = sortedMonths.map(m => monthlyData[m].profit);
    financialsChart.update();

    const brandCounts = {};
    bikes.forEach(b => {
      brandCounts[b.brand] = (brandCounts[b.brand] || 0) + 1;
    });

    brandChart.data.labels = Object.keys(brandCounts);
    brandChart.data.datasets[0].data = Object.values(brandCounts);
    brandChart.update();

    renderBrandStatsPills(brandCounts);
  } else {
    const monthKey = selectedAnalyticsMonth;
    const monthLabel = formatMonthKeyName(monthKey);

    let monthRevenue = 0;
    let monthCostBasis = 0;
    let monthProfit = 0;

    bikes.forEach(bike => {
      if (bike.status === 'Sold' && (bike.saleDate || '').startsWith(monthKey)) {
        const sell = Number(bike.sellingPrice) || 0;
        const cost = getCostBasis(bike);
        monthRevenue += sell;
        monthCostBasis += cost;
        monthProfit += (sell - cost);
      }
    });

    const monthPurchases = bikes.filter(b => (b.purchaseDate || '').startsWith(monthKey))
      .reduce((s, b) => s + (Number(b.purchasePrice) || 0), 0);
    
    let monthRepairs = 0;
    bikes.forEach(b => {
      (b.refurbishments || []).forEach(r => {
        if ((r.date || b.purchaseDate || '').startsWith(monthKey)) {
          monthRepairs += (Number(r.cost) || 0);
        }
      });
    });

    const costToShow = monthCostBasis > 0 ? monthCostBasis : (monthPurchases + monthRepairs);

    financialsChart.data.labels = [monthLabel];
    financialsChart.data.datasets[0].data = [monthRevenue];
    financialsChart.data.datasets[1].data = [costToShow];
    financialsChart.data.datasets[2].data = [monthProfit];
    financialsChart.update();

    const activeBikes = bikes.filter(b => {
      return (b.purchaseDate || '').startsWith(monthKey) ||
             (b.saleDate || '').startsWith(monthKey) ||
             (b.refurbishments || []).some(r => (r.date || '').startsWith(monthKey));
    });

    const brandCounts = {};
    activeBikes.forEach(b => {
      brandCounts[b.brand] = (brandCounts[b.brand] || 0) + 1;
    });

    brandChart.data.labels = Object.keys(brandCounts);
    brandChart.data.datasets[0].data = Object.values(brandCounts);
    brandChart.update();

    renderBrandStatsPills(brandCounts);
  }
}

function renderBrandStatsPills(brandCounts) {
  const brandPillsContainer = document.getElementById('brand-stats-pills');
  if (!brandPillsContainer) return;
  const entries = Object.entries(brandCounts);
  if (entries.length === 0) {
    brandPillsContainer.innerHTML = '<span class="text-[11px] text-slate-500 italic">No brand records for this period</span>';
    return;
  }
  brandPillsContainer.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => `
      <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
        ${brand}: <strong class="text-brand-400">${count}</strong>
      </span>
    `).join('');
}

// ============================================================================
// 8. DATA EXPORT & IMPORT
// ============================================================================

function exportToCSV() {
  if (bikes.length === 0) {
    alert('No bike records to export.');
    return;
  }

  const headers = [
    'ID', 'Brand', 'Model', 'Variant', 'Year', 'RegNumber', 'EngineCC', 'OdometerKM',
    'Condition', 'PurchaseDate', 'SellerName', 'SellerPhone', 'PurchasePrice',
    'RefurbishCostTotal', 'TotalCostBasis', 'Status', 'SaleDate', 'BuyerName',
    'BuyerPhone', 'SellingPrice', 'NetProfit', 'ProfitMarginPercent', 'PaymentMode', 'RCStatus'
  ];

  const rows = bikes.map(bike => {
    const metrics = getBikeProfitMetrics(bike);
    const refurbTotal = (bike.refurbishments || []).reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
    return [
      bike.id,
      `"${bike.brand}"`,
      `"${bike.model}"`,
      `"${bike.variant || ''}"`,
      bike.year,
      `"${bike.regNumber}"`,
      bike.engineCC || '',
      bike.odometerKm || 0,
      `"${bike.condition}"`,
      bike.purchaseDate || '',
      `"${bike.sellerName}"`,
      `"${bike.sellerPhone || ''}"`,
      bike.purchasePrice,
      refurbTotal,
      metrics.costBasis,
      bike.status,
      bike.saleDate || '',
      `"${bike.buyerName || ''}"`,
      `"${bike.buyerPhone || ''}"`,
      bike.sellingPrice || 0,
      metrics.profit,
      metrics.margin.toFixed(2),
      `"${bike.paymentMode || ''}"`,
      `"${bike.rcStatus || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FastXMoto_Bikes_Records_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJSON() {
  const jsonStr = JSON.stringify(bikes, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FastXMoto_Backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!Array.isArray(parsed)) {
        alert('Invalid JSON file format. Expected an array of bike records.');
        return;
      }
      bikes = parsed;
      saveData();
      renderApp();
      renderWorkshopHub();
      alert(`Successfully restored ${bikes.length} bike records from backup!`);
    } catch (err) {
      alert('Error reading JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}
