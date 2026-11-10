# 📚 LibraLink – Interlibrary Borrowing Management System

**Connecting Libraries. Expanding Access to Knowledge.**

LibraLink is a web-based Interlibrary Borrowing Management System designed to simplify the process of requesting, approving, borrowing, tracking, and returning books across multiple libraries.

The platform allows users to discover books from partner libraries, submit borrowing requests, and monitor their request status. Library staff can manage incoming requests, approve or reject them, update shipment information, assign due dates, and manage book returns.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Project Objective](#-project-objective)
- [Core Features](#-core-features)
- [User Roles](#-user-roles)
- [Application Workflow](#-application-workflow)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Data Management](#-data-management)
- [Functional Modules](#-functional-modules)
- [Future Enhancements](#-future-enhancements)
- [Limitations](#-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

Libraries sometimes do not have every book or academic resource requested by their users. Instead of limiting users to their own library collections, LibraLink provides a centralized platform for discovering and requesting books from partner libraries.

The system provides a structured borrowing workflow where users can submit requests, library staff can manage approvals, and both sides can track shipment and return information.

LibraLink aims to make interlibrary resource sharing more organized, accessible, and efficient.

---

## ❗ Problem Statement

A library may not own every book requested by its users and may need to obtain materials from partner libraries while tracking requests and delivery status.

Managing these activities manually can make it difficult to coordinate borrowing requests, approvals, shipment information, due dates, and returns.

## 🎯 Project Objective

Build a system for managing interlibrary borrowing requests.

The objective is to provide a centralized web-based interface that simplifies communication and coordination between users and partner libraries.

---

## ✨ Core Features

### 1. 📖 Book Discovery and Search
- Browse available books from multiple libraries.
- Search books by title, author, or ISBN.
- Filter books by category and library.
- View detailed book information.
- Check book availability.

### 2. 📝 Book Borrowing Requests
- Submit borrowing requests.
- Enter requester information.
- Select a source library.
- Generate a unique request ID.
- Track submitted requests.

### 3. 👤 Requester Management
- Maintain requester information.
- View borrowing history.
- Access personal borrowing requests.
- Monitor request progress.

### 4. ✅ Request Approval Management
- View incoming borrowing requests.
- Approve or reject requests.
- Update approval status.
- Manage request processing.

### 5. 🚚 Shipment Tracking
- Track the movement of requested books.
- Update shipment status.
- Monitor delivery progress.

Available shipment statuses:
- Not Dispatched
- Dispatched
- In Transit
- Delivered

### 6. 📅 Due Date Management
- Assign due dates to approved borrowing requests.
- Display due dates to requesters.
- Monitor upcoming returns.

### 7. 🔄 Return Management
- Update book return status.
- Track completed returns.
- Maintain borrowing records.

### 8. 📊 Dashboard and Statistics
- View total borrowing requests.
- Monitor pending approvals.
- Track approved and rejected requests.
- View currently borrowed books.
- Monitor completed returns.

---

## 👥 User Roles

LibraLink provides three simulated user roles.

### 1. Student / Requester
- Discover books.
- Search and filter the catalogue.
- Submit borrowing requests.
- View personal requests.
- Track approval and shipment status.
- Check due dates.
- Monitor return status.

### 2. Partner Library Staff
- View incoming borrowing requests.
- Access requester details.
- Approve or reject requests.
- Update shipment status.
- Assign due dates.
- Update return information.

### 3. Administrator
- Monitor overall platform activity.
- Manage book records.
- Manage partner libraries.
- View borrowing requests.
- Manage user records.
- Monitor application statistics.

---

## 🔄 Application Workflow

The following workflow describes the complete interlibrary borrowing process:

1. A student logs into the application.
2. The student searches for a required book.
3. The student explores available partner libraries.
4. The student selects a suitable source library.
5. The student submits a borrowing request.
6. The system generates a unique request ID.
7. The request is assigned a Pending status.
8. Library staff reviews the incoming request.
9. Staff approves or rejects the request.
10. If approved, shipment processing begins.
11. Staff updates shipment information.
12. The student tracks the shipment.
13. Staff assigns a due date.
14. The student views the due date.
15. Staff updates the return status.
16. The request is marked as completed after the book is returned.

This workflow provides a structured approach to managing interlibrary borrowing activities.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structure and content of web pages |
| CSS3 | Styling, layouts and responsive design |
| Vanilla JavaScript | Application logic and interactivity |
| LocalStorage | Browser-based data persistence |
| VS Code | Development environment |
| Git | Version control |
| GitHub | Source code hosting |
| Live Server | Local development and testing |

**Important:** The project uses plain HTML, CSS and Vanilla JavaScript without frontend or backend frameworks.

---

## 🏗️ Architecture

LibraLink follows a **Monolithic Frontend Architecture**.

All application pages, styling, JavaScript functionality, and assets are maintained inside one project directory.

The application uses a centralized LocalStorage-based data management approach.

### Architecture Overview

```text
              LIBRALINK
                  |
        ---------------------
        |         |         |
      HTML       CSS    JavaScript
        |         |         |
        |         |    Application
        |         |      Logic
        |         |         |
        ---------------------
                  |
             LocalStorage
                  |
        ---------------------
        |         |         |
       Users     Books    Requests
                  |
              Libraries
```

This architecture keeps the application simple, integrated, and suitable for frontend development and demonstration.

---

## 📁 Project Structure

```text
LibraLink/
│
├── index.html
├── login.html
├── dashboard.html
├── books.html
├── book-details.html
├── borrow-request.html
├── my-requests.html
├── library-management.html
├── admin-dashboard.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── books.js
│   ├── requests.js
│   ├── admin.js
│   └── storage.js
│
├── assets/
│   └── images/
│
└── README.md
```

### Folder Explanation

**HTML Files**
- `index.html` – Main landing page.
- `login.html` – User authentication interface.
- `dashboard.html` – Student dashboard.
- `books.html` – Book discovery and catalogue.
- `book-details.html` – Detailed book information.
- `borrow-request.html` – Borrowing request form.
- `my-requests.html` – Request tracking interface.
- `library-management.html` – Partner library staff dashboard.
- `admin-dashboard.html` – Administrative dashboard.

**CSS**
- `style.css` – Centralized application styling and responsive layouts.

**JavaScript**
- `app.js` – General application functionality.
- `auth.js` – Simulated authentication and role management.
- `books.js` – Book catalogue and search functionality.
- `requests.js` – Borrowing request management.
- `admin.js` – Administrative operations.
- `storage.js` – LocalStorage data management.

---

## 🚀 Installation and Setup

Follow these steps to run LibraLink locally.

### Prerequisites

Install the following tools:

- Visual Studio Code
- Git
- A modern web browser
- VS Code Live Server extension

### Step 1: Clone the Repository

Open your terminal and execute:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Replace the placeholder with your actual GitHub repository URL.

### Step 2: Open the Project

Navigate to the project directory:

```bash
cd LibraLink
```

Open the folder in Visual Studio Code:

```bash
code .
```

### Step 3: Install Live Server

1. Open Visual Studio Code.
2. Navigate to Extensions.
3. Search for Live Server.
4. Install the extension.

### Step 4: Run the Application

1. Open `index.html`.
2. Right-click inside the editor.
3. Select **Open with Live Server**.
4. The application will open in your default browser.

You can now explore the LibraLink application.

---

## 💾 Data Management

LibraLink uses browser LocalStorage to store application data.

The application maintains separate storage entries for different types of information.

Suggested LocalStorage keys:

| Key | Purpose |
|---|---|
| `libraLink_users` | User information |
| `libraLink_books` | Book catalogue |
| `libraLink_libraries` | Partner library records |
| `libraLink_requests` | Borrowing request records |
| `libraLink_currentUser` | Current simulated login session |

### Data Persistence

- Data remains available after refreshing the page.
- Borrowing requests are stored locally.
- Request status changes are saved.
- Book and library records can be managed through the interface.

**Note:** LocalStorage stores data in the user's browser and is not a centralized database.

---

## 📦 Functional Modules

| Module | Main Responsibility |
|---|---|
| Authentication | Simulated user login and role selection |
| Book Catalogue | Book discovery and filtering |
| Book Details | Display complete book information |
| Borrowing Requests | Create and submit requests |
| Request Tracking | Monitor borrowing progress |
| Library Management | Process borrowing requests |
| Admin Dashboard | Manage application records |
| Data Management | Maintain LocalStorage records |

---

## 🔮 Future Enhancements

The following improvements can be considered for future versions:

- Backend integration.
- Centralized database management.
- Real-time synchronization between partner libraries.
- Secure authentication and authorization.
- Email and SMS notifications.
- QR code-based book identification.
- Advanced book recommendation system.
- Automated overdue reminders.
- Book reservation functionality.
- Detailed borrowing analytics.
- Integration with university library systems.

---

## ⚠️ Limitations

LibraLink is a frontend-based academic demonstration.

Current architectural limitations include:

- LocalStorage is browser-specific.
- Data is not synchronized between different devices.
- Authentication is simulated and is not production-secure.
- Book availability is based on stored sample data.
- Shipment tracking is simulated through manual status updates.
- No real-world library network or shipping service is connected.

A backend and centralized database would be required to support real-time coordination between independent libraries.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

If you would like to improve LibraLink:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Test your modifications.
5. Submit a pull request.

Please maintain the existing HTML, CSS and Vanilla JavaScript technology stack when contributing to the current version.

---

## 📄 License

This project is developed for academic and educational purposes.

A formal open-source license can be added to the repository when appropriate.

---

## ⭐ Acknowledgement

LibraLink demonstrates how web technologies can help simplify library resource sharing and interlibrary borrowing management.

**LibraLink – Connecting Libraries. Expanding Access to Knowledge.**
