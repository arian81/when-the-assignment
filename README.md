<div align="center">

<h3 align="center">When The Assignment</h3>

  <p align="center">
    A web application to track and manage your upcoming assignments.
    <br />
     <a href="https://github.com/arian81/when-the_assignment">github.com/arian81/when-the_assignment</a>
  </p>
</div>

## Table of Contents

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#key-features">Key Features</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About The Project

When The Assignment is a web application designed to help students and anyone else track and manage their assignments. It allows users to create sessions, add assignments with due dates and links, categorize them by course, and view them in a list. The application also provides a calendar link for subscribing to assignments in external calendar applications.

### Key Features

- **Session Management:** Create and manage sessions to organize assignments.
- **Assignment Tracking:** Add assignments with titles, URLs, due dates, and course codes.
- **Course Categorization:** Categorize assignments by course, making it easy to view assignments for a specific subject.
- **Calendar Integration:** Subscribe to a calendar feed to view assignments in your preferred calendar application.
- **Responsive UI:** Built with modern UI components for a smooth user experience.
- **Local Storage:** Remembers previous sessions using local storage.

The project is built using the T3 Stack, which includes:

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI, Geist UI, Lucide React
- **Backend:** tRPC, Prisma
- **Database:** PostgreSQL
- **Other:** Zod for schema validation, Superjson for data serialization

## Getting Started

To get started with the project, follow these steps:

### Prerequisites

- Node.js (version >= 20)
- pnpm (version >= 9)
- Docker (for running the PostgreSQL database)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/arian81/when-the-assignment.git
    cd when-the-assignment
    ```

2.  **Install dependencies:**

    ```sh
    pnpm install
    ```

3.  **Set up the database:**

    - Copy `.env.example` to `.env` and modify the `DATABASE_URL` if necessary.
    - Run the database using Docker:

      ```sh
      ./start-database.sh
      ```

4.  **Run Prisma migrations:**

    ```sh
    pnpm db:migrate
    ```

5.  **Start the development server:**

    ```sh
    pnpm dev
    ```

6.  **Access the application:**

    Open your browser and navigate to `http://localhost:3000`.

## Acknowledgments

- This README was created using [gitreadme.dev](https://gitreadme.dev) — an AI tool that looks at your entire codebase to instantly generate high-quality README files.
