/**
 * ============================================================
 * LibraLink - Authentication Utilities (auth.js)
 * ============================================================
 * Provides helper functions for user authentication:
 *   - checkAuth()     – gate-keep protected pages
 *   - login()         – validate credentials & start session
 *   - logout()        – end session & redirect
 *   - getRedirectUrl() – role-based landing page routing
 *
 * Depends on: storage.js (must be loaded first)
 * ============================================================
 */

/**
 * Check if the user is authenticated.
 *
 * Call this at the very top of every protected page's
 * initialisation function. If no user session exists the
 * browser is immediately redirected to the login page.
 *
 * @returns {Object|null} The current user object, or null
 *                        (null means a redirect is in progress).
 */
function checkAuth() {
    const user = StorageManager.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

/**
 * Authenticate a user with their email, password, and role.
 *
 * Searches the users collection for an exact match on all
 * three fields. If a match is found, a session object
 * (excluding the password) is persisted via StorageManager
 * and returned to the caller.
 *
 * @param {string} email    – The user's email address.
 * @param {string} password – The user's plaintext password.
 * @param {string} role     – The selected role (student | librarian | admin).
 * @returns {Object|null}   The session user object on success, or null.
 */
function login(email, password, role) {
    const users = StorageManager.getUsers();

    // Find a user whose email, password, AND role all match
    const user = users.find(
        u => u.email === email && u.password === password && u.role === role
    );

    if (user) {
        // Build a session object without the password
        const currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId || null
        };

        // Persist the session
        StorageManager.setCurrentUser(currentUser);
        return currentUser;
    }

    // No matching user found
    return null;
}

/**
 * Log out the current user.
 *
 * Clears the persisted session and redirects the browser
 * back to the login page.
 */
function logout() {
    StorageManager.clearCurrentUser();
    window.location.href = 'login.html';
}

/**
 * Get the appropriate dashboard URL for a given role.
 *
 * Each role has a different landing page after login:
 *   - student   → dashboard.html
 *   - librarian → library-management.html
 *   - admin     → admin-dashboard.html
 *
 * @param {string} role – The user's role.
 * @returns {string} The relative URL of the role's dashboard.
 */
function getRedirectUrl(role) {
    switch (role) {
        case 'student':
            return 'dashboard.html';
        case 'librarian':
            return 'library-management.html';
        case 'admin':
            return 'admin-dashboard.html';
        default:
            return 'dashboard.html';
    }
}
