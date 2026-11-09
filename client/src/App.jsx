import { useState } from "react";
import "./App.css";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import ProjectMemberships from "./components/ProjectMemberships";
import ProjectBacklog from "./components/ProjectBacklog";


function App() {
    const [page, setPage] = useState("signup");
    const [selectedProject, setSelectedProject] = useState("");

    function handleProjectCreated(projectId) {
        setSelectedProject(projectId);
        setPage("memberships");
    }

    return (
        <div className="app">
            {page === "signup" && (
                <div className="auth-page">
                    <h1>Welcome</h1>
                    <p className = "subtitle">
                        Create an account or log in to manage your projects and memberships.
                    </p>

                    <Signup 
                        onLoginClick={() => setPage("login")} 
                        onSignupSuccess={() => setPage("login")}
                    />
                </div>
            )}

            {page === "login" && (
                <div className="auth-page">
                    <h1>Welcome Back!</h1>
                    <p className = "subtitle">
                        Log in to continue to your projects and memberships.
                    </p>
                    
                    <Login 
                    onSignupClick={() => setPage("signup")} 
                    onLoginSuccess={() => setPage("projects")}
                    />
                </div>
            )}

            {page === "projects" && (
                <div className="dashboard">
                    <header className="dashboard-header">
                        <h1>My Projects</h1>
                        <p className="subtitle">
                            Organize your work and collaborate with your team.
                        </p>
                    </header>

                    <Projects />

                    <CreateProject onProjectCreated={handleProjectCreated} />


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPage("memberships")}
                    >
                        Manage Project Members
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPage("backlog")}
                    >
                        View Project Backlog
                    
                    </button>
                </div>
            )}
            

            {page === "memberships" && (
                <div className="membership-page">
                    <h1>Project Members</h1>
                    <p className="subtitle">
                        Manage the people working on your projects.
                    </p>

                    <ProjectMemberships
                        selectedProjectId={selectedProject}
                    />

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPage("projects")}
                    >
                        Back to Projects
                    </button>
                </div>
            )}

             {page === "backlog" && (
                <div className="dashboard">
                    <h1>Project Backlog</h1>
                    <p className="subtitle">
                        View and manage user stories for your projects.
                    </p>

                    <ProjectBacklog projectId={selectedProject} />

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPage("projects")}
                    >
                        Back to Projects
                    </button>
                </div>
            )}


        </div>
    );
}

            
export default App;