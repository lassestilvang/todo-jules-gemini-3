# Daily Task Planner

A modern, professional daily task planner application built with Next.js 16.

![Daily Planner](./public/screenshot.png)

## Features

- **Task Management**: Create tasks with descriptions, priority, due dates, deadlines, estimates, and actual time tracking.
- **Lists**: Organize tasks into custom lists (Inbox, Today, Upcoming, etc.).
- **Subtasks**: Break down complex tasks into smaller subtasks.
- **Recurrence**: Set tasks to repeat Daily, Weekly, Monthly, or Yearly.
- **Attachments**: Upload and attach files to tasks.
- **Labels**: Categorize tasks with custom color-coded labels.
- **Activity Logs**: Track changes to tasks over time.
- **Views**:
  - **Today**: Focus on what needs to be done today.
  - **Next 7 Days**: See your week at a glance.
  - **Upcoming**: View all scheduled future tasks.
  - **All Tasks**: Browse everything.
  - **Show Completed**: Toggle visibility of finished tasks.
- **Search**: Fast fuzzy search to find tasks instantly (CMD+K).
- **Dark Mode**: Fully supported dark and light themes.

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Language**: TypeScript
- **Database**: SQLite (via `better-sqlite3` for App, `bun:sqlite` for Tests)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repo-url>
    cd daily-planner
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Set up the database:
    ```bash
    # Push the schema to the local SQLite database
    npx drizzle-kit push
    ```

4.  Run the development server:
    ```bash
    bun run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Tests

This project uses Bun's native test runner.

```bash
bun test
```

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: React components (UI, Tasks, Layout).
- `src/lib`: Utilities, Database configuration, Drizzle Schema.
- `src/actions`: Server Actions for data mutation (Tasks, Lists, Labels, etc.).
- `drizzle`: Database migration files.

## Database

The application uses a local SQLite database (`sqlite.db`).
- **Development/Production**: Uses `better-sqlite3` for compatibility with Next.js (Node.js runtime).
- **Testing**: Uses `bun:sqlite` for native performance and compatibility with `bun test`. This is handled via conditional loading in `src/lib/db.ts` and mocking in tests.

## License

MIT
