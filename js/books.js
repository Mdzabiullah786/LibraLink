/**
 * books.js – LibraLink Book Catalogue & Book Details
 *
 * Handles two pages:
 *   1. books.html       → browsable / searchable book catalogue
 *   2. book-details.html → detailed view of a single book
 *
 * Dependencies (loaded before this file):
 *   - storage.js   → StorageManager
 *   - auth.js      → checkAuth
 *   - app.js       → initApp, showNotification, formatDate, getStatusBadge
 */

document.addEventListener('DOMContentLoaded', function () {
    /* Detect which page we are on and initialise accordingly */
    const isDetailsPage = window.location.pathname.includes('book-details');

    const user = initApp(
        isDetailsPage ? 'book-details' : 'books',
        isDetailsPage ? 'Book Details' : 'Browse Books'
    );
    if (!user) return;

    if (isDetailsPage) {
        initBookDetails();
    } else {
        initBookCatalog();
    }
});

/* ═══════════════════════════════════════════════════════════
   BOOK CATALOGUE (books.html)
   ═══════════════════════════════════════════════════════════ */

/**
 * Initialises the book catalogue page:
 * renders the search/filter bar and the book grid,
 * then wires up all interactive filtering logic.
 */
function initBookCatalog() {
    const contentBody = document.getElementById('contentBody');
    const books       = StorageManager.getBooks();
    const libraries   = StorageManager.getLibraries();

    /* ── Read any pre-selected URL parameters ── */
    const urlParams     = new URLSearchParams(window.location.search);
    const preSearch     = urlParams.get('search')   || '';
    const preCategory   = urlParams.get('category') || '';

    /* ── Category list used in the filter dropdown ── */
    const categories = [
        'Computer Science',
        'Software Engineering',
        'Literature',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Philosophy',
        'Business'
    ];

    /* ── Build library <option> elements ── */
    let libraryOptions = '<option value="">All Libraries</option>';
    libraries.forEach(function (lib) {
        libraryOptions += '<option value="' + lib.id + '">' + lib.name + '</option>';
    });

    /* ── Build category <option> elements ── */
    let categoryOptions = '<option value="">All Categories</option>';
    categories.forEach(function (cat) {
        const selected = (cat === preCategory) ? ' selected' : '';
        categoryOptions += '<option value="' + cat + '"' + selected + '>' + cat + '</option>';
    });

    /* ── Render the page structure ── */
    contentBody.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Browse Books 📚</h1>
                <p class="page-subtitle">Explore our inter-library book catalogue</p>
            </div>
        </div>

        <!-- Search & Filter Bar -->
        <div class="search-filter-bar">
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input
                    type="text"
                    class="search-input"
                    id="bookSearchInput"
                    placeholder="Search by title, author, or ISBN..."
                    value="${escapeAttr(preSearch)}"
                />
            </div>

            <div class="filter-group">
                <select class="filter-select" id="categoryFilter">
                    ${categoryOptions}
                </select>

                <select class="filter-select" id="libraryFilter">
                    ${libraryOptions}
                </select>

                <select class="filter-select" id="availabilityFilter">
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                </select>

                <select class="filter-select" id="sortFilter">
                    <option value="">Default</option>
                    <option value="title-asc">Title A–Z</option>
                    <option value="title-desc">Title Z–A</option>
                    <option value="year-desc">Year (Newest)</option>
                    <option value="year-asc">Year (Oldest)</option>
                </select>
            </div>
        </div>

        <!-- Book Grid Container -->
        <div id="bookGridContainer">
            <!-- Populated by filterAndDisplayBooks() -->
        </div>
    `;

    /* ── Cache DOM references ── */
    const searchInput        = document.getElementById('bookSearchInput');
    const categoryFilter     = document.getElementById('categoryFilter');
    const libraryFilter      = document.getElementById('libraryFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');
    const sortFilter         = document.getElementById('sortFilter');
    const gridContainer      = document.getElementById('bookGridContainer');

    /**
     * Filters, sorts, and renders the book grid
     * based on the current values of all filter controls.
     */
    function filterAndDisplayBooks() {
        const query        = searchInput.value.trim().toLowerCase();
        const category     = categoryFilter.value;
        const libraryId    = libraryFilter.value;
        const availability = availabilityFilter.value;
        const sortBy       = sortFilter.value;

        /* ── Filter books (AND logic – all criteria must match) ── */
        let filtered = books.filter(function (book) {
            /* Search: match title, author, or ISBN (case-insensitive, partial) */
            if (query) {
                const titleMatch  = book.title.toLowerCase().includes(query);
                const authorMatch = book.author.toLowerCase().includes(query);
                const isbnMatch   = book.isbn.toLowerCase().includes(query);
                if (!titleMatch && !authorMatch && !isbnMatch) return false;
            }

            /* Category filter */
            if (category && book.category !== category) return false;

            /* Library filter: book must be available at selected library */
            if (libraryId && (!book.libraryIds || !book.libraryIds.includes(libraryId))) return false;

            /* Availability filter */
            if (availability === 'available'   && !book.available) return false;
            if (availability === 'unavailable' &&  book.available) return false;

            return true;
        });

        /* ── Sort the filtered results ── */
        if (sortBy === 'title-asc') {
            filtered.sort(function (a, b) { return a.title.localeCompare(b.title); });
        } else if (sortBy === 'title-desc') {
            filtered.sort(function (a, b) { return b.title.localeCompare(a.title); });
        } else if (sortBy === 'year-desc') {
            filtered.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
        } else if (sortBy === 'year-asc') {
            filtered.sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
        }

        /* ── Render ── */
        gridContainer.innerHTML = renderBookGrid(filtered);

        /* ── Attach click listeners to book cards ── */
        var cards = gridContainer.querySelectorAll('.book-card');
        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                var bookId = card.getAttribute('data-book-id');
                window.location.href = 'book-details.html?id=' + bookId;
            });
        });
    }

    /* ── Event listeners for real-time filtering ── */
    searchInput.addEventListener('input',        filterAndDisplayBooks);
    categoryFilter.addEventListener('change',    filterAndDisplayBooks);
    libraryFilter.addEventListener('change',     filterAndDisplayBooks);
    availabilityFilter.addEventListener('change', filterAndDisplayBooks);
    sortFilter.addEventListener('change',        filterAndDisplayBooks);

    /* Initial render */
    filterAndDisplayBooks();
}

/* ═══════════════════════════════════════════════════════════
   BOOK DETAILS (book-details.html)
   ═══════════════════════════════════════════════════════════ */

/**
 * Initialises the book details page:
 * reads the book ID from the URL, fetches book data,
 * and renders the full detail view with library list.
 */
function initBookDetails() {
    const contentBody = document.getElementById('contentBody');
    const urlParams   = new URLSearchParams(window.location.search);
    const bookId      = urlParams.get('id');

    /* ── Validate book ID ── */
    if (!bookId) {
        renderBookNotFound(contentBody);
        return;
    }

    const book = StorageManager.getBook(bookId);

    if (!book) {
        renderBookNotFound(contentBody);
        return;
    }

    /* ── Get the libraries that carry this book ── */
    const allLibraries = StorageManager.getLibraries();
    const bookLibraries = allLibraries.filter(function (lib) {
        return book.libraryIds && book.libraryIds.includes(lib.id);
    });

    /* ── Build library list HTML ── */
    let libraryListHTML = '';
    if (bookLibraries.length === 0) {
        libraryListHTML = '<p class="text-muted">This book is not currently available at any partner library.</p>';
    } else {
        bookLibraries.forEach(function (lib) {
            libraryListHTML += `
                <div class="library-list-item">
                    <div>
                        <strong>${escapeHTML(lib.name)}</strong>
                        <div class="text-muted">${escapeHTML(lib.location)}</div>
                    </div>
                    <a href="borrow-request.html?bookId=${book.id}&libraryId=${lib.id}"
                       class="btn btn-primary btn-sm">
                        Request from here
                    </a>
                </div>`;
        });
    }

    /* ── Availability badge ── */
    const availBadge = book.available
        ? '<span class="badge badge-approved">Available</span>'
        : '<span class="badge badge-rejected">Unavailable</span>';

    /* ── First letter for the cover ── */
    const initial = book.title ? book.title.charAt(0).toUpperCase() : '?';

    /* ── Render the full page ── */
    contentBody.innerHTML = `
        <!-- Back navigation -->
        <div class="mb-3">
            <a href="books.html" class="btn btn-secondary btn-sm">← Back to Books</a>
        </div>

        <!-- Book Detail Container -->
        <div class="book-detail-container">
            <!-- Left: Large Book Cover -->
            <div class="book-detail-cover" style="background-color:${book.coverColor || '#6366f1'};">
                <div class="book-detail-cover-initial">${initial}</div>
            </div>

            <!-- Right: Book Information -->
            <div class="book-detail-info">
                <h1>${escapeHTML(book.title)}</h1>
                <p class="book-detail-author">by ${escapeHTML(book.author)}</p>
                <div class="mb-2">${availBadge}</div>

                <!-- Metadata Grid -->
                <div class="book-detail-meta">
                    <div class="book-detail-meta-item">
                        <span class="book-detail-meta-label">ISBN</span>
                        <span class="book-detail-meta-value">${escapeHTML(book.isbn)}</span>
                    </div>
                    <div class="book-detail-meta-item">
                        <span class="book-detail-meta-label">Publisher</span>
                        <span class="book-detail-meta-value">${escapeHTML(book.publisher)}</span>
                    </div>
                    <div class="book-detail-meta-item">
                        <span class="book-detail-meta-label">Year</span>
                        <span class="book-detail-meta-value">${book.year || 'N/A'}</span>
                    </div>
                    <div class="book-detail-meta-item">
                        <span class="book-detail-meta-label">Category</span>
                        <span class="book-detail-meta-value">${escapeHTML(book.category)}</span>
                    </div>
                </div>

                <!-- Description -->
                <div class="book-detail-description">
                    <h3>Description</h3>
                    <p>${escapeHTML(book.description || 'No description available.')}</p>
                </div>

                <!-- Available Libraries -->
                <div class="book-detail-libraries">
                    <h3>Available at Partner Libraries</h3>
                    ${libraryListHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders a "Book Not Found" empty state with a link back to the catalogue.
 * @param {HTMLElement} container - The content body element to render into.
 */
function renderBookNotFound(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📖</div>
            <h3 class="empty-state-title">Book Not Found</h3>
            <p class="empty-state-text">The book you're looking for doesn't exist.</p>
            <a href="books.html" class="btn btn-primary mt-2">Browse Books</a>
        </div>`;
}

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/**
 * Returns the HTML string for a single book card.
 * The card is clickable via a data attribute (event listener attached separately).
 * @param {Object} book - A book data object.
 * @returns {string} HTML string for the book card.
 */
function renderBookCard(book) {
    /* First letter of the title for the cover graphic */
    var initial = book.title ? book.title.charAt(0).toUpperCase() : '?';

    /* Availability badge */
    var availClass = book.available ? 'badge-approved' : 'badge-rejected';
    var availText  = book.available ? 'Available'      : 'Unavailable';

    return `
        <div class="book-card" data-book-id="${book.id}" style="cursor:pointer;" title="View details for ${escapeAttr(book.title)}">
            <div class="book-cover" style="background-color:${book.coverColor || '#6366f1'};">
                <div class="book-cover-initial">${initial}</div>
                <div class="book-cover-title">${escapeHTML(book.title)}</div>
                <span class="book-availability badge ${availClass}">${availText}</span>
            </div>
            <div class="book-info">
                <div class="book-title">${escapeHTML(book.title)}</div>
                <div class="book-author">by ${escapeHTML(book.author)}</div>
                <div class="book-meta">
                    <span>${escapeHTML(book.isbn)}</span>
                    <span class="book-category">${escapeHTML(book.category)}</span>
                </div>
            </div>
        </div>`;
}

/**
 * Returns the HTML string for the entire book grid, or an
 * empty-state message when there are no books to display.
 * @param {Array} books - Array of book objects to render.
 * @returns {string} HTML string.
 */
function renderBookGrid(books) {
    if (!books || books.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3 class="empty-state-title">No Books Found</h3>
                <p class="empty-state-text">Try adjusting your search or filters</p>
            </div>`;
    }

    var cardsHTML = '';
    books.forEach(function (book) {
        cardsHTML += renderBookCard(book);
    });

    return '<div class="book-grid">' + cardsHTML + '</div>';
}

/**
 * Escapes HTML special characters to prevent XSS when
 * injecting user-controlled data into the DOM.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string safe for innerHTML.
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/**
 * Escapes a string for safe use inside an HTML attribute value.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;');
}
