// sorry mam i have taken help of ai as you know i have not learn java script yet .
function createSidebar(activePage) {
    const user = StorageManager.getCurrentUser();
    if (!user) return; // No session – nothing to render

    /* --- Build the nav items array based on role --- */
    let navItems = [];

    switch (user.role) {
        case 'student':
            navItems = [
                { id: 'dashboard',      icon: '📊', label: 'Dashboard',      href: 'dashboard.html' },
                { id: 'books',          icon: '📚', label: 'Browse Books',   href: 'books.html' },
                { id: 'my-requests',    icon: '📋', label: 'My Requests',    href: 'my-requests.html' },
                { id: 'borrow-request', icon: '✏️', label: 'New Request',    href: 'borrow-request.html' }
            ];
            break;

        case 'librarian':
            navItems = [
                { id: 'library-management', icon: '🏛️', label: 'Library Dashboard', href: 'library-management.html' },
                { id: 'books',              icon: '📚', label: 'Browse Books',       href: 'books.html' }
            ];
            break;

        case 'admin':
            navItems = [
                { id: 'admin-dashboard', icon: '📊', label: 'Admin Dashboard', href: 'admin-dashboard.html' },
                { id: 'books',           icon: '📚', label: 'Manage Books',    href: 'books.html' },
                { id: 'my-requests',     icon: '📋', label: 'All Requests',    href: 'my-requests.html' }
            ];
            break;
    }

    /* --- Generate the navigation links HTML --- */
    const navLinksHtml = navItems.map(item => {
        const activeClass = (item.id === activePage) ? ' active' : '';
        return `<a href="${item.href}" class="nav-link${activeClass}">
                    <span class="sidebar-nav-icon nav-icon">${item.icon}</span>
                    <span class="nav-label">${item.label}</span>
                </a>`;
    }).join('\n');

    /* --- User avatar: first letter of their name --- */
    const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : '?';

    /* --- Capitalise role for display --- */
    const displayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    /* --- Assemble full sidebar HTML --- */
    const sidebarHtml = `
        <!-- Brand / Logo area -->
        <div class="sidebar-brand">
            <span class="sidebar-brand-icon brand-icon">📖</span>
            <span class="brand-text">LibraLink</span>
        </div>

        <!-- Primary navigation -->
        <nav class="sidebar-nav">
            ${navLinksHtml}
        </nav>

        <!-- Divider -->
        <div class="sidebar-divider" style="height:1px;background:rgba(255,255,255,0.1);margin:8px 16px;"></div>

        <!-- Home link (common to all roles) -->
        <nav class="sidebar-nav sidebar-nav-secondary" style="flex:0;padding:8px 0;">
            <a href="index.html" class="nav-link">
                <span class="sidebar-nav-icon nav-icon">🏠</span>
                <span class="nav-label">Home</span>
            </a>
        </nav>

        <!-- User info & logout at the bottom -->
        <div class="sidebar-user">
            <div class="sidebar-user-avatar user-avatar">${avatarLetter}</div>
            <div class="sidebar-user-info user-info">
                <span class="sidebar-user-name user-name">${user.name}</span>
                <span class="sidebar-user-role user-role">${displayRole}</span>
            </div>
            <button class="logout-btn" onclick="logout()" title="Logout" aria-label="Logout">🚪</button>
        </div>
    `;

    /* --- Inject into the DOM --- */
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
        sidebarEl.innerHTML = sidebarHtml;
    }
}


/* ==========================================================
 * createTopBar(title)
 * ==========================================================
 * Renders the top navigation bar with a hamburger toggle
 * (visible on mobile) and the page title.
 *
 * @param {string} title - The page title to display.
 * ======================================================== */
function createTopBar(title) {
    const user = StorageManager.getCurrentUser();
    const userRoleBadge = user ? `<span class="badge badge-approved" style="text-transform:capitalize;">${user.role}</span>` : '';

    const topBarHtml = `
        <div style="display:flex;align-items:center;gap:16px;">
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
                ☰
            </button>
            <div class="top-bar-title">${title}</div>
        </div>
        <div class="top-bar-actions">
            ${userRoleBadge}
            <span style="font-size:13px;color:var(--text-muted);">${user ? user.name : ''}</span>
        </div>
    `;

    const topBarEl = document.getElementById('topBar');
    if (topBarEl) {
        topBarEl.innerHTML = topBarHtml;
    }
}


/* ==========================================================
 * showNotification(message, type)
 * ==========================================================
 * Displays a toast notification that auto-dismisses after
 * 3 seconds. Multiple rapid calls update the same element.
 *
 * @param {string} message - Text to display.
 * @param {string} type    - One of 'success', 'error',
 *                           'info', 'warning'.
 * ======================================================== */
function showNotification(message, type) {
    // Type defaults to 'info' if not recognised
    const validTypes = ['success', 'error', 'info', 'warning'];
    if (!validTypes.includes(type)) {
        type = 'info';
    }

    const notifEl = document.getElementById('notification');
    if (!notifEl) return;

    // Reset classes so previous type styling is removed
    notifEl.className = 'notification';
    notifEl.classList.add(type);
    notifEl.classList.add('notification-' + type);
    notifEl.textContent = message;

    // Trigger the visible state
    requestAnimationFrame(() => {
        notifEl.classList.add('show');
    });

    // Auto-dismiss after 3 seconds
    clearTimeout(notifEl._dismissTimer);
    notifEl._dismissTimer = setTimeout(() => {
        notifEl.classList.remove('show');
    }, 3000);
}


/* ==========================================================
 * showConfirmDialog(message, onConfirm)
 * ==========================================================
 * Presents a modal confirmation dialog with Cancel / Confirm
 * buttons. The overlay is darkened behind the modal.
 *
 * @param {string}   message   - Prompt text to display.
 * @param {Function} onConfirm - Callback invoked on Confirm.
 * ======================================================== */
function showConfirmDialog(message, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    // Build the modal markup using standard modal classes
    overlay.innerHTML = `
        <div class="modal" style="max-width:440px;">
            <div class="modal-header">
                <h3>⚠️ Confirm Action</h3>
                <button class="modal-close" id="confirmCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <p style="font-size:15px;line-height:1.6;color:var(--text-secondary);">${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                <button class="btn btn-primary" id="confirmOk">Confirm</button>
            </div>
        </div>
    `;

    // Show the overlay
    overlay.classList.add('active');

    // --- Button handlers ---
    const closeModal = () => {
        overlay.classList.remove('active');
        overlay.innerHTML = '';
    };

    const cancelBtn = document.getElementById('confirmCancel');
    const okBtn = document.getElementById('confirmOk');
    const closeBtn = document.getElementById('confirmCloseBtn');

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (okBtn) {
        okBtn.addEventListener('click', () => {
            closeModal();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
    }

    // Also close when clicking the dark overlay background
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    };
}


/* ==========================================================
 * formatDate(dateString)
 * ==========================================================
 * Converts a YYYY-MM-DD date string into a human-friendly
 * format like "Oct 15, 2024".
 *
 * @param {string|null} dateString - ISO-style date string.
 * @returns {string} Formatted date or 'N/A'.
 * ======================================================== */
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
        // Parse the date parts manually to avoid timezone offsets
        const parts = dateString.split('-');
        const year  = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day   = parseInt(parts[2], 10);

        const date = new Date(year, month, day);

        // Short month names
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (e) {
        return 'N/A';
    }
}


/* ==========================================================
 * getStatusBadge(status, type)
 * ==========================================================
 * Returns an HTML string for a coloured status badge.
 *
 * @param {string} status - The raw status value.
 * @param {string} type   - Category: 'approval', 'shipment',
 *                          or 'return'.
 * @returns {string} HTML string for the badge <span>.
 * ======================================================== */
function getStatusBadge(status, type) {
    /* Map every known status to its CSS class and display text */
    const statusMap = {
        // Approval statuses
        'pending':        { className: 'badge-pending',        display: 'Pending' },
        'approved':       { className: 'badge-approved',       display: 'Approved' },
        'rejected':       { className: 'badge-rejected',       display: 'Rejected' },

        // Shipment statuses
        'not_dispatched': { className: 'badge-not-dispatched', display: 'Not Dispatched' },
        'dispatched':     { className: 'badge-dispatched',     display: 'Dispatched' },
        'in_transit':     { className: 'badge-transit',        display: 'In Transit' },
        'delivered':      { className: 'badge-delivered',      display: 'Delivered' },

        // Return statuses
        'not_returned':   { className: 'badge-not-returned',   display: 'Not Returned' },
        'returned':       { className: 'badge-returned',       display: 'Returned' }
    };

    // Look up the status; fall back to a generic badge if unknown
    const info = statusMap[status] || {
        className: 'badge-default',
        display: status ? status.replace(/_/g, ' ') : 'Unknown'
    };

    return `<span class="badge ${info.className}">${info.display}</span>`;
}


/* ==========================================================
 * initMobileSidebar()
 * ==========================================================
 * Wires up mobile-responsive sidebar behaviour:
 *   • Hamburger button toggles the sidebar open / closed
 *   • A dark overlay appears behind the sidebar on mobile
 *   • Clicking the overlay closes the sidebar
 *   • Resizing the viewport above 992px auto-closes it
 * ======================================================== */
function initMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (!sidebar || !toggleBtn) return;

    /* --- Create the dark overlay element --- */
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    /* --- Toggle handler on the hamburger button --- */
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    /* --- Clicking overlay closes sidebar --- */
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    /* --- Auto-close on resize past the breakpoint --- */
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    });
}


/* ==========================================================
 * initApp(activePage, pageTitle)
 * ==========================================================
 * One-call convenience function that every protected page
 * invokes on load. It performs authentication gating, builds
 * the sidebar & top bar, and sets up mobile interactions.
 *
 * Usage in each page's script:
 *   const user = initApp('dashboard', 'Student Dashboard');
 *
 * @param {string} activePage - The identifier of this page.
 * @param {string} pageTitle  - The title shown in the top bar.
 * @returns {Object|null} The authenticated user object,
 *                        or null if redirecting to login.
 * ======================================================== */
function initApp(activePage, pageTitle) {
    // 1. Authentication gate – redirects if not logged in
    const user = checkAuth();
    if (!user) return null;

    // 2. Build the sidebar with the correct active link
    createSidebar(activePage);

    // 3. Build the top bar with the page title
    createTopBar(pageTitle);

    // 4. Wire up mobile sidebar toggle behaviour
    initMobileSidebar();

    // Return the user so page-specific code can use it
    return user;
}
