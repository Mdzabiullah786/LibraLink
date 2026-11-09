/**
 * ============================================================
 * LibraLink - Storage Manager (storage.js)
 * ============================================================
 * Centralized data layer that handles all CRUD operations
 * using the browser's localStorage API.
 *
 * This module manages:
 *   - Books catalog
 *   - Partner libraries
 *   - User accounts
 *   - Borrow requests
 *   - Current authenticated user session
 *
 * All data is persisted in localStorage under keys prefixed
 * with "libraLink_" to avoid collisions with other apps.
 * ============================================================
 */

const StorageManager = {

    /* --------------------------------------------------------
     * Storage Keys
     * --------------------------------------------------------
     * Constants for every localStorage key used by the app.
     * Using a central map prevents typos and makes refactoring
     * easy — change the value here and it updates everywhere.
     * ------------------------------------------------------ */
    KEYS: {
        BOOKS: 'libraLink_books',
        LIBRARIES: 'libraLink_libraries',
        USERS: 'libraLink_users',
        REQUESTS: 'libraLink_requests',
        CURRENT_USER: 'libraLink_currentUser',
        INITIALIZED: 'libraLink_initialized'
    },

    /* ========================================================
     * Initialization
     * ========================================================
     * Seeds demo data into localStorage the very first time
     * the application is loaded. Subsequent page loads skip
     * seeding so user changes are never overwritten.
     * ====================================================== */
    init() {
        // Guard: only seed data once
        if (localStorage.getItem(this.KEYS.INITIALIZED)) {
            return;
        }

        // ----- Demo Books (15) -----
        const books = [
            { id: "book_1", title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0262033848", publisher: "MIT Press", year: 2009, category: "Computer Science", description: "A comprehensive textbook covering a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.", coverColor: "#4a90d9", available: true, libraryIds: ["lib_1", "lib_3"] },
            { id: "book_2", title: "Design Patterns: Elements of Reusable Object-Oriented Software", author: "Erich Gamma", isbn: "978-0201633610", publisher: "Addison-Wesley", year: 1994, category: "Computer Science", description: "Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.", coverColor: "#e74c3c", available: true, libraryIds: ["lib_1", "lib_4"] },
            { id: "book_3", title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", isbn: "978-0132350884", publisher: "Prentice Hall", year: 2008, category: "Software Engineering", description: "A handbook of agile software craftsmanship. Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.", coverColor: "#2ecc71", available: true, libraryIds: ["lib_2", "lib_5"] },
            { id: "book_4", title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", publisher: "Scribner", year: 1925, category: "Literature", description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, a tale of the American Dream.", coverColor: "#f39c12", available: true, libraryIds: ["lib_3", "lib_5"] },
            { id: "book_5", title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061120084", publisher: "Harper Perennial", year: 1960, category: "Literature", description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.", coverColor: "#9b59b6", available: true, libraryIds: ["lib_2", "lib_3"] },
            { id: "book_6", title: "Calculus: Early Transcendentals", author: "James Stewart", isbn: "978-1285741550", publisher: "Cengage Learning", year: 2015, category: "Mathematics", description: "Success in your calculus course starts here! James Stewart's Calculus texts are world-wide best-sellers for a reason.", coverColor: "#1abc9c", available: true, libraryIds: ["lib_1", "lib_4"] },
            { id: "book_7", title: "Physics for Scientists and Engineers", author: "Raymond A. Serway", isbn: "978-1337553278", publisher: "Cengage Learning", year: 2018, category: "Physics", description: "Achieve success in your physics course by making the most of what Serway has to offer. With a comprehensive approach to physics concepts.", coverColor: "#34495e", available: true, libraryIds: ["lib_1", "lib_2"] },
            { id: "book_8", title: "Organic Chemistry", author: "Paula Yurkanis Bruice", isbn: "978-0134042282", publisher: "Pearson", year: 2016, category: "Chemistry", description: "All the concepts and strategies students need for a deep understanding of organic chemistry, with a focus on reaction mechanisms.", coverColor: "#e67e22", available: false, libraryIds: ["lib_3", "lib_5"] },
            { id: "book_9", title: "Campbell Biology", author: "Lisa A. Urry", isbn: "978-0134093413", publisher: "Pearson", year: 2016, category: "Biology", description: "The world's most successful majors biology text and target guide for understanding biology, covering all aspects of life sciences.", coverColor: "#27ae60", available: true, libraryIds: ["lib_2", "lib_4"] },
            { id: "book_10", title: "Principles of Economics", author: "N. Gregory Mankiw", isbn: "978-1305585126", publisher: "Cengage Learning", year: 2014, category: "Economics", description: "The most popular introductory economics text, providing a comprehensive overview of economic theory and practice.", coverColor: "#2980b9", available: true, libraryIds: ["lib_1", "lib_5"] },
            { id: "book_11", title: "Database System Concepts", author: "Abraham Silberschatz", isbn: "978-0078022159", publisher: "McGraw-Hill", year: 2019, category: "Computer Science", description: "Presents the fundamental concepts of database management. This text is designed for a first course in databases at the junior/senior undergraduate level.", coverColor: "#8e44ad", available: true, libraryIds: ["lib_1", "lib_3"] },
            { id: "book_12", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", isbn: "978-0134610993", publisher: "Pearson", year: 2020, category: "Computer Science", description: "The most comprehensive, up-to-date introduction to the theory and practice of artificial intelligence, used in over 1500 universities worldwide.", coverColor: "#c0392b", available: true, libraryIds: ["lib_2", "lib_4"] },
            { id: "book_13", title: "The Art of War", author: "Sun Tzu", isbn: "978-1599869773", publisher: "Filiquarian", year: 2007, category: "Philosophy", description: "An ancient Chinese military treatise dating from the 5th century BC. It has had a profound influence on military strategy and beyond.", coverColor: "#16a085", available: true, libraryIds: ["lib_3", "lib_5"] },
            { id: "book_14", title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0553380163", publisher: "Bantam Books", year: 1998, category: "Physics", description: "A landmark volume in science writing by one of the great minds of our time, exploring the nature of time and the universe.", coverColor: "#2c3e50", available: true, libraryIds: ["lib_1", "lib_2"] },
            { id: "book_15", title: "The Lean Startup", author: "Eric Ries", isbn: "978-0307887894", publisher: "Crown Business", year: 2011, category: "Business", description: "How today's entrepreneurs use continuous innovation to create radically successful businesses with a scientific approach.", coverColor: "#d35400", available: true, libraryIds: ["lib_4", "lib_5"] }
        ];

        // ----- Demo Partner Libraries (5) -----
        const libraries = [
            { id: "lib_1", name: "Central University Library", code: "CUL", location: "123 University Ave, Academic City", email: "central@university.edu", phone: "(555) 100-2000", totalBooks: 12500 },
            { id: "lib_2", name: "Westside Community Library", code: "WCL", location: "456 West Blvd, Westside District", email: "info@westside-library.org", phone: "(555) 200-3000", totalBooks: 8700 },
            { id: "lib_3", name: "Eastgate Research Library", code: "ERL", location: "789 East Dr, Eastgate Campus", email: "research@eastgate.edu", phone: "(555) 300-4000", totalBooks: 15200 },
            { id: "lib_4", name: "Northfield Public Library", code: "NPL", location: "321 North St, Northfield Town", email: "public@northfield-lib.org", phone: "(555) 400-5000", totalBooks: 6300 },
            { id: "lib_5", name: "Southbank Digital Library", code: "SDL", location: "654 South Rd, Southbank Center", email: "digital@southbank-lib.org", phone: "(555) 500-6000", totalBooks: 9800 }
        ];

        // ----- Demo Users (5) -----
        const users = [
            { id: "user_1", name: "Alex Johnson", email: "alex.johnson@university.edu", password: "student123", role: "student", studentId: "STU-2024-001" },
            { id: "user_2", name: "Maria Garcia", email: "maria.garcia@university.edu", password: "student123", role: "student", studentId: "STU-2024-002" },
            { id: "user_3", name: "Sarah Mitchell", email: "sarah.lib@westside.edu", password: "library123", role: "librarian", studentId: null },
            { id: "user_4", name: "James Parker", email: "james.lib@central.edu", password: "library123", role: "librarian", studentId: null },
            { id: "user_5", name: "Admin User", email: "admin@libralink.edu", password: "admin123", role: "admin", studentId: null }
        ];

        // ----- Demo Borrow Requests (5) -----
        const requests = [
            { id: "REQ-20241001-0001", requesterId: "user_1", requesterName: "Alex Johnson", studentId: "STU-2024-001", email: "alex.johnson@university.edu", bookId: "book_1", bookTitle: "Introduction to Algorithms", isbn: "978-0262033848", sourceLibraryId: "lib_1", sourceLibraryName: "Central University Library", requestDate: "2024-10-01", duration: "14", message: "Need for algorithms course research project", approvalStatus: "approved", shipmentStatus: "dispatched", dueDate: "2024-11-01", returnStatus: "not_returned" },
            { id: "REQ-20241005-0002", requesterId: "user_1", requesterName: "Alex Johnson", studentId: "STU-2024-001", email: "alex.johnson@university.edu", bookId: "book_3", bookTitle: "Clean Code", isbn: "978-0132350884", sourceLibraryId: "lib_2", sourceLibraryName: "Westside Community Library", requestDate: "2024-10-05", duration: "21", message: "Recommended reading for software engineering class", approvalStatus: "pending", shipmentStatus: "not_dispatched", dueDate: null, returnStatus: "not_returned" },
            { id: "REQ-20241008-0003", requesterId: "user_2", requesterName: "Maria Garcia", studentId: "STU-2024-002", email: "maria.garcia@university.edu", bookId: "book_4", bookTitle: "The Great Gatsby", isbn: "978-0743273565", sourceLibraryId: "lib_3", sourceLibraryName: "Eastgate Research Library", requestDate: "2024-10-08", duration: "14", message: "Required reading for American Literature course", approvalStatus: "approved", shipmentStatus: "delivered", dueDate: "2024-11-20", returnStatus: "not_returned" },
            { id: "REQ-20241010-0004", requesterId: "user_1", requesterName: "Alex Johnson", studentId: "STU-2024-001", email: "alex.johnson@university.edu", bookId: "book_2", bookTitle: "Design Patterns", isbn: "978-0201633610", sourceLibraryId: "lib_4", sourceLibraryName: "Northfield Public Library", requestDate: "2024-10-10", duration: "30", message: "Reference for design patterns study group", approvalStatus: "rejected", shipmentStatus: "not_dispatched", dueDate: null, returnStatus: "not_returned" },
            { id: "REQ-20241012-0005", requesterId: "user_2", requesterName: "Maria Garcia", studentId: "STU-2024-002", email: "maria.garcia@university.edu", bookId: "book_6", bookTitle: "Calculus: Early Transcendentals", isbn: "978-1285741550", sourceLibraryId: "lib_1", sourceLibraryName: "Central University Library", requestDate: "2024-10-12", duration: "21", message: "Need for calculus final exam preparation", approvalStatus: "approved", shipmentStatus: "in_transit", dueDate: "2024-11-25", returnStatus: "not_returned" }
        ];

        // Persist all demo data to localStorage
        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
        localStorage.setItem(this.KEYS.LIBRARIES, JSON.stringify(libraries));
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(this.KEYS.REQUESTS, JSON.stringify(requests));

        // Mark initialization complete so data is never re-seeded
        localStorage.setItem(this.KEYS.INITIALIZED, 'true');
    },

    /* ========================================================
     * Books CRUD
     * ======================================================== */

    /**
     * Retrieve all books from localStorage.
     * @returns {Array} Array of book objects, or empty array on error.
     */
    getBooks() {
        try {
            const data = localStorage.getItem(this.KEYS.BOOKS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('StorageManager.getBooks – failed to parse:', e);
            return [];
        }
    },

    /**
     * Retrieve a single book by its ID.
     * @param {string} id - The book's unique identifier.
     * @returns {Object|null} The book object, or null if not found.
     */
    getBook(id) {
        const books = this.getBooks();
        return books.find(b => b.id === id) || null;
    },

    /**
     * Add a new book or update an existing one (matched by id).
     * @param {Object} book - The book object to save.
     */
    saveBook(book) {
        const books = this.getBooks();
        const index = books.findIndex(b => b.id === book.id);

        if (index !== -1) {
            // Update existing book
            books[index] = book;
        } else {
            // Add new book
            books.push(book);
        }

        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
    },

    /**
     * Delete a book by its ID.
     * @param {string} id - The book's unique identifier.
     */
    deleteBook(id) {
        const books = this.getBooks().filter(b => b.id !== id);
        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
    },

    /* ========================================================
     * Libraries CRUD
     * ======================================================== */

    /**
     * Retrieve all partner libraries.
     * @returns {Array} Array of library objects.
     */
    getLibraries() {
        try {
            const data = localStorage.getItem(this.KEYS.LIBRARIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('StorageManager.getLibraries – failed to parse:', e);
            return [];
        }
    },

    /**
     * Retrieve a single library by its ID.
     * @param {string} id - The library's unique identifier.
     * @returns {Object|null} The library object, or null if not found.
     */
    getLibrary(id) {
        const libraries = this.getLibraries();
        return libraries.find(l => l.id === id) || null;
    },

    /**
     * Add a new library or update an existing one.
     * @param {Object} library - The library object to save.
     */
    saveLibrary(library) {
        const libraries = this.getLibraries();
        const index = libraries.findIndex(l => l.id === library.id);

        if (index !== -1) {
            libraries[index] = library;
        } else {
            libraries.push(library);
        }

        localStorage.setItem(this.KEYS.LIBRARIES, JSON.stringify(libraries));
    },

    /**
     * Delete a library by its ID.
     * @param {string} id - The library's unique identifier.
     */
    deleteLibrary(id) {
        const libraries = this.getLibraries().filter(l => l.id !== id);
        localStorage.setItem(this.KEYS.LIBRARIES, JSON.stringify(libraries));
    },

    /* ========================================================
     * Users CRUD
     * ======================================================== */

    /**
     * Retrieve all registered users.
     * @returns {Array} Array of user objects.
     */
    getUsers() {
        try {
            const data = localStorage.getItem(this.KEYS.USERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('StorageManager.getUsers – failed to parse:', e);
            return [];
        }
    },

    /**
     * Retrieve a single user by their ID.
     * @param {string} id - The user's unique identifier.
     * @returns {Object|null} The user object, or null if not found.
     */
    getUser(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id) || null;
    },

    /**
     * Add a new user or update an existing one.
     * @param {Object} user - The user object to save.
     */
    saveUser(user) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);

        if (index !== -1) {
            users[index] = user;
        } else {
            users.push(user);
        }

        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    /**
     * Delete a user by their ID.
     * @param {string} id - The user's unique identifier.
     */
    deleteUser(id) {
        const users = this.getUsers().filter(u => u.id !== id);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    /* ========================================================
     * Requests CRUD
     * ======================================================== */

    /**
     * Retrieve all borrow requests.
     * @returns {Array} Array of request objects.
     */
    getRequests() {
        try {
            const data = localStorage.getItem(this.KEYS.REQUESTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('StorageManager.getRequests – failed to parse:', e);
            return [];
        }
    },

    /**
     * Retrieve a single request by its ID.
     * @param {string} id - The request's unique identifier (e.g. "REQ-20241001-0001").
     * @returns {Object|null} The request object, or null if not found.
     */
    getRequest(id) {
        const requests = this.getRequests();
        return requests.find(r => r.id === id) || null;
    },

    /**
     * Add a new request or update an existing one.
     * @param {Object} request - The request object to save.
     */
    saveRequest(request) {
        const requests = this.getRequests();
        const index = requests.findIndex(r => r.id === request.id);

        if (index !== -1) {
            requests[index] = request;
        } else {
            requests.push(request);
        }

        localStorage.setItem(this.KEYS.REQUESTS, JSON.stringify(requests));
    },

    /**
     * Delete a request by its ID.
     * @param {string} id - The request's unique identifier.
     */
    deleteRequest(id) {
        const requests = this.getRequests().filter(r => r.id !== id);
        localStorage.setItem(this.KEYS.REQUESTS, JSON.stringify(requests));
    },

    /* ========================================================
     * Authentication Helpers
     * ======================================================== */

    /**
     * Get the currently logged-in user from session storage.
     * @returns {Object|null} The current user object, or null.
     */
    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_USER);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('StorageManager.getCurrentUser – failed to parse:', e);
            return null;
        }
    },

    /**
     * Store the current user session.
     * @param {Object} user - The user object to persist as the active session.
     */
    setCurrentUser(user) {
        localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
    },

    /**
     * Clear the current user session (log out).
     */
    clearCurrentUser() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
    },

    /* ========================================================
     * ID Generation Utilities
     * ======================================================== */

    /**
     * Generate a unique request ID in the format REQ-YYYYMMDD-XXXX.
     * The 4-digit suffix is random (1000–9999) to minimise collisions.
     * @returns {string} A formatted request ID.
     */
    generateRequestId() {
        const now = new Date();
        const date = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `REQ-${date}-${random}`;
    },

    /**
     * Generate a unique ID with a given prefix.
     * Combines a timestamp and a random number for uniqueness.
     * @param {string} prefix - The prefix for the ID (e.g. "book", "lib", "user").
     * @returns {string} A unique identifier string.
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
};

// ============================================================
// Auto-initialize on script load
// Seeds demo data the first time, no-ops on subsequent loads.
// ============================================================
StorageManager.init();
