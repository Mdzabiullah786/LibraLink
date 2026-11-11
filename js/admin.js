// mam please do not  deduct marks as allready our marks is less in other subject.
document.addEventListener('DOMContentLoaded', function () {
    /* ── Determine which page we are on ── */
    const page = window.location.pathname.includes('library-management')
        ? 'library-management'
        : 'admin-dashboard';
    const title = page === 'library-management' ? 'Library Management' : 'Admin Dashboard';

    /* ── Initialise shared layout (sidebar + top-bar) ── */
    const user = initApp(page, title);
    if (!user) return; // auth redirect happened

    /* ── Boot the correct page ── */
    if (page === 'library-management') {
        initLibraryManagement(user);
    } else {
        initAdminDashboard(user);
    }
});

/* ================================================================
   HELPER: close any open modal
   ================================================================ */
function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
    overlay.innerHTML = '';
}

/* ================================================================
   HELPER: build the request-detail / progress-tracker modal
   (shared by library-management & admin-dashboard)
   ================================================================ */
function openRequestDetailModal(request) {
    var overlay = document.getElementById('modalOverlay');

    /* Progress steps */
    var steps = [
        { label: 'Requested', done: true },
        { label: 'Approved', done: request.approvalStatus === 'approved' || request.approvalStatus === 'rejected' },
        { label: 'Dispatched', done: ['dispatched', 'in_transit', 'delivered'].indexOf(request.shipmentStatus) !== -1 },
        { label: 'In Transit', done: ['in_transit', 'delivered'].indexOf(request.shipmentStatus) !== -1 },
        { label: 'Delivered', done: request.shipmentStatus === 'delivered' },
        { label: 'Returned', done: request.returnStatus === 'returned' }
    ];

    /* If rejected, override step 2 label */
    if (request.approvalStatus === 'rejected') {
        steps[1].label = 'Rejected';
    }

    var progressHTML = '<div class="progress-tracker" style="display:flex;gap:4px;margin-bottom:24px;flex-wrap:wrap;">';
    steps.forEach(function (s) {
        var color = s.done ? '#22c55e' : '#cbd5e1';
        var textColor = s.done ? '#fff' : '#64748b';
        if (s.label === 'Rejected' && s.done) { color = '#ef4444'; textColor = '#fff'; }
        progressHTML += '<div style="flex:1;min-width:80px;text-align:center;">' +
            '<div style="height:6px;background:' + color + ';border-radius:3px;margin-bottom:6px;"></div>' +
            '<span style="font-size:12px;color:' + textColor + ';">' + s.label + '</span></div>';
    });
    progressHTML += '</div>';

    var html = '<div class="modal">' +
        '<div class="modal-header">' +
            '<h3>Request Details – ' + request.id + '</h3>' +
            '<button class="modal-close" id="modalCloseBtn">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' +
            progressHTML +
            '<div class="request-detail-grid">' +
                detailItem('Request ID', request.id) +
                detailItem('Requester', request.requesterName) +
                detailItem('Student ID', request.studentId || '—') +
                detailItem('Email', request.email || '—') +
                detailItem('Book Title', request.bookTitle) +
                detailItem('ISBN', request.isbn || '—') +
                detailItem('Source Library', request.sourceLibraryName || '—') +
                detailItem('Request Date', formatDate(request.requestDate)) +
                detailItem('Duration', request.duration ? request.duration + ' days' : '—') +
                detailItem('Approval Status', getStatusBadge(request.approvalStatus, 'approval')) +
                detailItem('Shipment Status', getStatusBadge(request.shipmentStatus, 'shipment')) +
                detailItem('Due Date', request.dueDate ? formatDate(request.dueDate) : '—') +
                detailItem('Return Status', getStatusBadge(request.returnStatus, 'return')) +
                detailItem('Message', request.message || '—') +
            '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="modalDoneBtn">Close</button>' +
        '</div>' +
    '</div>';

    overlay.innerHTML = html;
    overlay.classList.add('active');

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalDoneBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
}

/** Small helper to build a detail-item pair */
function detailItem(label, value) {
    return '<div class="detail-item"><span class="detail-label">' + label + '</span><span class="detail-value">' + value + '</span></div>';
}

/* ================================================================
   =====================  LIBRARY MANAGEMENT  =====================
   ================================================================ */

function initLibraryManagement(/* user */) {
    var contentBody = document.getElementById('contentBody');

    /* ── Render page skeleton ── */
    contentBody.innerHTML = buildLibMgmtHTML();

    /* ── Wire up search & filters ── */
    document.getElementById('lmSearch').addEventListener('input', renderLMTable);
    document.getElementById('lmStatusFilter').addEventListener('change', renderLMTable);
    document.getElementById('lmShipmentFilter').addEventListener('change', renderLMTable);

    /* ── Initial render ── */
    renderLMStats();
    renderLMTable();
}

/* ── Build the static HTML skeleton for Library Management ── */
function buildLibMgmtHTML() {
    return '' +
        '<div class="page-header">' +
            '<h1 class="page-title">Library Management Dashboard</h1>' +
            '<p class="page-subtitle">Manage incoming borrowing requests and update statuses</p>' +
        '</div>' +

        /* Stat cards */
        '<div class="stat-grid" id="lmStats"></div>' +

        /* Search & filter bar */
        '<div class="search-filter-bar">' +
            '<div class="search-bar">' +
                '<span class="search-icon">🔍</span>' +
                '<input type="text" class="search-input" id="lmSearch" placeholder="Search by request ID, book title, or requester...">' +
            '</div>' +
            '<div class="filter-group">' +
                '<select class="filter-select" id="lmStatusFilter">' +
                    '<option value="">All Statuses</option>' +
                    '<option value="pending">Pending</option>' +
                    '<option value="approved">Approved</option>' +
                    '<option value="rejected">Rejected</option>' +
                '</select>' +
                '<select class="filter-select" id="lmShipmentFilter">' +
                    '<option value="">All Shipments</option>' +
                    '<option value="not_dispatched">Not Dispatched</option>' +
                    '<option value="dispatched">Dispatched</option>' +
                    '<option value="in_transit">In Transit</option>' +
                    '<option value="delivered">Delivered</option>' +
                '</select>' +
            '</div>' +
        '</div>' +

        /* Table container */
        '<div class="table-container" id="lmTableWrap"></div>';
}

/* ── Render the 4 stat cards ── */
function renderLMStats() {
    var requests = StorageManager.getRequests();
    var total = requests.length;
    var pending = requests.filter(function (r) { return r.approvalStatus === 'pending'; }).length;
    var approved = requests.filter(function (r) { return r.approvalStatus === 'approved'; }).length;
    var inTransit = requests.filter(function (r) {
        return r.shipmentStatus === 'dispatched' || r.shipmentStatus === 'in_transit';
    }).length;

    document.getElementById('lmStats').innerHTML =
        statCard('📋', 'Total Requests', total, 'blue') +
        statCard('⏳', 'Pending Approval', pending, 'yellow') +
        statCard('✅', 'Approved', approved, 'green') +
        statCard('📦', 'In Transit', inTransit, 'purple');
}

/** Reusable stat-card builder */
function statCard(icon, label, number, color) {
    return '<div class="stat-card">' +
        '<div class="stat-icon ' + color + '">' + icon + '</div>' +
        '<div class="stat-info">' +
            '<div class="stat-number">' + number + '</div>' +
            '<div class="stat-label">' + label + '</div>' +
        '</div>' +
    '</div>';
}

/* ── Render / re-render the requests table (with filters) ── */
function renderLMTable() {
    var requests = StorageManager.getRequests();
    var searchVal = document.getElementById('lmSearch').value.toLowerCase();
    var statusVal = document.getElementById('lmStatusFilter').value;
    var shipVal = document.getElementById('lmShipmentFilter').value;

    /* Filter */
    var filtered = requests.filter(function (r) {
        var matchesSearch = !searchVal ||
            (r.id && r.id.toLowerCase().indexOf(searchVal) !== -1) ||
            (r.bookTitle && r.bookTitle.toLowerCase().indexOf(searchVal) !== -1) ||
            (r.requesterName && r.requesterName.toLowerCase().indexOf(searchVal) !== -1);
        var matchesStatus = !statusVal || r.approvalStatus === statusVal;
        var matchesShip = !shipVal || r.shipmentStatus === shipVal;
        return matchesSearch && matchesStatus && matchesShip;
    });

    var wrap = document.getElementById('lmTableWrap');

    /* Empty state */
    if (filtered.length === 0) {
        wrap.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-state-icon">📋</div>' +
                '<h3 class="empty-state-title">No Requests Found</h3>' +
                '<p class="empty-state-text">There are no borrowing requests matching your filters.</p>' +
            '</div>';
        return;
    }

    /* Build table */
    var html = '<table class="data-table"><thead><tr>' +
        '<th>Request ID</th><th>Requester</th><th>Book Title</th><th>Source Library</th>' +
        '<th>Request Date</th><th>Approval</th><th>Shipment</th><th>Due Date</th><th>Return</th><th>Actions</th>' +
        '</tr></thead><tbody>';

    filtered.forEach(function (r) {
        html += '<tr>' +
            '<td>' + r.id + '</td>' +
            '<td>' + r.requesterName + (r.studentId ? '<br><small class="text-muted">' + r.studentId + '</small>' : '') + '</td>' +
            '<td>' + r.bookTitle + '</td>' +
            '<td>' + (r.sourceLibraryName || '—') + '</td>' +
            '<td>' + formatDate(r.requestDate) + '</td>' +
            '<td>' + getStatusBadge(r.approvalStatus, 'approval') + '</td>' +
            '<td>' + getStatusBadge(r.shipmentStatus, 'shipment') + '</td>' +
            '<td>' + (r.dueDate ? formatDate(r.dueDate) : '—') + '</td>' +
            '<td>' + getStatusBadge(r.returnStatus, 'return') + '</td>' +
            '<td>' + buildLMActions(r) + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    wrap.innerHTML = html;

    /* Attach event listeners */
    attachLMActionListeners();
}

/* ── Build action buttons for a single request row ── */
function buildLMActions(r) {
    var btns = '';

    if (r.approvalStatus === 'pending') {
        /* Approve / Reject */
        btns += '<button class="btn btn-sm btn-success lm-approve" data-id="' + r.id + '">✅ Approve</button> ';
        btns += '<button class="btn btn-sm btn-danger lm-reject" data-id="' + r.id + '">❌ Reject</button> ';
    } else if (r.approvalStatus === 'approved') {
        /* Shipment dropdown (next valid step only) */
        if (r.shipmentStatus !== 'delivered') {
            var nextShip = getNextShipment(r.shipmentStatus);
            if (nextShip) {
                btns += '<select class="form-select lm-ship-select" data-id="' + r.id + '" style="width:auto;display:inline-block;font-size:13px;padding:4px 8px;">' +
                    '<option value="">Shipment…</option>' +
                    '<option value="' + nextShip.value + '">' + nextShip.label + '</option>' +
                '</select> ';
            }
        }
        /* Set Due Date (only if none set) */
        if (!r.dueDate) {
            btns += '<button class="btn btn-sm btn-warning lm-setdue" data-id="' + r.id + '">Set Due Date</button> ';
        }
        /* Mark Returned (delivered + not returned) */
        if (r.shipmentStatus === 'delivered' && r.returnStatus !== 'returned') {
            btns += '<button class="btn btn-sm btn-success lm-return" data-id="' + r.id + '">Mark Returned</button> ';
        }
    }
    /* Rejected: no action buttons besides View Details */

    /* View Details – always visible */
    btns += '<button class="btn btn-sm btn-secondary lm-detail" data-id="' + r.id + '">View Details</button>';

    return btns;
}

/** Return the next valid shipment transition */
function getNextShipment(current) {
    var map = {
        'not_dispatched': { value: 'dispatched', label: 'Mark Dispatched' },
        'dispatched': { value: 'in_transit', label: 'Mark In Transit' },
        'in_transit': { value: 'delivered', label: 'Mark Delivered' }
    };
    return map[current] || null;
}

/* ── Attach event listeners to dynamically-rendered action elements ── */
function attachLMActionListeners() {
    /* Approve buttons */
    document.querySelectorAll('.lm-approve').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            showConfirmDialog('Are you sure you want to approve this request?', function () {
                var req = StorageManager.getRequest(id);
                if (!req) return;
                req.approvalStatus = 'approved';
                StorageManager.saveRequest(req);
                showNotification('Request approved successfully!', 'success');
                renderLMStats();
                renderLMTable();
            });
        });
    });

    /* Reject buttons */
    document.querySelectorAll('.lm-reject').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            showConfirmDialog('Are you sure you want to reject this request?', function () {
                var req = StorageManager.getRequest(id);
                if (!req) return;
                req.approvalStatus = 'rejected';
                StorageManager.saveRequest(req);
                showNotification('Request has been rejected.', 'info');
                renderLMStats();
                renderLMTable();
            });
        });
    });

    /* Shipment select dropdowns */
    document.querySelectorAll('.lm-ship-select').forEach(function (sel) {
        sel.addEventListener('change', function () {
            var id = this.getAttribute('data-id');
            var newStatus = this.value;
            if (!newStatus) return;

            var req = StorageManager.getRequest(id);
            if (!req) return;

            /* Validate forward-only transition */
            var order = ['not_dispatched', 'dispatched', 'in_transit', 'delivered'];
            var curIdx = order.indexOf(req.shipmentStatus);
            var newIdx = order.indexOf(newStatus);
            if (newIdx <= curIdx) {
                showNotification('Invalid shipment status transition.', 'error');
                return;
            }

            req.shipmentStatus = newStatus;
            StorageManager.saveRequest(req);
            var label = newStatus.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
            showNotification('Shipment status updated to ' + label, 'success');
            renderLMStats();
            renderLMTable();
        });
    });

    /* Set Due Date buttons */
    document.querySelectorAll('.lm-setdue').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            openDueDateModal(id);
        });
    });

    /* Mark Returned buttons */
    document.querySelectorAll('.lm-return').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            showConfirmDialog('Confirm book has been returned?', function () {
                var req = StorageManager.getRequest(id);
                if (!req) return;
                req.returnStatus = 'returned';
                StorageManager.saveRequest(req);
                showNotification('Book return confirmed!', 'success');
                renderLMStats();
                renderLMTable();
            });
        });
    });

    /* View Details buttons */
    document.querySelectorAll('.lm-detail').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            var req = StorageManager.getRequest(id);
            if (req) openRequestDetailModal(req);
        });
    });
}

/* ── Due Date Modal ── */
function openDueDateModal(requestId) {
    var overlay = document.getElementById('modalOverlay');
    /* Default to tomorrow */
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var minDate = tomorrow.toISOString().split('T')[0];

    overlay.innerHTML =
        '<div class="modal">' +
            '<div class="modal-header">' +
                '<h3>Set Due Date</h3>' +
                '<button class="modal-close" id="dueDateCloseBtn">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-group">' +
                    '<label class="form-label required">Due Date</label>' +
                    '<input type="date" class="form-input" id="dueDateInput" min="' + minDate + '">' +
                    '<div class="form-error hidden" id="dueDateError">Please select a valid future date.</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-secondary" id="dueDateCancelBtn">Cancel</button>' +
                '<button class="btn btn-primary" id="dueDateSaveBtn">Save</button>' +
            '</div>' +
        '</div>';

    overlay.classList.add('active');

    document.getElementById('dueDateCloseBtn').addEventListener('click', closeModal);
    document.getElementById('dueDateCancelBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    document.getElementById('dueDateSaveBtn').addEventListener('click', function () {
        var val = document.getElementById('dueDateInput').value;
        var errEl = document.getElementById('dueDateError');

        /* Validate: must be today or future */
        if (!val) {
            errEl.classList.remove('hidden');
            errEl.textContent = 'Please select a date.';
            return;
        }
        var selected = new Date(val + 'T00:00:00');
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
            errEl.classList.remove('hidden');
            errEl.textContent = 'Due date must be today or in the future.';
            return;
        }

        var req = StorageManager.getRequest(requestId);
        if (!req) return;
        req.dueDate = val;
        StorageManager.saveRequest(req);
        closeModal();
        showNotification('Due date set successfully!', 'success');
        renderLMStats();
        renderLMTable();
    });
}

/* ================================================================
   ====================  ADMINISTRATOR DASHBOARD  ==================
   ================================================================ */

function initAdminDashboard(user) {
    var contentBody = document.getElementById('contentBody');

    /* ── Render page structure ── */
    contentBody.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Administration Dashboard</h1>
                <p class="page-subtitle">Manage books, partner libraries, user accounts, and interlibrary requests</p>
            </div>
        </div>

        <!-- 6 Stat Cards Grid -->
        <div class="stat-grid" id="adminStatsGrid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 28px;"></div>

        <!-- Management Navigation Tabs -->
        <div class="tabs">
            <button class="tab-btn active" data-tab="tabBooks">📚 Book Management</button>
            <button class="tab-btn" data-tab="tabLibraries">🏛️ Partner Libraries</button>
            <button class="tab-btn" data-tab="tabRequests">📋 Borrowing Requests</button>
            <button class="tab-btn" data-tab="tabUsers">👥 User Accounts</button>
        </div>

        <!-- Tab 1: Books -->
        <div class="tab-content active" id="tabBooks">
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>All Catalogued Books</h3>
                    <button class="btn btn-primary btn-sm" id="adminAddBookBtn">+ Add New Book</button>
                </div>
                <div class="card-body">
                    <div class="search-filter-bar" style="margin-bottom:16px;">
                        <div class="search-bar">
                            <span class="search-icon">🔍</span>
                            <input type="text" class="search-input" id="adminBookSearch" placeholder="Search by title, author, or ISBN...">
                        </div>
                    </div>
                    <div class="table-container" id="adminBooksTableWrap"></div>
                </div>
            </div>
        </div>

        <!-- Tab 2: Libraries -->
        <div class="tab-content" id="tabLibraries">
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>Partner Libraries Network</h3>
                    <button class="btn btn-primary btn-sm" id="adminAddLibBtn">+ Add Partner Library</button>
                </div>
                <div class="card-body">
                    <div class="table-container" id="adminLibrariesTableWrap"></div>
                </div>
            </div>
        </div>

        <!-- Tab 3: Requests -->
        <div class="tab-content" id="tabRequests">
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>All Interlibrary Requests</h3>
                </div>
                <div class="card-body">
                    <div class="search-filter-bar" style="margin-bottom:16px;">
                        <div class="search-bar">
                            <span class="search-icon">🔍</span>
                            <input type="text" class="search-input" id="adminReqSearch" placeholder="Search by ID, book, or requester...">
                        </div>
                        <div class="filter-group">
                            <select class="filter-select" id="adminReqStatusFilter">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div class="table-container" id="adminRequestsTableWrap"></div>
                </div>
            </div>
        </div>

        <!-- Tab 4: Users -->
        <div class="tab-content" id="tabUsers">
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>System User Accounts</h3>
                    <button class="btn btn-primary btn-sm" id="adminAddUserBtn">+ Add New User</button>
                </div>
                <div class="card-body">
                    <div class="table-container" id="adminUsersTableWrap"></div>
                </div>
            </div>
        </div>
    `;

    /* ── Tab switching behavior ── */
    const tabButtons = contentBody.querySelectorAll('.tab-btn');
    const tabContents = contentBody.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const targetId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    /* ── Wire up action buttons ── */
    document.getElementById('adminAddBookBtn').addEventListener('click', () => openBookModal(null));
    document.getElementById('adminAddLibBtn').addEventListener('click', () => openLibraryModal(null));
    document.getElementById('adminAddUserBtn').addEventListener('click', () => openUserModal(null));

    /* ── Wire up live search listeners ── */
    document.getElementById('adminBookSearch').addEventListener('input', renderAdminBooksTable);
    document.getElementById('adminReqSearch').addEventListener('input', renderAdminRequestsTable);
    document.getElementById('adminReqStatusFilter').addEventListener('change', renderAdminRequestsTable);

    /* ── Render all tabs initial content ── */
    renderAdminStats();
    renderAdminBooksTable();
    renderAdminLibrariesTable();
    renderAdminRequestsTable();
    renderAdminUsersTable(user);
}

/* ── Render Admin 6 Stat Cards ── */
function renderAdminStats() {
    const users = StorageManager.getUsers();
    const libraries = StorageManager.getLibraries();
    const books = StorageManager.getBooks();
    const requests = StorageManager.getRequests();

    const pendingCount = requests.filter(r => r.approvalStatus === 'pending').length;
    const completedCount = requests.filter(r => r.returnStatus === 'returned').length;

    const statsGrid = document.getElementById('adminStatsGrid');
    if (!statsGrid) return;

    statsGrid.innerHTML =
        statCard('👥', 'Total Users', users.length, 'blue') +
        statCard('🏛️', 'Partner Libraries', libraries.length, 'green') +
        statCard('📚', 'Total Books', books.length, 'purple') +
        statCard('📋', 'Total Requests', requests.length, 'yellow') +
        statCard('⏳', 'Pending Approvals', pendingCount, 'red') +
        statCard('✅', 'Completed Returns', completedCount, 'green');
}

/* ══════════════════════════════════════════════════════════════
   TAB 1: BOOK MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
function renderAdminBooksTable() {
    const wrap = document.getElementById('adminBooksTableWrap');
    if (!wrap) return;

    const books = StorageManager.getBooks();
    const searchVal = (document.getElementById('adminBookSearch')?.value || '').toLowerCase().trim();

    const filtered = books.filter(b => {
        if (!searchVal) return true;
        return (b.title && b.title.toLowerCase().includes(searchVal)) ||
               (b.author && b.author.toLowerCase().includes(searchVal)) ||
               (b.isbn && b.isbn.toLowerCase().includes(searchVal)) ||
               (b.category && b.category.toLowerCase().includes(searchVal));
    });

    if (filtered.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3 class="empty-state-title">No Books Found</h3>
                <p class="empty-state-text">No books match your search criteria.</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Cover</th>
                    <th>Title & Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Libraries</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(book => {
        const availBadge = book.available
            ? '<span class="badge badge-approved">Available</span>'
            : '<span class="badge badge-rejected">Unavailable</span>';
        const libCount = (book.libraryIds && book.libraryIds.length) || 0;
        const initial = book.title ? book.title.charAt(0).toUpperCase() : '?';

        html += `
            <tr>
                <td>
                    <div style="width:34px;height:46px;border-radius:4px;background:${book.coverColor || '#3b82f6'};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">
                        ${initial}
                    </div>
                </td>
                <td>
                    <strong>${escapeHTML(book.title)}</strong><br>
                    <small class="text-muted">by ${escapeHTML(book.author)}</small>
                </td>
                <td><code>${escapeHTML(book.isbn || '—')}</code></td>
                <td><span class="book-category">${escapeHTML(book.category || 'General')}</span></td>
                <td>${book.year || '—'}</td>
                <td>${availBadge}</td>
                <td><span class="badge badge-dispatched">${libCount} Lib${libCount === 1 ? '' : 's'}</span></td>
                <td style="text-align:right;">
                    <div class="btn-group" style="justify-content:flex-end;">
                        <button class="btn btn-sm btn-secondary edit-book-btn" data-id="${book.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-book-btn" data-id="${book.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    wrap.innerHTML = html;

    // Attach row listeners
    wrap.querySelectorAll('.edit-book-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            openBookModal(this.getAttribute('data-id'));
        });
    });

    wrap.querySelectorAll('.delete-book-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const book = StorageManager.getBook(id);
            if (!book) return;

            showConfirmDialog(`Are you sure you want to delete "${book.title}"? This cannot be undone.`, () => {
                StorageManager.deleteBook(id);
                showNotification(`Book "${book.title}" deleted.`, 'info');
                renderAdminStats();
                renderAdminBooksTable();
            });
        });
    });
}

function openBookModal(bookId) {
    const isEdit = !!bookId;
    const book = isEdit ? StorageManager.getBook(bookId) : null;
    const libraries = StorageManager.getLibraries();

    const categories = [
        'Computer Science', 'Software Engineering', 'Literature',
        'Mathematics', 'Physics', 'Chemistry', 'Biology',
        'Economics', 'Philosophy', 'Business'
    ];

    const categoryOptions = categories.map(cat => {
        const sel = (book && book.category === cat) ? 'selected' : '';
        return `<option value="${cat}" ${sel}>${cat}</option>`;
    }).join('');

    const libraryCheckboxes = libraries.map(lib => {
        const checked = (book && book.libraryIds && book.libraryIds.includes(lib.id)) ? 'checked' : '';
        return `
            <label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" name="partnerLib" value="${lib.id}" ${checked}>
                ${escapeHTML(lib.name)} (${lib.code})
            </label>
        `;
    }).join('');

    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal" style="max-width:620px;">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Book' : 'Add New Book'}</h3>
                <button class="modal-close" id="bookModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="adminBookForm" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Book Title</label>
                            <input class="form-input" id="bTitle" type="text" value="${book ? escapeHTML(book.title) : ''}" placeholder="e.g. Clean Code" required>
                            <div class="form-error hidden" id="bTitleErr">Title is required.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Author</label>
                            <input class="form-input" id="bAuthor" type="text" value="${book ? escapeHTML(book.author) : ''}" placeholder="e.g. Robert C. Martin" required>
                            <div class="form-error hidden" id="bAuthorErr">Author is required.</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">ISBN</label>
                            <input class="form-input" id="bIsbn" type="text" value="${book ? escapeHTML(book.isbn || '') : ''}" placeholder="e.g. 978-0132350884" required>
                            <div class="form-error hidden" id="bIsbnErr">ISBN is required.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="bCategory">
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Publisher</label>
                            <input class="form-input" id="bPublisher" type="text" value="${book ? escapeHTML(book.publisher || '') : ''}" placeholder="e.g. Prentice Hall">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Publication Year</label>
                            <input class="form-input" id="bYear" type="number" min="1800" max="2099" value="${book ? (book.year || '') : new Date().getFullYear()}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cover Theme Color</label>
                            <input class="form-input" id="bColor" type="color" value="${book ? (book.coverColor || '#1e3a5f') : '#1e3a5f'}" style="height:42px;padding:4px;cursor:pointer;">
                        </div>
                        <div class="form-group" style="display:flex;align-items:center;padding-top:28px;">
                            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-weight:500;">
                                <input type="checkbox" id="bAvailable" ${(book ? book.available : true) ? 'checked' : ''} style="width:18px;height:18px;">
                                Book is Available for Borrowing
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" id="bDesc" rows="3" placeholder="Summary or overview of the book...">${book ? escapeHTML(book.description || '') : ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Assign to Partner Libraries</label>
                        <div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-white);">
                            ${libraryCheckboxes || '<span class="text-muted">No libraries available.</span>'}
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="bookModalCancelBtn">Cancel</button>
                <button class="btn btn-primary" id="bookModalSaveBtn">${isEdit ? 'Save Changes' : 'Add Book'}</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    const close = () => { overlay.classList.remove('active'); overlay.innerHTML = ''; };
    document.getElementById('bookModalCloseBtn').addEventListener('click', close);
    document.getElementById('bookModalCancelBtn').addEventListener('click', close);
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('bookModalSaveBtn').addEventListener('click', () => {
        const title = document.getElementById('bTitle').value.trim();
        const author = document.getElementById('bAuthor').value.trim();
        const isbn = document.getElementById('bIsbn').value.trim();

        let valid = true;
        if (!title) { document.getElementById('bTitleErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('bTitleErr').classList.add('hidden'); }

        if (!author) { document.getElementById('bAuthorErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('bAuthorErr').classList.add('hidden'); }

        if (!isbn) { document.getElementById('bIsbnErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('bIsbnErr').classList.add('hidden'); }

        if (!valid) return;

        const selectedLibs = Array.from(document.querySelectorAll('input[name="partnerLib"]:checked')).map(cb => cb.value);

        const bookData = {
            id: isEdit ? book.id : StorageManager.generateId('book'),
            title: title,
            author: author,
            isbn: isbn,
            publisher: document.getElementById('bPublisher').value.trim() || 'N/A',
            year: parseInt(document.getElementById('bYear').value, 10) || new Date().getFullYear(),
            category: document.getElementById('bCategory').value,
            description: document.getElementById('bDesc').value.trim(),
            coverColor: document.getElementById('bColor').value,
            available: document.getElementById('bAvailable').checked,
            libraryIds: selectedLibs
        };

        StorageManager.saveBook(bookData);
        close();
        showNotification(isEdit ? 'Book updated successfully!' : 'Book added to catalog!', 'success');
        renderAdminStats();
        renderAdminBooksTable();
    });
}

/* ══════════════════════════════════════════════════════════════
   TAB 2: LIBRARY MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
function renderAdminLibrariesTable() {
    const wrap = document.getElementById('adminLibrariesTableWrap');
    if (!wrap) return;

    const libraries = StorageManager.getLibraries();

    if (libraries.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏛️</div>
                <h3 class="empty-state-title">No Partner Libraries</h3>
                <p class="empty-state-text">Add your first partner library to expand interlibrary borrowing.</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Library Name</th>
                    <th>Code</th>
                    <th>Location</th>
                    <th>Contact Email</th>
                    <th>Phone</th>
                    <th>Total Books</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    libraries.forEach(lib => {
        html += `
            <tr>
                <td><strong>🏛️ ${escapeHTML(lib.name)}</strong></td>
                <td><span class="badge badge-not-dispatched">${escapeHTML(lib.code)}</span></td>
                <td>${escapeHTML(lib.location || '—')}</td>
                <td><a href="mailto:${escapeHTML(lib.email)}">${escapeHTML(lib.email || '—')}</a></td>
                <td>${escapeHTML(lib.phone || '—')}</td>
                <td><strong>${(lib.totalBooks || 0).toLocaleString()}</strong></td>
                <td style="text-align:right;">
                    <div class="btn-group" style="justify-content:flex-end;">
                        <button class="btn btn-sm btn-secondary edit-lib-btn" data-id="${lib.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-lib-btn" data-id="${lib.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('.edit-lib-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            openLibraryModal(this.getAttribute('data-id'));
        });
    });

    wrap.querySelectorAll('.delete-lib-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const lib = StorageManager.getLibrary(id);
            if (!lib) return;

            showConfirmDialog(`Delete partner library "${lib.name}"?`, () => {
                StorageManager.deleteLibrary(id);
                showNotification(`Library "${lib.name}" removed.`, 'info');
                renderAdminStats();
                renderAdminLibrariesTable();
            });
        });
    });
}

function openLibraryModal(libId) {
    const isEdit = !!libId;
    const lib = isEdit ? StorageManager.getLibrary(libId) : null;

    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal" style="max-width:520px;">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Partner Library' : 'Add Partner Library'}</h3>
                <button class="modal-close" id="libModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="adminLibForm" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Library Name</label>
                            <input class="form-input" id="lName" type="text" value="${lib ? escapeHTML(lib.name) : ''}" placeholder="e.g. Midtown Library" required>
                            <div class="form-error hidden" id="lNameErr">Library name is required.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Library Code</label>
                            <input class="form-input" id="lCode" type="text" value="${lib ? escapeHTML(lib.code) : ''}" placeholder="e.g. MTL" required>
                            <div class="form-error hidden" id="lCodeErr">Code is required.</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Address / Location</label>
                        <input class="form-input" id="lLocation" type="text" value="${lib ? escapeHTML(lib.location || '') : ''}" placeholder="e.g. 500 Library Way, Midtown">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Contact Email</label>
                            <input class="form-input" id="lEmail" type="email" value="${lib ? escapeHTML(lib.email || '') : ''}" placeholder="contact@library.edu">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input class="form-input" id="lPhone" type="text" value="${lib ? escapeHTML(lib.phone || '') : ''}" placeholder="(555) 000-0000">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Total Books Catalogued</label>
                        <input class="form-input" id="lTotalBooks" type="number" min="0" value="${lib ? (lib.totalBooks || 5000) : 5000}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="libModalCancelBtn">Cancel</button>
                <button class="btn btn-primary" id="libModalSaveBtn">${isEdit ? 'Save Changes' : 'Add Library'}</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    const close = () => { overlay.classList.remove('active'); overlay.innerHTML = ''; };
    document.getElementById('libModalCloseBtn').addEventListener('click', close);
    document.getElementById('libModalCancelBtn').addEventListener('click', close);
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('libModalSaveBtn').addEventListener('click', () => {
        const name = document.getElementById('lName').value.trim();
        const code = document.getElementById('lCode').value.trim().toUpperCase();

        let valid = true;
        if (!name) { document.getElementById('lNameErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('lNameErr').classList.add('hidden'); }

        if (!code) { document.getElementById('lCodeErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('lCodeErr').classList.add('hidden'); }

        if (!valid) return;

        const libData = {
            id: isEdit ? lib.id : StorageManager.generateId('lib'),
            name: name,
            code: code,
            location: document.getElementById('lLocation').value.trim() || 'Central Campus',
            email: document.getElementById('lEmail').value.trim() || 'info@library.edu',
            phone: document.getElementById('lPhone').value.trim() || '(555) 123-4567',
            totalBooks: parseInt(document.getElementById('lTotalBooks').value, 10) || 5000
        };

        StorageManager.saveLibrary(libData);
        close();
        showNotification(isEdit ? 'Library updated successfully!' : 'Partner library added!', 'success');
        renderAdminStats();
        renderAdminLibrariesTable();
    });
}

/* ══════════════════════════════════════════════════════════════
   TAB 3: BORROWING REQUESTS MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
function renderAdminRequestsTable() {
    const wrap = document.getElementById('adminRequestsTableWrap');
    if (!wrap) return;

    const requests = StorageManager.getRequests();
    const searchVal = (document.getElementById('adminReqSearch')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('adminReqStatusFilter')?.value || '';

    const filtered = requests.filter(r => {
        const matchesSearch = !searchVal ||
            (r.id && r.id.toLowerCase().includes(searchVal)) ||
            (r.bookTitle && r.bookTitle.toLowerCase().includes(searchVal)) ||
            (r.requesterName && r.requesterName.toLowerCase().includes(searchVal)) ||
            (r.sourceLibraryName && r.sourceLibraryName.toLowerCase().includes(searchVal));
        const matchesStatus = !statusVal || r.approvalStatus === statusVal;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        wrap.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3 class="empty-state-title">No Requests Found</h3>
                <p class="empty-state-text">No borrowing requests match the specified filters.</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>Requester</th>
                    <th>Book Title</th>
                    <th>Source Library</th>
                    <th>Date</th>
                    <th>Approval</th>
                    <th>Shipment</th>
                    <th>Due Date</th>
                    <th>Return</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(r => {
        html += `
            <tr>
                <td><code>${r.id}</code></td>
                <td>
                    <strong>${escapeHTML(r.requesterName)}</strong><br>
                    <small class="text-muted">${r.studentId || r.email || ''}</small>
                </td>
                <td>${escapeHTML(r.bookTitle)}</td>
                <td>${escapeHTML(r.sourceLibraryName || '—')}</td>
                <td>${formatDate(r.requestDate)}</td>
                <td>${getStatusBadge(r.approvalStatus, 'approval')}</td>
                <td>${getStatusBadge(r.shipmentStatus, 'shipment')}</td>
                <td>${r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                <td>${getStatusBadge(r.returnStatus, 'return')}</td>
                <td style="text-align:right;">
                    <div class="btn-group" style="justify-content:flex-end;">
                        <button class="btn btn-sm btn-secondary admin-view-req-btn" data-id="${r.id}">View</button>
                        <button class="btn btn-sm btn-danger admin-del-req-btn" data-id="${r.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('.admin-view-req-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const req = StorageManager.getRequest(this.getAttribute('data-id'));
            if (req) openRequestDetailModal(req);
        });
    });

    wrap.querySelectorAll('.admin-del-req-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            showConfirmDialog(`Are you sure you want to permanently delete request ${id}?`, () => {
                StorageManager.deleteRequest(id);
                showNotification(`Request ${id} deleted.`, 'info');
                renderAdminStats();
                renderAdminRequestsTable();
            });
        });
    });
}

/* ══════════════════════════════════════════════════════════════
   TAB 4: USER ACCOUNTS MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
function renderAdminUsersTable(currentUser) {
    const wrap = document.getElementById('adminUsersTableWrap');
    if (!wrap) return;

    const users = StorageManager.getUsers();

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Student ID</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(u => {
        let roleBadge = '<span class="badge badge-not-dispatched">Student</span>';
        if (u.role === 'librarian') roleBadge = '<span class="badge badge-transit">Librarian</span>';
        if (u.role === 'admin') roleBadge = '<span class="badge badge-approved">Admin</span>';

        const isSelf = currentUser && currentUser.id === u.id;

        html += `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div class="sidebar-user-avatar" style="width:32px;height:32px;font-size:13px;background:var(--primary-light);color:#fff;">
                            ${u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <strong>${escapeHTML(u.name)}</strong> ${isSelf ? '<small class="badge badge-dispatched">You</small>' : ''}
                        </div>
                    </div>
                </td>
                <td><a href="mailto:${escapeHTML(u.email)}">${escapeHTML(u.email)}</a></td>
                <td>${roleBadge}</td>
                <td>${u.studentId ? `<code>${escapeHTML(u.studentId)}</code>` : '—'}</td>
                <td style="text-align:right;">
                    <div class="btn-group" style="justify-content:flex-end;">
                        <button class="btn btn-sm btn-secondary edit-user-btn" data-id="${u.id}">Edit</button>
                        ${!isSelf ? `<button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.id}">Delete</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            openUserModal(this.getAttribute('data-id'));
        });
    });

    wrap.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const targetUser = StorageManager.getUser(id);
            if (!targetUser) return;

            showConfirmDialog(`Are you sure you want to remove user account "${targetUser.name}"?`, () => {
                StorageManager.deleteUser(id);
                showNotification(`User account "${targetUser.name}" removed.`, 'info');
                renderAdminStats();
                renderAdminUsersTable(currentUser);
            });
        });
    });
}

function openUserModal(userId) {
    const isEdit = !!userId;
    const targetUser = isEdit ? StorageManager.getUser(userId) : null;

    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
        <div class="modal" style="max-width:480px;">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit User Account' : 'Add New User'}</h3>
                <button class="modal-close" id="userModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="adminUserForm" novalidate>
                    <div class="form-group">
                        <label class="form-label required">Full Name</label>
                        <input class="form-input" id="uName" type="text" value="${targetUser ? escapeHTML(targetUser.name) : ''}" placeholder="e.g. Jane Doe" required>
                        <div class="form-error hidden" id="uNameErr">Full name is required.</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Email Address</label>
                        <input class="form-input" id="uEmail" type="email" value="${targetUser ? escapeHTML(targetUser.email) : ''}" placeholder="user@university.edu" required>
                        <div class="form-error hidden" id="uEmailErr">Valid email is required.</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label ${isEdit ? '' : 'required'}">Password</label>
                        <input class="form-input" id="uPassword" type="password" placeholder="${isEdit ? 'Leave blank to keep current password' : 'Enter account password'}" ${isEdit ? '' : 'required'}>
                        <div class="form-error hidden" id="uPassErr">Password is required.</div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select class="form-select" id="uRole">
                                <option value="student" ${(targetUser && targetUser.role === 'student') ? 'selected' : ''}>Student / Requester</option>
                                <option value="librarian" ${(targetUser && targetUser.role === 'librarian') ? 'selected' : ''}>Library Staff</option>
                                <option value="admin" ${(targetUser && targetUser.role === 'admin') ? 'selected' : ''}>Administrator</option>
                            </select>
                        </div>
                        <div class="form-group" id="studentIdGroup">
                            <label class="form-label">Student ID</label>
                            <input class="form-input" id="uStudentId" type="text" value="${targetUser ? escapeHTML(targetUser.studentId || '') : ''}" placeholder="STU-2024-XXX">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="userModalCancelBtn">Cancel</button>
                <button class="btn btn-primary" id="userModalSaveBtn">${isEdit ? 'Save Changes' : 'Create Account'}</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    // Toggle Student ID field based on role
    const roleSelect = document.getElementById('uRole');
    const studentIdGroup = document.getElementById('studentIdGroup');
    const updateStudentField = () => {
        if (roleSelect.value === 'student') {
            studentIdGroup.style.display = 'block';
        } else {
            studentIdGroup.style.display = 'none';
        }
    };
    roleSelect.addEventListener('change', updateStudentField);
    updateStudentField();

    const close = () => { overlay.classList.remove('active'); overlay.innerHTML = ''; };
    document.getElementById('userModalCloseBtn').addEventListener('click', close);
    document.getElementById('userModalCancelBtn').addEventListener('click', close);
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('userModalSaveBtn').addEventListener('click', () => {
        const name = document.getElementById('uName').value.trim();
        const email = document.getElementById('uEmail').value.trim();
        const password = document.getElementById('uPassword').value.trim();
        const role = document.getElementById('uRole').value;
        const studentId = document.getElementById('uStudentId').value.trim();

        let valid = true;
        if (!name) { document.getElementById('uNameErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('uNameErr').classList.add('hidden'); }

        if (!email || !email.includes('@')) { document.getElementById('uEmailErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('uEmailErr').classList.add('hidden'); }

        if (!isEdit && !password) { document.getElementById('uPassErr').classList.remove('hidden'); valid = false; }
        else { document.getElementById('uPassErr').classList.add('hidden'); }

        if (!valid) return;

        const userData = {
            id: isEdit ? targetUser.id : StorageManager.generateId('user'),
            name: name,
            email: email,
            password: password ? password : (targetUser ? targetUser.password : 'password123'),
            role: role,
            studentId: role === 'student' ? (studentId || 'STU-' + Math.floor(1000 + Math.random() * 9000)) : null
        };

        StorageManager.saveUser(userData);
        close();
        showNotification(isEdit ? 'User updated successfully!' : 'User account created!', 'success');
        renderAdminStats();
        renderAdminUsersTable(StorageManager.getCurrentUser());
    });
}

/** Utility function to safely escape HTML */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

