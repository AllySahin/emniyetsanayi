// ERBATECH - Fiyat Teklif Otomasyonu Javascript Logic

// --- CONSTANTS & DATABASE INITIALIZATION ---
const STORAGE_KEYS = {
  PRODUCTS: 'es_products',
  CARIS: 'es_caris',
  QUOTES: 'es_quotes',
  SETTINGS: 'es_settings',
  THEME: 'es_theme'
};

// Seed initial data if localStorage is empty
const SEED_DATA = {
  products: [
    { id: 'p-1', code: 'PRD-1001', name: '50mm Çelik Somunlu Cıvata', category: 'Bağlantı Elemanları', unit: 'Adet', price: 15.50, currency: 'TRY' },
    { id: 'p-2', code: 'PRD-1002', name: 'Flanşlı Boru - DN100 PN16', category: 'Tesisat Malzemeleri', unit: 'Adet', price: 620.00, currency: 'TRY' },
    { id: 'p-3', code: 'PRD-1003', name: 'Argon Kaynak İşçiliği', category: 'Hizmet', unit: 'Saat', price: 350.00, currency: 'TRY' },
    { id: 'p-4', code: 'PRD-1004', name: 'Çelik Rulman - R20', category: 'Yedek Parça', unit: 'Adet', price: 120.00, currency: 'TRY' }
  ],
  caris: [
    { id: 'c-1', companyName: 'PASTOR LABORATUVARLARI', authorizedPerson: 'Dr. Ahmet Taner', email: 'info@pastorlab.com', phone: '0266 444 11 22', taxOffice: 'Karesi', taxNumber: '7230489502', address: 'Atatürk Mah. Gazi Bulvarı No: 12 10100 Karesi/Balıkesir' },
    { id: 'c-2', companyName: 'Başaran Makina Sanayi Ltd. Şti.', authorizedPerson: 'Selim Başaran', email: 'info@basaranmakina.com', phone: '0212 444 55 66', taxOffice: 'İkitelli', taxNumber: '1234567890', address: 'İkitelli OSB 12. Sokak No:4 Başakşehir / İstanbul' }
  ],
  settings: {
    companyName: 'ERBATECH DEFANCE & AEROSPACE MANUFACTURING',
    phone: '+90 266 123 45 67',
    email: 'info@erbatech.com',
    website: 'www.erbatech.com',
    taxOffice: 'Balıkesir V.D.',
    taxNumber: '1234567890',
    address: 'Altıeylül OSB 3. Cadde No:14 Altıeylül / Balıkesir',
    bankDetails: 'Garanti BBVA\nIBAN: TR56 0006 2000 1234 5678 9012 34\nAlıcı: ERBATECH SAVUNMA VE HAVACILIK SAN. TİC. A.Ş.',
    defaultNotes: 'Fatura tarihinden itibaren 7 iş günü içerisinde ödeme yapılmalıdır.',
    logo: 'logo.jpeg' // default local file
  }
};

// Global App State
let appState = {
  products: [],
  caris: [],
  quotes: [],
  settings: {},
  theme: 'light',
  editState: {
    type: null, // 'urun' or 'cari'
    id: null
  }
};

// --- HELPER FUNCTIONS ---

// Load data from LocalStorage
function loadDatabase() {
  appState.products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [...SEED_DATA.products];
  appState.caris = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARIS)) || [...SEED_DATA.caris];
  appState.quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES)) || [];
  appState.settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { ...SEED_DATA.settings };
  appState.theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';

  // Auto-migrate from old Emniyet Sanayi defaults if detected
  if (appState.settings.companyName === 'Emniyet Sanayi' || !appState.settings.website) {
    appState.settings = { ...SEED_DATA.settings };
    saveToLocalStorage(STORAGE_KEYS.SETTINGS, appState.settings);
  }

  // Save seeds back if they didn't exist
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) saveToLocalStorage(STORAGE_KEYS.PRODUCTS, appState.products);
  if (!localStorage.getItem(STORAGE_KEYS.CARIS)) saveToLocalStorage(STORAGE_KEYS.CARIS, appState.caris);
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) saveToLocalStorage(STORAGE_KEYS.SETTINGS, appState.settings);
}

// Save data helper
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ID Generator
function generateId() {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Format currency values based on currency code
function formatCurrency(value, currency = 'TRY') {
  const numValue = Number(value) || 0;
  switch (currency) {
    case 'TRY':
      return numValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
    case 'USD':
      return '$' + numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'EUR':
      return numValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    case 'GBP':
      return '£' + numValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    default:
      return numValue.toFixed(2) + ' ' + currency;
  }
}

// Format raw date YYYY-MM-DD to DD.MM.YYYY
function formatDate(dateString) {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// Show feedback Toast message
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-check';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  if (type === 'danger') icon = 'fa-circle-xmark';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s forwards reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Update App stats
function updateDashboardStats() {
  document.getElementById('stat-total-quotes').innerText = `${appState.quotes.length} Adet`;

  // Calculate total quote volume in TRY (we treat them as base value for simple stats)
  const totalVolume = appState.quotes.reduce((sum, q) => sum + q.grandTotal, 0);
  document.getElementById('stat-total-volume').innerText = formatCurrency(totalVolume, 'TRY');

  document.getElementById('stat-total-cariler').innerText = `${appState.caris.length} Firma`;
  document.getElementById('stat-total-urunler').innerText = `${appState.products.length} Çeşit`;
}

// Live clock display
function startLiveClock() {
  const clockEl = document.getElementById('live-clock');
  setInterval(() => {
    const now = new Date();
    clockEl.innerText = now.toLocaleString('tr-TR');
  }, 1000);
}

// --- TABS & PORTAL NAVIGATION ---
function initPortalNavigation() {
  const portalCards = document.querySelectorAll('.portal-card');
  const backBtn = document.getElementById('btn-back-to-portal');
  const activeModuleTag = document.getElementById('active-module-indicator');

  portalCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetModuleId = card.getAttribute('data-module');
      const moduleName = card.querySelector('h3').innerText;

      // Hide portal landing tab
      document.getElementById('tab-portal').classList.remove('active');

      // Hide all module views first
      document.querySelectorAll('.module-workspace-view').forEach(view => view.classList.remove('active'));

      // Show target module view
      const targetView = document.getElementById(targetModuleId);
      if (targetView) {
        targetView.classList.add('active');
      }

      // Update Top Bar
      backBtn.classList.remove('hidden');
      activeModuleTag.classList.remove('hidden');
      activeModuleTag.innerText = moduleName;

      // If entering Sales module, render its active subtab
      if (targetModuleId === 'module-sales') {
        const activeSubtabEl = document.querySelector('.sub-nav-item.active');
        if (activeSubtabEl) {
          const activeSubtab = activeSubtabEl.getAttribute('data-subtab');
          renderSubtabContent(activeSubtab);
        }
      }

      showToast(`${moduleName} modülüne giriş yapıldı.`, 'info');
    });
  });

  backBtn.addEventListener('click', () => {
    // Hide all module views
    document.querySelectorAll('.module-workspace-view').forEach(view => view.classList.remove('active'));

    // Hide Top Bar elements
    backBtn.classList.add('hidden');
    activeModuleTag.classList.add('hidden');

    // Show portal landing tab
    document.getElementById('tab-portal').classList.add('active');
  });
}

function initTabs() {
  const subNavItems = document.querySelectorAll('.sub-nav-item');
  const subtabContents = document.querySelectorAll('.subtab-content');

  subNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSubtab = item.getAttribute('data-subtab');

      // Toggle active button
      subNavItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Toggle active subtab content
      subtabContents.forEach(content => content.classList.remove('active'));
      const activeContent = document.getElementById(targetSubtab);
      if (activeContent) {
        activeContent.classList.add('active');
      }

      // Trigger specific subtab updates
      renderSubtabContent(targetSubtab);
    });
  });
}

function renderSubtabContent(subtabId) {
  if (subtabId === 'tab-dashboard') {
    renderQuotesList();
    updateDashboardStats();
  } else if (subtabId === 'tab-create-quote') {
    populateCariSelect();
    const qNumInput = document.getElementById('quote-number');
    if (!qNumInput || !qNumInput.value) {
      initQuoteFormDefaults();
    }
  } else if (subtabId === 'tab-cariler') {
    renderCarilerList();
  } else if (subtabId === 'tab-urunler') {
    renderUrunlerList();
  } else if (subtabId === 'tab-settings') {
    populateSettingsForm();
  }
}

// --- THEMING ---
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');

  // Apply current theme
  document.documentElement.setAttribute('data-theme', appState.theme);
  updateThemeButtonUI();

  themeToggleBtn.addEventListener('click', () => {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEYS.THEME, appState.theme);
    document.documentElement.setAttribute('data-theme', appState.theme);
    updateThemeButtonUI();
    showToast(`Tema değiştirildi: ${appState.theme === 'light' ? 'Açık' : 'Karanlık'} Mod`, 'success');
  });
}

function updateThemeButtonUI() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  if (appState.theme === 'dark') {
    btn.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    btn.setAttribute('title', 'Açık Moda Geç');
  } else {
    btn.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    btn.setAttribute('title', 'Karanlık Moda Geç');
  }
}

// --- PRODUCT CATALOG (URUNLER) ---
function renderUrunlerList() {
  const tbody = document.getElementById('urunler-list');
  const searchVal = document.getElementById('urun-search').value.toLowerCase();

  tbody.innerHTML = '';

  const filtered = appState.products.filter(p =>
    p.code.toLowerCase().includes(searchVal) ||
    p.name.toLowerCase().includes(searchVal) ||
    p.category.toLowerCase().includes(searchVal)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-light); text-align:center; padding: 2rem;">Kayıtlı ürün bulunamadı.</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.code}</strong></td>
      <td>${p.name}</td>
      <td><span class="badge" style="background-color: var(--bg-hover); color: var(--text-main); font-weight: 500;">${p.category || 'Belirtilmemiş'}</span></td>
      <td>${formatCurrency(p.price, p.currency)}</td>
      <td>${p.unit}</td>
      <td class="actions-col">
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm btn-icon-only edit-urun-btn" data-id="${p.id}" title="Düzenle">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon-only delete-urun-btn" data-id="${p.id}" title="Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners to edit and delete buttons
  document.querySelectorAll('.edit-urun-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      editUrun(id);
    });
  });

  document.querySelectorAll('.delete-urun-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      deleteUrun(id);
    });
  });
}

function initProductSearch() {
  document.getElementById('urun-search').addEventListener('input', renderUrunlerList);
}

// Product Form Submit
document.getElementById('urun-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const idEl = document.getElementById('urun-id');
  const code = document.getElementById('urun-code').value.trim();
  const name = document.getElementById('urun-name').value.trim();
  const category = document.getElementById('urun-category').value.trim();
  const price = parseFloat(document.getElementById('urun-price').value) || 0;
  const currency = document.getElementById('urun-currency').value;
  const unit = document.getElementById('urun-unit').value;

  if (!code || !name || price < 0 || !unit) {
    showToast('Lütfen zorunlu alanları doldurunuz.', 'warning');
    return;
  }

  // Check if product code already exists (if adding new product)
  const isEditing = idEl.value !== '';
  if (!isEditing) {
    const codeExists = appState.products.some(p => p.code.toLowerCase() === code.toLowerCase());
    if (codeExists) {
      showToast(`Bu ürün kodu (${code}) zaten kullanımda.`, 'danger');
      return;
    }
  }

  if (isEditing) {
    // Edit Product
    const pIdx = appState.products.findIndex(p => p.id === idEl.value);
    if (pIdx !== -1) {
      appState.products[pIdx] = {
        ...appState.products[pIdx],
        code, name, category, price, currency, unit
      };
      showToast('Ürün kartı güncellendi.', 'success');
    }
  } else {
    // Add Product
    const newProduct = {
      id: generateId(),
      code, name, category, price, currency, unit
    };
    appState.products.push(newProduct);
    showToast('Yeni ürün kartı oluşturuldu.', 'success');
  }

  saveToLocalStorage(STORAGE_KEYS.PRODUCTS, appState.products);
  resetUrunForm();
  renderUrunlerList();
});

function editUrun(id) {
  const p = appState.products.find(p => p.id === id);
  if (!p) return;

  document.getElementById('urun-id').value = p.id;
  document.getElementById('urun-code').value = p.code;
  document.getElementById('urun-name').value = p.name;
  document.getElementById('urun-category').value = p.category;
  document.getElementById('urun-price').value = p.price;
  document.getElementById('urun-currency').value = p.currency;
  document.getElementById('urun-unit').value = p.unit;

  document.getElementById('urun-form-title').innerText = 'Ürün Kartını Düzenle';
  document.getElementById('btn-cancel-urun-edit').classList.remove('hidden');
}

function resetUrunForm() {
  document.getElementById('urun-form').reset();
  document.getElementById('urun-id').value = '';
  document.getElementById('urun-form-title').innerText = 'Yeni Ürün Kartı Oluştur';
  document.getElementById('btn-cancel-urun-edit').classList.add('hidden');
}

document.getElementById('btn-cancel-urun-edit').addEventListener('click', resetUrunForm);

function deleteUrun(id) {
  if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
    appState.products = appState.products.filter(p => p.id !== id);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, appState.products);
    showToast('Ürün sistemden silindi.', 'danger');
    renderUrunlerList();
  }
}

// --- CARI CLIENT CATALOG (CARILER) ---
function renderCarilerList() {
  const tbody = document.getElementById('cariler-list');
  const searchVal = document.getElementById('cari-search').value.toLowerCase();

  tbody.innerHTML = '';

  const filtered = appState.caris.filter(c =>
    c.companyName.toLowerCase().includes(searchVal) ||
    (c.authorizedPerson && c.authorizedPerson.toLowerCase().includes(searchVal)) ||
    (c.taxNumber && c.taxNumber.includes(searchVal))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-light); text-align:center; padding: 2rem;">Kayıtlı cari bulunamadı.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.companyName}</strong></td>
      <td>${c.authorizedPerson || '-'}</td>
      <td>${c.phone || '-'}</td>
      <td>${c.taxOffice ? c.taxOffice + ' V.D. / ' : ''}${c.taxNumber || '-'}</td>
      <td class="actions-col">
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm btn-icon-only view-cari-btn" data-id="${c.id}" title="Profil / Teklif Geçmişi">
            <i class="fa-solid fa-address-card"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-icon-only edit-cari-btn" data-id="${c.id}" title="Düzenle">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon-only delete-cari-btn" data-id="${c.id}" title="Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.view-cari-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      viewCariDetail(id);
    });
  });

  document.querySelectorAll('.edit-cari-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      editCari(id);
    });
  });

  document.querySelectorAll('.delete-cari-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      deleteCari(id);
    });
  });
}

function initCariSearch() {
  document.getElementById('cari-search').addEventListener('input', renderCarilerList);
}

// Cari Form Submit
document.getElementById('cari-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const idEl = document.getElementById('cari-id');
  const companyName = document.getElementById('cari-company-name').value.trim();
  const authorizedPerson = document.getElementById('cari-authorized-person').value.trim();
  const email = document.getElementById('cari-email').value.trim();
  const phone = document.getElementById('cari-phone').value.trim();
  const taxOffice = document.getElementById('cari-tax-office').value.trim();
  const taxNumber = document.getElementById('cari-tax-number').value.trim();
  const address = document.getElementById('cari-address').value.trim();

  if (!companyName) {
    showToast('Firma Ünvanı zorunludur.', 'warning');
    return;
  }

  const isEditing = idEl.value !== '';

  if (isEditing) {
    // Edit Cari
    const cIdx = appState.caris.findIndex(c => c.id === idEl.value);
    if (cIdx !== -1) {
      appState.caris[cIdx] = {
        ...appState.caris[cIdx],
        companyName, authorizedPerson, email, phone, taxOffice, taxNumber, address
      };
      showToast('Cari kartı güncellendi.', 'success');
    }
  } else {
    // Add Cari
    const newCari = {
      id: generateId(),
      companyName, authorizedPerson, email, phone, taxOffice, taxNumber, address
    };
    appState.caris.push(newCari);
    showToast('Yeni cari kartı kaydedildi.', 'success');
  }

  saveToLocalStorage(STORAGE_KEYS.CARIS, appState.caris);
  resetCariForm();
  renderCarilerList();
});

function editCari(id) {
  const c = appState.caris.find(c => c.id === id);
  if (!c) return;

  document.getElementById('cari-id').value = c.id;
  document.getElementById('cari-company-name').value = c.companyName;
  document.getElementById('cari-authorized-person').value = c.authorizedPerson;
  document.getElementById('cari-email').value = c.email;
  document.getElementById('cari-phone').value = c.phone;
  document.getElementById('cari-tax-office').value = c.taxOffice;
  document.getElementById('cari-tax-number').value = c.taxNumber;
  document.getElementById('cari-address').value = c.address;

  document.getElementById('cari-form-title').innerText = 'Cari Kartı Düzenle';
  document.getElementById('btn-cancel-cari-edit').classList.remove('hidden');
}

function resetCariForm() {
  document.getElementById('cari-form').reset();
  document.getElementById('cari-id').value = '';
  document.getElementById('cari-form-title').innerText = 'Yeni Cari Kart Oluştur';
  document.getElementById('btn-cancel-cari-edit').classList.add('hidden');
}

document.getElementById('btn-cancel-cari-edit').addEventListener('click', resetCariForm);

function deleteCari(id) {
  // Check if cari has quotes
  const hasQuotes = appState.quotes.some(q => q.cariId === id);
  const msg = hasQuotes
    ? 'Bu cariye ait geçmiş teklifler bulunmaktadır! Sildiğiniz takdirde teklifler duracak ancak cari bağı kaybolacaktır. Silmek istediğinize emin misiniz?'
    : 'Bu cariyi silmek istediğinize emin misiniz?';

  if (confirm(msg)) {
    appState.caris = appState.caris.filter(c => c.id !== id);
    saveToLocalStorage(STORAGE_KEYS.CARIS, appState.caris);
    showToast('Cari kart silindi.', 'danger');
    renderCarilerList();
  }
}

// Cari Details Modal View
function viewCariDetail(id) {
  const c = appState.caris.find(c => c.id === id);
  if (!c) return;

  // Set company header details
  document.getElementById('modal-cari-name').innerText = c.companyName;
  document.getElementById('modal-cari-auth').innerText = c.authorizedPerson || '-';
  document.getElementById('modal-cari-email').innerText = c.email || '-';
  document.getElementById('modal-cari-phone').innerText = c.phone || '-';
  document.getElementById('modal-cari-tax').innerText = c.taxOffice ? `${c.taxOffice} V.D. / ${c.taxNumber || ''}` : (c.taxNumber || '-');
  document.getElementById('modal-cari-address').innerText = c.address || '-';

  // Find quotes for this customer
  const customerQuotes = appState.quotes.filter(q => q.cariId === id);
  const turnover = customerQuotes.reduce((sum, q) => sum + q.grandTotal, 0); // simplifying currency additions here
  document.getElementById('modal-cari-turnover').innerText = formatCurrency(turnover, 'TRY');

  const listEl = document.getElementById('modal-cari-quotes-list');
  listEl.innerHTML = '';

  if (customerQuotes.length === 0) {
    listEl.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 1rem;">Bu cariye ait fiyat teklifi bulunmamaktadır.</td></tr>`;
  } else {
    customerQuotes.forEach(q => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${q.quoteNumber}</strong></td>
        <td>${formatDate(q.date)}</td>
        <td>${formatDate(q.validUntil)}</td>
        <td>${formatCurrency(q.grandTotal, q.currency)}</td>
        <td><span class="badge badge-${getBadgeClass(q.status)}">${q.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm btn-icon-only pdf-modal-btn" data-quote-id="${q.id}">
            <i class="fa-solid fa-file-pdf"></i>
          </button>
        </td>
      `;
      listEl.appendChild(tr);
    });

    document.querySelectorAll('.pdf-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = btn.getAttribute('data-quote-id');
        generatePDF(qId);
      });
    });
  }

  // Open modal
  const modal = document.getElementById('cari-detail-modal');
  modal.classList.add('active');
}

// Close Modal logic
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    document.getElementById(modalId).classList.remove('active');
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Helper for status badge colors
function getBadgeClass(status) {
  if (status === 'Beklemede') return 'pending';
  if (status === 'Onaylandı') return 'approved';
  if (status === 'Reddedildi') return 'rejected';
  return 'pending';
}

// --- QUOTE CREATOR (TEKLIF HAZIRLAMA) ---

// Setup dropdown selectors
function populateCariSelect() {
  const select = document.getElementById('quote-cari-select');
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Cari Seçiniz --</option>';

  // Sort alphabetically
  const sortedCaris = [...appState.caris].sort((a, b) => a.companyName.localeCompare(b.companyName, 'tr'));

  sortedCaris.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.innerText = c.companyName;
    select.appendChild(opt);
  });

  // Re-select value if it still exists
  if (currentVal && appState.caris.some(c => c.id === currentVal)) {
    select.value = currentVal;
    renderCariQuickPreview(currentVal);
  }
}

// Display selected client details in Quote creator
function renderCariQuickPreview(cariId) {
  const container = document.getElementById('cari-preview-box');
  if (!cariId) {
    container.innerHTML = `<p class="placeholder-text"><i class="fa-solid fa-circle-info"></i> Lütfen bir cari kart seçin.</p>`;
    return;
  }

  const c = appState.caris.find(c => c.id === cariId);
  if (!c) return;

  container.innerHTML = `
    <div style="font-size: 0.9rem;">
      <h4 style="margin-bottom: 0.25rem; font-weight:700; color: var(--text-main);">${c.companyName}</h4>
      <p style="margin-bottom: 0.2rem;"><strong>Yetkili:</strong> ${c.authorizedPerson || '-'}</p>
      <p style="margin-bottom: 0.2rem;"><strong>Tel / E-posta:</strong> ${c.phone || '-'} / ${c.email || '-'}</p>
      <p style="margin-bottom: 0.2rem;"><strong>Vergi:</strong> ${c.taxOffice ? c.taxOffice + ' V.D. / ' : ''}${c.taxNumber || '-'}</p>
      <p style="margin: 0; line-height: 1.3;"><strong>Adres:</strong> ${c.address || '-'}</p>
    </div>
  `;
}

document.getElementById('quote-cari-select').addEventListener('change', (e) => {
  renderCariQuickPreview(e.target.value);
});

// Setup date and quote number defaults
function initQuoteFormDefaults() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('quote-date').value = today;

  // Auto set valid until date to 30 days from now
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  document.getElementById('quote-valid-until').value = thirtyDays.toISOString().split('T')[0];

  // Set default terms & notes from settings
  document.getElementById('quote-notes').value = appState.settings.defaultNotes || '';

  // Generate automated quote number
  document.getElementById('quote-number').value = generateQuoteNumber();

  // Reset lines and add first row
  const tbody = document.getElementById('quote-items-list');
  tbody.innerHTML = '';
  addQuoteItemRow();
}

function generateQuoteNumber() {
  const currentYear = new Date().getFullYear();
  const yearQuotes = appState.quotes.filter(q => q.date && q.date.startsWith(currentYear.toString()));

  let nextSeq = 1;
  if (yearQuotes.length > 0) {
    // Parse serials
    const serials = yearQuotes.map(q => {
      const parts = q.quoteNumber.split('-');
      if (parts.length === 3) {
        return parseInt(parts[2]) || 0;
      }
      return 0;
    });
    nextSeq = Math.max(...serials) + 1;
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `TEK-${currentYear}-${paddedSeq}`;
}

// Add item rows to Quote Table
function addQuoteItemRow() {
  const tbody = document.getElementById('quote-items-list');
  const rowId = generateId();
  const tr = document.createElement('tr');
  tr.id = `row-${rowId}`;
  tr.className = 'quote-item-row';

  // Sort products
  const sortedProducts = [...appState.products].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  let options = '<option value="">-- Ürün/Hizmet Seçiniz --</option>';
  sortedProducts.forEach(p => {
    options += `<option value="${p.id}">${p.code} - ${p.name} (${p.price} ${p.currency})</option>`;
  });

  tr.innerHTML = `
    <td>
      <select class="row-product-select" required style="width:100%;">
        ${options}
      </select>
      <input type="text" class="row-custom-desc mt-2 hidden" placeholder="Özel açıklama ekle...">
    </td>
    <td>
      <input type="number" class="row-price" step="0.01" min="0" value="0.00">
    </td>
    <td>
      <input type="number" class="row-qty" min="0.01" step="any" value="1">
    </td>
    <td>
      <span class="row-unit">-</span>
    </td>
    <td>
      <input type="number" class="row-discount" min="0" max="100" value="0">
    </td>
    <td>
      <span class="row-total-val">0.00 ₺</span>
    </td>
    <td>
      <button type="button" class="btn btn-danger btn-sm btn-icon-only btn-remove-row" style="padding: 0; width: 30px; height: 30px;">
        <i class="fa-solid fa-trash"></i>
      </button>
    </td>
  `;

  tbody.appendChild(tr);

  // Event listeners for calculation and product changing
  const prodSelect = tr.querySelector('.row-product-select');
  const priceInput = tr.querySelector('.row-price');
  const qtyInput = tr.querySelector('.row-qty');
  const discountInput = tr.querySelector('.row-discount');
  const removeBtn = tr.querySelector('.btn-remove-row');

  prodSelect.addEventListener('change', () => {
    const pId = prodSelect.value;
    const customDesc = tr.querySelector('.row-custom-desc');

    if (pId) {
      const p = appState.products.find(prod => prod.id === pId);
      if (p) {
        priceInput.value = p.price;
        tr.querySelector('.row-unit').innerText = p.unit;
        customDesc.classList.remove('hidden');
        customDesc.value = p.name;
      }
    } else {
      priceInput.value = '0.00';
      tr.querySelector('.row-unit').innerText = '-';
      customDesc.classList.add('hidden');
      customDesc.value = '';
    }
    calculateQuoteTotals();
  });

  // Calculate totals on values input
  [priceInput, qtyInput, discountInput].forEach(input => {
    input.addEventListener('input', calculateQuoteTotals);
  });

  removeBtn.addEventListener('click', () => {
    const rows = tbody.querySelectorAll('.quote-item-row');
    if (rows.length === 1) {
      showToast('Teklif formunda en az bir satır bulunmalıdır.', 'warning');
      return;
    }
    tr.remove();
    calculateQuoteTotals();
  });
}

document.getElementById('btn-add-item-row').addEventListener('click', addQuoteItemRow);

// Live calculate quote subtotals, VAT, Discounts
function calculateQuoteTotals() {
  const rows = document.querySelectorAll('.quote-item-row');
  const currency = document.getElementById('quote-currency').value;
  const globalDiscountRate = parseFloat(document.getElementById('quote-global-discount').value) || 0;
  const vatRate = parseFloat(document.getElementById('quote-vat-rate').value) || 0;

  let rawSubtotal = 0; // sums up (qty * price) before row discount
  let itemDiscountsTotal = 0; // sums up row discount amount

  rows.forEach(tr => {
    const prodSelect = tr.querySelector('.row-product-select');
    const price = parseFloat(tr.querySelector('.row-price').value) || 0;
    const qty = parseFloat(tr.querySelector('.row-qty').value) || 0;
    const discountPercent = parseFloat(tr.querySelector('.row-discount').value) || 0;

    const rowRawVal = price * qty;
    const rowDiscVal = rowRawVal * (discountPercent / 100);
    const rowTotal = rowRawVal - rowDiscVal;

    tr.querySelector('.row-total-val').innerText = formatCurrency(rowTotal, currency);

    rawSubtotal += rowRawVal;
    itemDiscountsTotal += rowDiscVal;
  });

  const subtotalAfterRowDiscounts = rawSubtotal - itemDiscountsTotal;
  const globalDiscountVal = subtotalAfterRowDiscounts * (globalDiscountRate / 100);
  const totalTaxable = subtotalAfterRowDiscounts - globalDiscountVal;
  const vatVal = totalTaxable * (vatRate / 100);
  const grandTotal = totalTaxable + vatVal;

  // Display summary panels
  document.getElementById('summary-subtotal').innerText = formatCurrency(rawSubtotal, currency);
  document.getElementById('summary-item-discount').innerText = formatCurrency(itemDiscountsTotal, currency);
  document.getElementById('summary-global-discount-rate').innerText = globalDiscountRate;
  document.getElementById('summary-global-discount').innerText = formatCurrency(globalDiscountVal, currency);
  document.getElementById('summary-vat-rate').innerText = vatRate;
  document.getElementById('summary-vat-total').innerText = formatCurrency(vatVal, currency);
  document.getElementById('summary-grand-total').innerText = formatCurrency(grandTotal, currency);

  return {
    rawSubtotal,
    itemDiscountsTotal,
    globalDiscountVal,
    vatVal,
    grandTotal
  };
}

// Auto recalculate totals when currency or tax parameters change
document.getElementById('quote-currency').addEventListener('change', calculateQuoteTotals);
document.getElementById('quote-vat-rate').addEventListener('input', calculateQuoteTotals);
document.getElementById('quote-global-discount').addEventListener('input', calculateQuoteTotals);

// Quick Add Modals (injected programmatically to keep page clean)
function showQuickCariModal() {
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal active';
  modalDiv.id = 'quick-cari-modal';

  modalDiv.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Hızlı Cari Kart Ekle</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="quick-cari-form">
          <div class="form-group">
            <label>Firma Ünvanı / Müşteri Adı <span class="required">*</span></label>
            <input type="text" id="qc-company" required placeholder="Örn: Emniyet Makine Ltd.">
          </div>
          <div class="form-group">
            <label>Yetkili Kişi</label>
            <input type="text" id="qc-auth" placeholder="Ahmet Bey">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Telefon</label>
              <input type="tel" id="qc-phone" placeholder="0555...">
            </div>
            <div class="form-group">
              <label>E-posta</label>
              <input type="email" id="qc-email" placeholder="mail@site.com">
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full mt-2">Hızlı Kaydet</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.querySelector('#quick-cari-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const companyName = modalDiv.querySelector('#qc-company').value.trim();
    if (!companyName) return;

    const newC = {
      id: generateId(),
      companyName,
      authorizedPerson: modalDiv.querySelector('#qc-auth').value.trim(),
      phone: modalDiv.querySelector('#qc-phone').value.trim(),
      email: modalDiv.querySelector('#qc-email').value.trim(),
      taxOffice: '', taxNumber: '', address: ''
    };

    appState.caris.push(newC);
    saveToLocalStorage(STORAGE_KEYS.CARIS, appState.caris);
    showToast('Yeni Cari hızlıca eklendi.', 'success');

    // Close modal
    modalDiv.remove();

    // Re-populate client selects
    populateCariSelect();

    // Select the new client
    document.getElementById('quote-cari-select').value = newC.id;
    renderCariQuickPreview(newC.id);
  });
}

function showQuickProductModal() {
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal active';
  modalDiv.id = 'quick-product-modal';

  modalDiv.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Hızlı Ürün Ekle</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="quick-product-form">
          <div class="form-group">
            <label>Ürün Kodu <span class="required">*</span></label>
            <input type="text" id="qp-code" required placeholder="URN-009">
          </div>
          <div class="form-group">
            <label>Ürün Adı <span class="required">*</span></label>
            <input type="text" id="qp-name" required placeholder="M20 Saplama Vidası">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Fiyat <span class="required">*</span></label>
              <input type="number" id="qp-price" step="0.01" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label>Birim</label>
              <select id="qp-unit">
                <option value="Adet">Adet</option>
                <option value="Kg">Kg</option>
                <option value="Metre">Metre</option>
                <option value="Saat">Saat (Hizmet)</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full mt-2">Hızlı Ekle</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.querySelector('#quick-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = modalDiv.querySelector('#qp-code').value.trim();
    const name = modalDiv.querySelector('#qp-name').value.trim();
    const price = parseFloat(modalDiv.querySelector('#qp-price').value) || 0;
    const unit = modalDiv.querySelector('#qp-unit').value;

    if (!code || !name) return;

    if (appState.products.some(p => p.code.toLowerCase() === code.toLowerCase())) {
      showToast('Bu ürün kodu zaten mevcut.', 'danger');
      return;
    }

    const newP = {
      id: generateId(),
      code, name, price, unit,
      category: 'Hızlı Kayıt',
      currency: 'TRY'
    };

    appState.products.push(newP);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, appState.products);
    showToast('Yeni Ürün kataloğa eklendi.', 'success');

    modalDiv.remove();

    // Re-render item rows options in Quote Creator
    // We will update the existing empty rows or let users add them.
    // The easiest way is to append a new item row and set its value
    const rows = document.querySelectorAll('.quote-item-row');

    // For each select, update the options dynamically to include the new product
    document.querySelectorAll('.row-product-select').forEach(select => {
      const currentVal = select.value;
      const opt = document.createElement('option');
      opt.value = newP.id;
      opt.innerText = `${newP.code} - ${newP.name} (${newP.price} TRY)`;
      select.appendChild(opt);
      select.value = currentVal; // keep current selection
    });
  });
}

document.getElementById('btn-quick-add-cari').addEventListener('click', showQuickCariModal);
document.getElementById('btn-quick-add-urun').addEventListener('click', showQuickProductModal);

// Save Quote & Download PDF
document.getElementById('quote-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const cariId = document.getElementById('quote-cari-select').value;
  const quoteNumber = document.getElementById('quote-number').value.trim();
  const date = document.getElementById('quote-date').value;
  const validUntil = document.getElementById('quote-valid-until').value;
  const currency = document.getElementById('quote-currency').value;
  const vatRate = parseFloat(document.getElementById('quote-vat-rate').value) || 0;
  const globalDiscountRate = parseFloat(document.getElementById('quote-global-discount').value) || 0;
  const notes = document.getElementById('quote-notes').value;

  if (!cariId) {
    showToast('Lütfen bir Cari müşteri seçiniz.', 'warning');
    return;
  }

  // Check if quote number exists
  if (appState.quotes.some(q => q.quoteNumber.toLowerCase() === quoteNumber.toLowerCase())) {
    showToast(`Bu teklif numarası (${quoteNumber}) sistemde mevcut. Lütfen benzersiz bir numara giriniz.`, 'danger');
    return;
  }

  // Get items
  const itemRows = document.querySelectorAll('.quote-item-row');
  const items = [];

  for (let i = 0; i < itemRows.length; i++) {
    const tr = itemRows[i];
    const pId = tr.querySelector('.row-product-select').value;
    const customDesc = tr.querySelector('.row-custom-desc').value.trim();
    const price = parseFloat(tr.querySelector('.row-price').value) || 0;
    const qty = parseFloat(tr.querySelector('.row-qty').value) || 0;
    const discount = parseFloat(tr.querySelector('.row-discount').value) || 0;

    if (!pId) {
      showToast('Lütfen seçilmemiş ürün satırlarını doldurun veya kaldırın.', 'warning');
      return;
    }

    const p = appState.products.find(prod => prod.id === pId);

    items.push({
      productId: pId,
      code: p ? p.code : 'OZEL',
      name: customDesc || (p ? p.name : 'Özel Ürün/Hizmet'),
      unit: tr.querySelector('.row-unit').innerText,
      price: price,
      qty: qty,
      discount: discount,
      total: (price * qty) * (1 - discount / 100)
    });
  }

  if (items.length === 0) {
    showToast('Teklife en az bir ürün eklemelisiniz.', 'warning');
    return;
  }

  // Calculate final totals
  const totals = calculateQuoteTotals();
  const cari = appState.caris.find(c => c.id === cariId);

  const newQuote = {
    id: generateId(),
    quoteNumber,
    cariId,
    cariName: cari ? cari.companyName : 'Bilinmeyen Müşteri',
    date,
    validUntil,
    items,
    subtotal: totals.rawSubtotal,
    itemDiscountsTotal: totals.itemDiscountsTotal,
    globalDiscountRate,
    globalDiscountVal: totals.globalDiscountVal,
    vatRate,
    vatVal: totals.vatVal,
    grandTotal: totals.grandTotal,
    currency,
    notes,
    status: 'Beklemede'
  };

  // Add to database
  appState.quotes.unshift(newQuote); // add to beginning
  saveToLocalStorage(STORAGE_KEYS.QUOTES, appState.quotes);
  showToast('Fiyat teklifi başarıyla kaydedildi.', 'success');

  // Trigger PDF Download
  generatePDF(newQuote.id);

  // Switch to Dashboard/History tab
  document.querySelector('.nav-item[data-tab="tab-dashboard"]').click();
});

// --- PDF GENERATION ENGINE ---
async function generatePDF(quoteId) {
  const quote = appState.quotes.find(q => q.id === quoteId);
  if (!quote) {
    showToast('Teklif bulunamadı!', 'danger');
    return;
  }

  const cari = appState.caris.find(c => c.id === quote.cariId) || {
    companyName: quote.cariName,
    authorizedPerson: '-', phone: '-', email: '-', taxOffice: '', taxNumber: '-', address: '-'
  };

  // Fill in the PDF Template variables
  document.getElementById('pdf-val-quote-number').innerText = quote.quoteNumber;
  document.getElementById('pdf-val-date').innerText = formatDate(quote.date);
  document.getElementById('pdf-val-valid-until').innerText = formatDate(quote.validUntil);

  // Buyer info
  document.getElementById('pdf-val-buyer-name').innerText = cari.companyName;
  document.getElementById('pdf-val-buyer-details').innerHTML = `
    ${cari.address || '-'}<br>
    ${cari.taxOffice ? cari.taxOffice + ' V.D. / ' : ''}${cari.taxNumber || '-'}
  `;

  // Dynamic products lines - Matching ERBATECH template
  const tbody = document.getElementById('pdf-val-items');
  tbody.innerHTML = '';

  quote.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    const indexStr = String(index + 1).padStart(2, '0');
    tr.innerHTML = `
      <td class="col-no-val">${indexStr}</td>
      <td class="col-desc-val">${item.name}</td>
      <td class="col-price-val">${formatCurrency(item.price, quote.currency)}</td>
      <td class="col-qty-val">${item.qty} ${item.unit}</td>
      <td class="col-total-val">${formatCurrency(item.total, quote.currency)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Notes and bank instructions
  document.getElementById('pdf-val-notes').innerText = quote.notes || 'Yok';
  document.getElementById('pdf-val-bank-details').innerHTML = appState.settings.bankDetails
    ? appState.settings.bankDetails.replace(/\n/g, '<br>')
    : 'Banka bilgisi girilmemiş.';

  // Sum calculations
  document.getElementById('pdf-val-subtotal').innerText = formatCurrency(quote.subtotal, quote.currency);

  const discountRow = document.getElementById('pdf-row-discount');
  const discountCombined = quote.itemDiscountsTotal + (quote.globalDiscountVal || 0);
  if (discountCombined > 0) {
    discountRow.style.display = 'table-row';
    document.getElementById('pdf-val-discount').innerText = `-${formatCurrency(discountCombined, quote.currency)}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('pdf-val-vat-rate').innerText = quote.vatRate;
  document.getElementById('pdf-val-vat').innerText = formatCurrency(quote.vatVal, quote.currency);
  document.getElementById('pdf-val-grand-total').innerText = formatCurrency(quote.grandTotal, quote.currency);

  // Seller signatures
  document.getElementById('pdf-val-seller-sig-name').innerText = appState.settings.companyName || 'ERBATECH';
  document.getElementById('pdf-val-seller-sig-title').innerText = 'Yetkili İmza / Kaşe';

  // Seller Contact Info (Footer)
  document.getElementById('pdf-val-seller-phone').innerText = appState.settings.phone || 'Telefon Yok';
  document.getElementById('pdf-val-seller-website').innerText = appState.settings.website || 'Web Sitesi Yok';
  document.getElementById('pdf-val-seller-address').innerText = appState.settings.address || 'Adres Yok';

  // Setup Logo in PDF template from settings image
  const pdfLogoImg = document.querySelector('.pdf-logo-img');
  pdfLogoImg.src = appState.settings.logo || 'logo.jpeg';

  // Preload item.png as base64 so html2canvas can render it reliably
  async function loadAsBase64(url) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Could not preload:', url, e);
      return url; // fallback to original URL
    }
  }

  // Run html2pdf to generate A4 print document
  const pdfWrapper = document.getElementById('pdf-template-wrapper');
  pdfWrapper.style.display = 'block'; // temporarily display it to the DOM

  const filename = `${quote.quoteNumber}_${quote.cariName.replace(/[^a-z0-9]/gi, '_')}.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2.2, useCORS: true, allowTaint: true, letterRendering: true },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  showToast('PDF Teklifi hazırlanıyor...', 'info');

  // Preload item.png to base64 before generating PDF
  const accentImg = document.querySelector('.pdf-accent-img');
  if (accentImg) {
    const b64 = await loadAsBase64('item.png');
    accentImg.src = b64;
    // Wait a tick for the browser to paint
    await new Promise(r => setTimeout(r, 100));
  }

  html2pdf().from(pdfWrapper).set(opt).toPdf().get('pdf').then(function (pdf) {
    // Set PDF metadata properties so browser viewers display/suggest the correct filename
    pdf.setProperties({
      title: filename.replace('.pdf', ''),
      subject: 'Erbatech Fiyat Teklifi',
      creator: 'ERBATECH ERP'
    });

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    // 1. Direct download trigger
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 2. Open PDF in a new window directly (as a PDF blob instead of an HTML iframe wrapper)
    // This allows browser Ctrl+S and download menus to download the raw PDF binary file.
    const urlWithFilename = url + '#filename=' + encodeURIComponent(filename);
    window.open(urlWithFilename, '_blank');

    pdfWrapper.style.display = 'none'; // hide it back

    showToast(`Teklif Kaydedildi! PDF indirme işlemi başlatıldı. Eğer otomatik başlamadıysa <a href="${url}" download="${filename}" style="color:#ffffff; text-decoration:underline; font-weight:700; margin-left: 5px;">Buraya Tıklayarak İndirin</a> veya <a href="${urlWithFilename}" target="_blank" style="color:#ffffff; text-decoration:underline; font-weight:700; margin-left: 5px;">Yeni Sekmede Açın</a>.`, 'success');
  }).catch((err) => {
    pdfWrapper.style.display = 'none';
    console.error(err);
    showToast('PDF üretilirken bir hata oluştu.', 'danger');
  });
}

// --- DASHBOARD / QUOTE HISTORY LOGS (PANEL) ---
function renderQuotesList() {
  const tbody = document.getElementById('quotes-list');
  const searchVal = document.getElementById('filter-search').value.toLowerCase();
  const statusVal = document.getElementById('filter-status').value;
  const startDate = document.getElementById('filter-start-date').value;
  const endDate = document.getElementById('filter-end-date').value;

  tbody.innerHTML = '';

  let filtered = appState.quotes.filter(q => {
    const matchSearch = q.quoteNumber.toLowerCase().includes(searchVal) || q.cariName.toLowerCase().includes(searchVal);
    const matchStatus = statusVal === '' || q.status === statusVal;

    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && q.date >= startDate;
    }
    if (endDate) {
      matchDate = matchDate && q.date <= endDate;
    }

    return matchSearch && matchStatus && matchDate;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--text-light); text-align:center; padding: 2rem;">Arama kriterlerine uygun teklif bulunamadı.</td></tr>`;
    return;
  }

  filtered.forEach(q => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${q.quoteNumber}</strong></td>
      <td>${q.cariName}</td>
      <td>${formatDate(q.date)}</td>
      <td>${formatDate(q.validUntil)}</td>
      <td><strong>${formatCurrency(q.grandTotal, q.currency)}</strong></td>
      <td>
        <select class="status-updater-select" data-id="${q.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; width: auto; font-weight:600; border-radius: 50px;">
          <option value="Beklemede" ${q.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
          <option value="Onaylandı" ${q.status === 'Onaylandı' ? 'selected' : ''}>Onaylandı</option>
          <option value="Reddedildi" ${q.status === 'Reddedildi' ? 'selected' : ''}>Reddedildi</option>
        </select>
      </td>
      <td class="actions-col">
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm btn-icon-only pdf-dl-btn" data-id="${q.id}" title="PDF İndir">
            <i class="fa-solid fa-file-pdf" style="color: var(--danger)"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon-only delete-quote-btn" data-id="${q.id}" title="Teklifi Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach status change events
  document.querySelectorAll('.status-updater-select').forEach(select => {
    styleStatusSelect(select);
    select.addEventListener('change', (e) => {
      const id = select.getAttribute('data-id');
      const newStatus = select.value;
      updateQuoteStatus(id, newStatus);
      styleStatusSelect(select);
    });
  });

  // Attach PDF downloads
  document.querySelectorAll('.pdf-dl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      generatePDF(id);
    });
  });

  // Attach Delete quote
  document.querySelectorAll('.delete-quote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteQuote(id);
    });
  });
}

// Color coding the status selects
function styleStatusSelect(select) {
  const val = select.value;
  select.style.border = 'none';
  if (val === 'Beklemede') {
    select.style.backgroundColor = 'var(--warning-light)';
    select.style.color = 'var(--warning)';
  } else if (val === 'Onaylandı') {
    select.style.backgroundColor = 'var(--success-light)';
    select.style.color = 'var(--success)';
  } else {
    select.style.backgroundColor = 'var(--danger-light)';
    select.style.color = 'var(--danger)';
  }
}

function updateQuoteStatus(id, status) {
  const qIdx = appState.quotes.findIndex(q => q.id === id);
  if (qIdx !== -1) {
    appState.quotes[qIdx].status = status;
    saveToLocalStorage(STORAGE_KEYS.QUOTES, appState.quotes);
    showToast(`Teklif durumu "${status}" olarak güncellendi.`, 'success');
  }
}

function deleteQuote(id) {
  if (confirm('Bu teklif kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
    appState.quotes = appState.quotes.filter(q => q.id !== id);
    saveToLocalStorage(STORAGE_KEYS.QUOTES, appState.quotes);
    showToast('Teklif geçmişten silindi.', 'danger');
    renderQuotesList();
    updateDashboardStats();
  }
}

function initFilters() {
  document.getElementById('filter-search').addEventListener('input', renderQuotesList);
  document.getElementById('filter-status').addEventListener('change', renderQuotesList);
  document.getElementById('filter-start-date').addEventListener('change', renderQuotesList);
  document.getElementById('filter-end-date').addEventListener('change', renderQuotesList);

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    renderQuotesList();
    showToast('Filtreler temizlendi.', 'info');
  });
}

// --- SETTINGS MANAGEMENT ---
function populateSettingsForm() {
  const s = appState.settings;
  document.getElementById('settings-company-name').value = s.companyName || '';
  document.getElementById('settings-phone').value = s.phone || '';
  document.getElementById('settings-email').value = s.email || '';
  document.getElementById('settings-website').value = s.website || '';
  document.getElementById('settings-tax-office').value = s.taxOffice || '';
  document.getElementById('settings-tax-number').value = s.taxNumber || '';
  document.getElementById('settings-address').value = s.address || '';
  document.getElementById('settings-bank-details').value = s.bankDetails || '';
  document.getElementById('settings-default-notes').value = s.defaultNotes || '';

  // Logo Preview
  const preview = document.getElementById('settings-logo-preview');
  preview.src = s.logo || 'logo.jpeg';
}

document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();

  appState.settings.companyName = document.getElementById('settings-company-name').value.trim();
  appState.settings.phone = document.getElementById('settings-phone').value.trim();
  appState.settings.email = document.getElementById('settings-email').value.trim();
  appState.settings.website = document.getElementById('settings-website').value.trim();
  appState.settings.taxOffice = document.getElementById('settings-tax-office').value.trim();
  appState.settings.taxNumber = document.getElementById('settings-tax-number').value.trim();
  appState.settings.address = document.getElementById('settings-address').value.trim();
  appState.settings.bankDetails = document.getElementById('settings-bank-details').value.trim();
  appState.settings.defaultNotes = document.getElementById('settings-default-notes').value.trim();

  saveToLocalStorage(STORAGE_KEYS.SETTINGS, appState.settings);

  // Update UI Elements logo title
  const appLogo = document.getElementById('app-logo');
  appLogo.src = appState.settings.logo || 'logo.jpeg';

  showToast('Firma profil ayarları başarıyla kaydedildi.', 'success');
});

// Logo file picker upload
document.getElementById('logo-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Lütfen sadece resim dosyası seçiniz.', 'danger');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64Data = event.target.result;

    // Save to settings
    appState.settings.logo = base64Data;
    saveToLocalStorage(STORAGE_KEYS.SETTINGS, appState.settings);

    // Update previews
    document.getElementById('settings-logo-preview').src = base64Data;
    document.getElementById('app-logo').src = base64Data;

    showToast('Firma logosu güncellendi.', 'success');
  };
  reader.readAsDataURL(file);
});

// --- BACKUP IMPORT/EXPORT ---
document.getElementById('btn-export-backup').addEventListener('click', () => {
  const data = {
    products: appState.products,
    caris: appState.caris,
    quotes: appState.quotes,
    settings: appState.settings
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `erbatech_teklif_yedek_${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  showToast('Veritabanı yedeği indirildi.', 'success');
});

document.getElementById('import-backup-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      if (data.products && data.caris && data.quotes && data.settings) {
        // Confirm restore
        if (confirm('Yedek dosyasını yüklemek istediğinize emin misiniz? Bu işlem mevcut tüm verileri silecektir.')) {
          appState.products = data.products;
          appState.caris = data.caris;
          appState.quotes = data.quotes;
          appState.settings = data.settings;

          saveToLocalStorage(STORAGE_KEYS.PRODUCTS, appState.products);
          saveToLocalStorage(STORAGE_KEYS.CARIS, appState.caris);
          saveToLocalStorage(STORAGE_KEYS.QUOTES, appState.quotes);
          saveToLocalStorage(STORAGE_KEYS.SETTINGS, appState.settings);

          showToast('Veriler başarıyla yedekten yüklendi!', 'success');

          // Refresh current views
          updateDashboardStats();
          renderQuotesList();
          renderCarilerList();
          renderUrunlerList();
          populateSettingsForm();

          // reset forms
          resetCariForm();
          resetUrunForm();
        }
      } else {
        showToast('Geçersiz yedek dosyası formatı!', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Yedek dosyası okunurken bir hata oluştu.', 'danger');
    }
  };
  reader.readAsText(file);
});

// --- CORE APP LAUNCHER ---
window.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  initPortalNavigation();
  initTabs();
  initTheme();
  startLiveClock();

  // Basic configurations setup
  initFilters();
  initCariSearch();
  initProductSearch();

  // App Header Logo loading check
  const appLogo = document.getElementById('app-logo');
  if (appLogo) {
    appLogo.src = appState.settings.logo || 'logo.jpeg';
  }
});
