# Vistula Task Manager

A simple Task Manager built with plain HTML, CSS and JavaScript. Tasks are stored in a
Supabase (PostgreSQL) database and accessed through the Supabase auto-generated REST API.
Hosted on GitHub Pages.

- **Student ID:** 73477
- **Repository:** https://github.com/vistula-team-project-73477/vistula-task-manager
- **Live application:** https://vistula-team-project-73477.github.io/vistula-task-manager/
- **Contributor page:** https://vistula-team-project-73477.github.io/vistula-task-manager/contribution.html
- **Contributor JSON:** https://vistula-team-project-73477.github.io/vistula-task-manager/contribution.json

## Team collaboration

- **Partner:** PARTNER_NAME (student ID PARTNER_STUDENT_ID)
- **Pull Request I received (merged into this repo):** https://github.com/vistula-team-project-73477/vistula-task-manager/pull/1
- **Pull Request I created (merged into my partner's repo):** https://github.com/PARTNER_USERNAME/vistula-task-manager/pull/1

## Features

- List all tasks from the database
- Add a new task (title, description)
- Edit a task's title and description
- Mark a task as completed / incomplete
- Delete a task
- Error messages shown in `#status-message` when an operation fails

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main Task Manager page |
| `app.js` | Application logic (REST API calls with `fetch()`) |
| `style.css` | Styling |
| `config.json` | Public Supabase configuration |
| `supabase-setup.sql` | SQL to create the `tasks` table and RLS policies |
| `contribution.html` | Added by my partner through a Pull Request |
| `contribution.json` | Added by my partner through a Pull Request |

## REST API usage

Base URL: `https://avcmcrsqfiuwghpepnnc.supabase.co/rest/v1`

| Method | Endpoint | Used for |
|--------|----------|----------|
| GET | `/tasks?select=*` | Load all tasks |
| GET | `/tasks?id=eq.{id}&select=*` | Load one task before editing / toggling |
| POST | `/tasks` | Create a task |
| PUT | `/tasks?id=eq.{id}` | Save the complete task (edit and toggle) |
| DELETE | `/tasks?id=eq.{id}` | Delete a task |

## Database

Table `tasks`: `id` (bigint, identity, primary key), `title` (text, required),
`description` (text), `completed` (boolean, default `false`).
Row Level Security is enabled with public policies for select/insert/update/delete,
because this is a demonstration database containing only test data.

Only the public **publishable** key is stored in `config.json`. No secret or service-role key
is included in this repository.

## Running locally

`config.json` is loaded with `fetch()`, so open the site through a local web server
rather than double-clicking the file:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
