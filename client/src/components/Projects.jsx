
import { useEffect, useState } from "react";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const [projectsResponse, usersResponse] =
                    await Promise.all([
                        fetch("http://localhost:9000/api/projects"),
                        fetch("http://localhost:9000/api/users")
                    ]);

                if (!projectsResponse.ok || !usersResponse.ok) {
                    throw new Error("Could not load projects or users.");
                }

                const projectsData = await projectsResponse.json();
                const usersData = await usersResponse.json();

                setProjects(projectsData);
                setUsers(usersData);
            } catch (err) {
                console.error("Loading error:", err);
                setError("Could not load projects. Please try again.");
            }
        }

        fetchData();
    }, []);

    function getProjectLead(project) {
        const lead = users.find(
            (user) => user._id === project.project_lead_id
        );

        if (!lead) {
            return "Unknown user";
        }

        return `${lead.f_name} ${lead.l_name} (${lead.username})`;
    }

    return (
        <section className="projects-section">
            <h2>Projects</h2>

            {error && <p className="error-message">{error}</p>}

            {!error && projects.length === 0 && (
                <p>No projects found.</p>
            )}

            <div className="projects-list">
                {projects.map((project) => (
                    <article
                        className="project-card"
                        key={project._id}
                    >
                        <h3>{project.name}</h3>

                        <p>{project.description}</p>

                        <p>
                            <strong>Status:</strong> {project.status}
                        </p>

                        <p>
                            <strong>Project Lead:</strong>{" "}
                            {getProjectLead(project)}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Projects;
