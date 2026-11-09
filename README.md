# PA4 – Project Management Application

## Assignment Overview
The goal of this assignment was to extend the project management web application from PA3 by adding user stories and a project backlog. The application uses React, Express, and MongoDB.

## What I Implemented
- User signup and login.
- Create and view projects with a name, description, status, and project lead.
- Automatically add the project lead as a member.
- Add and remove project members.
- Prevent duplicate memberships and prevent removing the project lead.
- Create user stories for a selected project.
- View user stories in each project's backlog.
- Edit and delete existing user stories.
- Assign user stories to project members or leave them unassigned.
- Set story priorities to High, Medium, or Low.
- Update story statuses to To Do, In Progress, or Done.
- Validate user story descriptions using the required format: "As a [user], I want [goal], so that [benefit]."
- Prevent removing project members who are assigned to user stories.
- Display user stories with colored priority and status badges.

## Technologies Used
- React
- Node.js and Express
- MongoDB
- JavaScript and CSS

## How to Run

**Backend:**

Open a terminal and run:

```bash
cd server
npm install
node server.js
```

**Frontend:**

Open a second terminal and run:

```bash
cd client
npm install
npm run dev
```

Configure the required MongoDB connection in `server/.env` before starting the backend.

## Project Structure

```text
icsi418y-pa4/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── CreateProject.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProjectBacklog.jsx
│   │   │   ├── ProjectMemberships.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
├── server/
│   ├── server.js
│   └── package.json
├── .gitignore
├── package-lock.json
└── README.md
```

## Database

The application uses the `pa2` MongoDB database with four collections:

- `users`
- `projects`
- `project_memberships`
- `user_stories`

The `user_stories` collection stores each story's title, description, priority, status, assigned member, and associated project.
