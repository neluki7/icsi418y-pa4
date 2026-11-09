
import { useState } from "react";

function CreateProject({ onProjectCreated }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [projectLeadId, setProjectLeadId] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadUsers() {
        try {
            const response = await fetch("http://localhost:9000/api/users");

            if (!response.ok) {
                throw new Error("Could not load users.");
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError("Could not load users.");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        description,
                        status,
                        project_lead_id: projectLeadId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message ||
                    "Could not create project.");
            }

            setMessage("Project created successfully!");
            setName("");
            setDescription("");
            setStatus("Planning");
            setProjectLeadId("");

            if (onProjectCreated && data.projectId) {
                onProjectCreated(data.projectId);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <section className="create-project-section">
            <h2>Create Project</h2>

            {message && <p>{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
                <label>
                    Project Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Description:
                    <textarea
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        required
                    />
                </label>

                <label>
                    Status:
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                    </select>
                </label>

                <label>
                    Project Lead:
                    <select
                        value={projectLeadId}
                        onChange={(event) =>
                            setProjectLeadId(event.target.value)
                        }
                        onFocus={() => {
                            if (users.length === 0) loadUsers();
                        }}
                        required
                    >
                        <option value="">Select a project lead</option>
                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.f_name} {user.l_name} ({user.username})
                            </option>
                        ))}
                    </select>
                </label>

                <button type="submit">Create Project</button>
            </form>
        </section>
    );
}

export default CreateProject;
