/**
 * requests.js - LibraLink Borrowing Request Management
 * 
 * Handles two pages:
 *   1. borrow-request.html  – Form for submitting a new borrowing request
 *   2. my-requests.html     – Table listing all of the user's (or all) requests
 * 
 * Depends on: storage.js (StorageManager), auth.js (checkAuth),
 *             app.js (initApp, showNotification, showConfirmDialog,
 *                     formatDate, getStatusBadge)
 */

document.addEventListener('DOMContentLoaded', function () {
    /* Determine which page we are on based on the URL */
    const page = window.location.pathname.includes('borrow-request')
        ? 'borrow-request'
        : 'my-requests';

    const title = page === 'borrow-request'
        ? 'New Borrowing Request'
        : 'My Requests';

    /* Initialize the app shell (sidebar + top-bar) and get the current user */
    const user = initApp(page, title);
    if (!user) return; // not logged in – initApp will redirect

    /* Route to the correct initializer */
    if (page === 'borrow-request') {
        initBorrowRequest(user);
    } else {
        initMyRequests(user);
    }
});

/* ======================================================================
   BORROW REQUEST PAGE
   ====================================================================== */

/**
 * Builds the borrow-request form, pre-fills data, handles validation
 * and submission.
 * @param {Object} user - The currently logged-in user
 */
function initBorrowRequest(user) {
    const contentBody = document.getElementById('contentBody');

    /* ---- Read URL parameters (optional pre-fill) ---- */
    const params    = new URLSearchParams(window.location.search);
    const bookIdParam    = params.get('bookId');
    const libraryIdParam = params.get('libraryId');

    /* Try to look up book/library objects if IDs were provided */
    let prefilledBook    = bookIdParam    ? StorageManager.getBook(bookIdParam)       : null;
    let prefilledLibrary = libraryIdParam ? StorageManager.getLibrary(libraryIdParam) : null;

    /* Today's date in YYYY-MM-DD for the date input */
    const todayISO = new Date().toISOString().split('T')[0];

    /* Fetch all available libraries for the dropdown */
    const libraries = StorageManager.getLibraries();

    /* ---- Build the page HTML ---- */
    let bookInfoCard = '';
    if (prefilledBook) {
        /* Small info card shown above the form when a bookId param is present */
        const initials = getBookInitials(prefilledBook.title);
        bookInfoCard = `
            <div class="card mb-3" style="border-left:4px solid ${prefilledBook.coverColor || '#5b6abf'}">
                <div class="card-body" style="display:flex;align-items:center;gap:16px;padding:12px 16px;">
                    <div style="
                        width:48px;height:64px;border-radius:6px;
                        background:${prefilledBook.coverColor || '#5b6abf'};
                        display:flex;align-items:center;justify-content:center;
                        color:#fff;font-weight:700;font-size:14px;flex-shrink:0;
                    ">${initials}</div>
                    <div>
                        <strong style="font-size:15px;">${escapeHTML(prefilledBook.title)}</strong><br>
                        <span class="text-muted" style="font-size:13px;">by ${escapeHTML(prefilledBook.author)}</span><br>
                        <span class="text-muted" style="font-size:13px;">ISBN: ${escapeHTML(prefilledBook.isbn || 'N/A')}</span>
                    </div>
                </div>
            </div>`;
    }

    contentBody.innerHTML = `
        <!-- Page Header -->
        <div class="page-header">
            <h1 class="page-title">Submit Borrowing Request</h1>
            <p class="page-subtitle">Fill in the details below to request a book from a partner library</p>
        </div>

        ${bookInfoCard}

        <!-- Request Form Card -->
        <div class="card">
            <div class="card-header">📝 Request Details</div>
            <div class="card-body">
                <form id="borrowForm" novalidate>

                    <!-- Row 1: Requester Name & Student ID -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Requester Name</label>
                            <input class="form-input" type="text" id="requesterName"
                                   value="${escapeHTML(user.name)}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Student ID</label>
                            <input class="form-input" type="text" id="studentId"
                                   value="${escapeHTML(user.studentId || '')}" readonly>
                        </div>
                    </div>

                    <!-- Row 2: Email & Request Date -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input class="form-input" type="email" id="email"
                                   value="${escapeHTML(user.email)}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Request Date</label>
                            <input class="form-input" type="date" id="requestDate"
                                   value="${todayISO}">
                        </div>
                    </div>

                    <!-- Row 3: Book Title & ISBN -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Book Title</label>
                            <input class="form-input" type="text" id="bookTitle"
                                   placeholder="Enter book title"
                                   value="${prefilledBook ? escapeHTML(prefilledBook.title) : ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">ISBN</label>
                            <input class="form-input" type="text" id="isbn"
                                   placeholder="Enter ISBN"
                                   value="${prefilledBook ? escapeHTML(prefilledBook.isbn || '') : ''}">
                        </div>
                    </div>

                    <!-- Row 4: Source Library & Duration -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Source Library</label>
                            <select class="form-select" id="sourceLibrary" required>
                                <option value="" disabled ${!prefilledLibrary ? 'selected' : ''}>-- Select Library --</option>
                                ${libraries.map(function (lib) {
                                    const selected = (prefilledLibrary && prefilledLibrary.id === lib.id) ? 'selected' : '';
                                    return '<option value="' + lib.id + '" ' + selected + '>' + escapeHTML(lib.name) + '</option>';
                                }).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Expected Borrowing Duration</label>
                            <select class="form-select" id="duration">
                                <option value="7">7 days</option>
                                <option value="14" selected>14 days</option>
                                <option value="21">21 days</option>
                                <option value="30">30 days</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 5: Additional Message -->
                    <div class="form-group">
                        <label class="form-label">Additional Message</label>
                        <textarea class="form-textarea" id="message"
                                  placeholder="Any additional notes or reasons for this request..."
                                  rows="4"></textarea>
                    </div>
                </form>
            </div>

            <!-- Card Footer: action buttons -->
            <div class="card-footer" style="display:flex;justify-content:flex-end;gap:12px;">
                <button class="btn btn-secondary" id="cancelBtn" type="button">Cancel</button>
                <button class="btn btn-primary" id="submitBtn" type="button">Submit Request</button>
            </div>
        </div>
    `;

    /* ---- Wire up event listeners ---- */

    /* Cancel button – go back or navigate to my-requests */
    document.getElementById('cancelBtn').addEventListener('click', function () {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'my-requests.html';
        }
    });

    /* Clear validation errors when the user starts typing */
    var formInputs = contentBody.querySelectorAll('.form-input, .form-select, .form-textarea');
    formInputs.forEach(function (input) {
        input.addEventListener('input', function () {
            clearFieldError(input);
        });
        input.addEventListener('change', function () {
            clearFieldError(input);
        });
    });

    /* Submit button */
    document.getElementById('submitBtn').addEventListener('click', function () {
        handleBorrowSubmit(user, bookIdParam);
    });
}

/**
 * Validates the borrow-request form and saves the request.
 * @param {Object} user  - The logged-in user
 * @param {string|null} bookIdParam - Book ID from URL params (may be null)
 */
function handleBorrowSubmit(user, bookIdParam) {
    /* Gather field references */
    var bookTitleInput   = document.getElementById('bookTitle');
    var isbnInput        = document.getElementById('isbn');
    var sourceLibSelect  = document.getElementById('sourceLibrary');
    var dateInput        = document.getElementById('requestDate');
    var durationSelect   = document.getElementById('duration');
    var messageTextarea  = document.getElementById('message');

    /* Clear any previous errors */
    clearAllErrors();

    /* ---- Validate required fields ---- */
    var isValid = true;

    if (!bookTitleInput.value.trim()) {
        showFieldError(bookTitleInput, 'Book title is required');
        isValid = false;
    }

    if (!sourceLibSelect.value) {
        showFieldError(sourceLibSelect, 'Please select a source library');
        isValid = false;
    }

    /* Email & requester name are readonly but still validate just in case */
    var emailInput = document.getElementById('email');
    if (!emailInput.value.trim()) {
        showFieldError(emailInput, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }

    var nameInput = document.getElementById('requesterName');
    if (!nameInput.value.trim()) {
        showFieldError(nameInput, 'Requester name is required');
        isValid = false;
    }

    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    /* ---- Build the request object ---- */
    var selectedLibId   = sourceLibSelect.value;
    var selectedLibrary = StorageManager.getLibrary(selectedLibId);

    var generatedId = StorageManager.generateRequestId();

    var request = {
        id:                generatedId,
        requesterId:       user.id,
        requesterName:     user.name,
        studentId:         user.studentId || '',
        email:             user.email,
        bookId:            bookIdParam || null,
        bookTitle:         bookTitleInput.value.trim(),
        isbn:              isbnInput.value.trim(),
        sourceLibraryId:   selectedLibId,
        sourceLibraryName: selectedLibrary ? selectedLibrary.name : '',
        requestDate:       dateInput.value,
        duration:          durationSelect.value,
        message:           messageTextarea.value.trim(),
        approvalStatus:    'pending',
        shipmentStatus:    'not_dispatched',
        dueDate:           null,
        returnStatus:      'not_returned'
    };

    /* Save through StorageManager */
    StorageManager.saveRequest(request);

    /* Notify user and redirect */
    showNotification(
        'Borrowing request submitted successfully! Request ID: ' + generatedId,
        'success'
    );

    setTimeout(function () {
        window.location.href = 'my-requests.html';
    }, 1500);
}

/* ======================================================================
   MY REQUESTS PAGE
   ====================================================================== */

/**
 * Builds the my-requests page: search bar, filters, table, and detail
 * modal interactions.
 * @param {Object} user - The currently logged-in user
 */
function initMyRequests(user) {
    var contentBody = document.getElementById('contentBody');

    /* Determine role-based title */
    var isAdmin     = (user.role === 'admin');
    var isLibrarian = (user.role === 'librarian');
    var pageTitle   = (isAdmin || isLibrarian) ? 'All Borrowing Requests' : 'My Borrowing Requests';
    var pageSub     = (isAdmin || isLibrarian)
        ? 'View and manage all interlibrary borrowing requests'
        : 'Track and manage all your interlibrary borrowing requests';

    /* Build the static shell (header + filters + table container) */
    contentBody.innerHTML = `
        <!-- Page Header -->
        <div class="page-header">
            <h1 class="page-title">${pageTitle}</h1>
            <p class="page-subtitle">${pageSub}</p>
        </div>

        <!-- Search & Filters -->
        <div class="search-filter-bar">
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="searchInput"
                       placeholder="Search by request ID, book title, or library...">
            </div>
            <div class="filter-group">
                <select class="filter-select" id="statusFilter">
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select class="filter-select" id="sortSelect">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>
        </div>

        <!-- Requests Table (or empty state) -->
        <div id="requestsTableContainer"></div>
    `;

    /* Load and render requests */
    renderFilteredRequests(user);

    /* ---- Event listeners for search, filter, and sort ---- */
    document.getElementById('searchInput').addEventListener('input', function () {
        renderFilteredRequests(user);
    });
    document.getElementById('statusFilter').addEventListener('change', function () {
        renderFilteredRequests(user);
    });
    document.getElementById('sortSelect').addEventListener('change', function () {
        renderFilteredRequests(user);
    });
}

/**
 * Reads the current search/filter/sort values, filters the requests
 * array, and re-renders the table.
 * @param {Object} user - The logged-in user
 */
function renderFilteredRequests(user) {
    var allRequests = StorageManager.getRequests();

    /* ---- Role-based filtering ---- */
    var requests;
    if (user.role === 'student') {
        requests = allRequests.filter(function (r) {
            return r.requesterId === user.id;
        });
    } else {
        /* admin and librarian see everything */
        requests = allRequests.slice();
    }

    /* ---- Search filter (case-insensitive) ---- */
    var searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
    if (searchVal) {
        requests = requests.filter(function (r) {
            return (
                (r.id && r.id.toLowerCase().includes(searchVal)) ||
                (r.bookTitle && r.bookTitle.toLowerCase().includes(searchVal)) ||
                (r.sourceLibraryName && r.sourceLibraryName.toLowerCase().includes(searchVal))
            );
        });
    }

    /* ---- Status filter ---- */
    var statusVal = document.getElementById('statusFilter').value;
    if (statusVal !== 'all') {
        requests = requests.filter(function (r) {
            return r.approvalStatus === statusVal;
        });
    }

    /* ---- Sort ---- */
    var sortVal = document.getElementById('sortSelect').value;
    requests.sort(function (a, b) {
        var dateA = new Date(a.requestDate);
        var dateB = new Date(b.requestDate);
        return sortVal === 'newest' ? dateB - dateA : dateA - dateB;
    });

    /* ---- Render ---- */
    var container = document.getElementById('requestsTableContainer');
    if (requests.length === 0) {
        container.innerHTML = renderEmptyState();
    } else {
        container.innerHTML = renderRequestsTable(requests);
        attachViewListeners(requests);
    }
}

/**
 * Returns full HTML for the requests data table.
 * @param {Array} requests - The filtered/sorted requests
 * @returns {string} HTML string
 */
function renderRequestsTable(requests) {
    var rows = requests.map(function (r) {
        return `
            <tr>
                <td><strong>${escapeHTML(r.id)}</strong></td>
                <td>${escapeHTML(r.bookTitle)}</td>
                <td>${escapeHTML(r.sourceLibraryName)}</td>
                <td>${formatDate(r.requestDate)}</td>
                <td>${getStatusBadge(r.approvalStatus, 'approval')}</td>
                <td>${getStatusBadge(r.shipmentStatus, 'shipment')}</td>
                <td>${r.dueDate ? formatDate(r.dueDate) : '<span class="text-muted">—</span>'}</td>
                <td>${getStatusBadge(r.returnStatus, 'return')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary view-btn"
                            data-request-id="${r.id}">View</button>
                </td>
            </tr>`;
    }).join('');

    return `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>Book Title</th>
                        <th>Source Library</th>
                        <th>Request Date</th>
                        <th>Approval</th>
                        <th>Shipment</th>
                        <th>Due Date</th>
                        <th>Return</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
}

/**
 * Attaches click handlers to every "View" button so it opens the
 * detail modal for the matching request.
 * @param {Array} requests - The current set of displayed requests
 */
function attachViewListeners(requests) {
    var buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var reqId   = this.getAttribute('data-request-id');
            var request = requests.find(function (r) { return r.id === reqId; });
            if (request) {
                openRequestDetailModal(request);
            }
        });
    });
}

/**
 * Opens a modal overlay displaying the full details and progress
 * tracker for a single request.
 * @param {Object} request - The request to display
 */
function openRequestDetailModal(request) {
    var overlay = document.getElementById('modalOverlay');

    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Request Details – ${escapeHTML(request.id)}</h2>
                <button class="modal-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                ${renderProgressTracker(request)}
                ${renderRequestDetail(request)}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modalFooterCloseBtn">Close</button>
            </div>
        </div>`;

    overlay.classList.add('active');

    /* Close handlers */
    document.getElementById('modalCloseBtn').addEventListener('click', function () {
        overlay.classList.remove('active');
    });
    document.getElementById('modalFooterCloseBtn').addEventListener('click', function () {
        overlay.classList.remove('active');
    });
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
}

/* ======================================================================
   PROGRESS TRACKER
   ====================================================================== */

/**
 * Renders a 4-step progress tracker for the borrowing workflow:
 *   Requested → Approved → Shipped → Returned
 * 
 * Logic:
 *   - "Requested" is always completed.
 *   - "Approved" is completed if approved, shows a rejected state if
 *     rejected, or is active if still pending.
 *   - "Shipped" is completed if delivered, active if dispatched/in_transit,
 *     and grayed out if rejected.
 *   - "Returned" is completed if returned, grayed out if rejected.
 *
 * @param {Object} request
 * @returns {string} HTML
 */
function renderProgressTracker(request) {
    var isRejected  = (request.approvalStatus === 'rejected');
    var isApproved  = (request.approvalStatus === 'approved');
    var isPending   = (request.approvalStatus === 'pending');

    var shipDelivered = (request.shipmentStatus === 'delivered');
    var shipActive    = (request.shipmentStatus === 'dispatched' || request.shipmentStatus === 'in_transit');

    var isReturned = (request.returnStatus === 'returned');

    /* Step 1: Requested – always completed */
    var step1Class = 'progress-step completed';

    /* Step 2: Approved */
    var step2Class = 'progress-step';
    if (isApproved)   step2Class += ' completed';
    else if (isRejected) step2Class += ' rejected';
    else              step2Class += ' active'; // pending

    /* Step 3: Shipped */
    var step3Class = 'progress-step';
    if (isRejected) {
        step3Class += ' disabled';
    } else if (shipDelivered) {
        step3Class += ' completed';
    } else if (shipActive) {
        step3Class += ' active';
    }

    /* Step 4: Returned */
    var step4Class = 'progress-step';
    if (isRejected) {
        step4Class += ' disabled';
    } else if (isReturned) {
        step4Class += ' completed';
    }

    return `
        <div class="progress-tracker mb-3">
            <div class="${step1Class}">
                <div class="progress-step-dot">✓</div>
                <span class="progress-step-label">Requested</span>
            </div>
            <div class="progress-line"></div>
            <div class="${step2Class}">
                <div class="progress-step-dot">${isRejected ? '✕' : (isApproved ? '✓' : '2')}</div>
                <span class="progress-step-label">${isRejected ? 'Rejected' : 'Approved'}</span>
            </div>
            <div class="progress-line"></div>
            <div class="${step3Class}">
                <div class="progress-step-dot">${shipDelivered ? '✓' : '3'}</div>
                <span class="progress-step-label">Shipped</span>
            </div>
            <div class="progress-line"></div>
            <div class="${step4Class}">
                <div class="progress-step-dot">${isReturned ? '✓' : '4'}</div>
                <span class="progress-step-label">Returned</span>
            </div>
        </div>`;
}

/* ======================================================================
   REQUEST DETAIL GRID
   ====================================================================== */

/**
 * Renders a 2-column detail grid showing every field of a request.
 * @param {Object} request
 * @returns {string} HTML
 */
function renderRequestDetail(request) {
    return `
        <div class="request-detail-grid">
            <div class="detail-item">
                <span class="detail-label">Request ID</span>
                <span class="detail-value">${escapeHTML(request.id)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Request Date</span>
                <span class="detail-value">${formatDate(request.requestDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Requester</span>
                <span class="detail-value">${escapeHTML(request.requesterName)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Student ID</span>
                <span class="detail-value">${escapeHTML(request.studentId || 'N/A')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">${escapeHTML(request.email)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Book Title</span>
                <span class="detail-value">${escapeHTML(request.bookTitle)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">ISBN</span>
                <span class="detail-value">${escapeHTML(request.isbn || 'N/A')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Source Library</span>
                <span class="detail-value">${escapeHTML(request.sourceLibraryName)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Approval Status</span>
                <span class="detail-value">${getStatusBadge(request.approvalStatus, 'approval')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Shipment Status</span>
                <span class="detail-value">${getStatusBadge(request.shipmentStatus, 'shipment')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${request.dueDate ? formatDate(request.dueDate) : '<span class="text-muted">Not set</span>'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Return Status</span>
                <span class="detail-value">${getStatusBadge(request.returnStatus, 'return')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Duration</span>
                <span class="detail-value">${escapeHTML(request.duration ? request.duration + ' days' : 'N/A')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Message</span>
                <span class="detail-value">${escapeHTML(request.message || 'No message provided')}</span>
            </div>
        </div>`;
}

/* ======================================================================
   EMPTY STATE
   ====================================================================== */

/**
 * Returns the HTML for the empty-state display when no requests exist.
 * @returns {string} HTML
 */
function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3 class="empty-state-title">No Requests Yet</h3>
            <p class="empty-state-text">You haven't submitted any borrowing requests yet.</p>
            <a href="books.html" class="btn btn-primary">Browse Books</a>
        </div>`;
}

/* ======================================================================
   FORM VALIDATION HELPERS
   ====================================================================== */

/**
 * Displays a validation error message beneath a form field and
 * highlights its border.
 * @param {HTMLElement} field   - The input/select element
 * @param {string}      message - The error text to display
 */
function showFieldError(field, message) {
    /* Highlight the field */
    field.style.borderColor = 'var(--danger, #e74c3c)';

    /* Avoid duplicate error elements */
    var existing = field.parentElement.querySelector('.form-error');
    if (existing) {
        existing.textContent = message;
        return;
    }

    /* Create error element */
    var errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    field.parentElement.appendChild(errorEl);
}

/**
 * Clears the error state from a single field.
 * @param {HTMLElement} field
 */
function clearFieldError(field) {
    field.style.borderColor = '';
    var err = field.parentElement.querySelector('.form-error');
    if (err) err.remove();
}

/**
 * Clears all validation errors on the page.
 */
function clearAllErrors() {
    document.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (el) {
        el.style.borderColor = '';
    });
}

/**
 * Basic email validation – checks for @ and a dot after it.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    var atIndex  = email.indexOf('@');
    var dotIndex = email.lastIndexOf('.');
    return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1;
}

/* ======================================================================
   UTILITY HELPERS
   ====================================================================== */

/**
 * Escapes HTML special characters to prevent XSS when injecting
 * user-supplied values into the DOM.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Extracts up to two initials from a book title for the CSS cover.
 * Example: "Advanced Mathematics" → "AM"
 * @param {string} title
 * @returns {string}
 */
function getBookInitials(title) {
    if (!title) return '??';
    var words = title.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
}
