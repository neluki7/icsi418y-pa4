
import { useEffect, useState } from "react";

function ProjectMemberships({selectedProjectId}) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [members, setMembers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // Load projects and users when the component opens.
    useEffect(() => {
        async function loadData() {
            try {
                const projectResponse = await fetch(
                    "http://localhost:9000/api/projects"
                );
                const userResponse = await fetch(
                    "http://localhost:9000/api/users"
                );

                if (!projectResponse.ok || !userResponse.ok) {
                    throw new Error("Could not load projects or users.");
                }

                const projectData = await projectResponse.json();
                const userData = await userResponse.json();

                setProjects(projectData);
                setUsers(userData);

                setSelectedProject("");

            } catch (error) {
                setMessage(error.message);
                setMessageType("error");
            }
        }

        loadData();
    }, [selectedProjectId]);

    // Load members whenever the selected project changes.
    useEffect(() => {
        if (!selectedProject) {
            setMembers([]);
            return;
        }

        async function loadMembers() {
            try {
                const response = await fetch(
                    `http://localhost:9000/api/projects/${selectedProject}/memberships`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load project members."
                    );
                }

                setMembers(data);
            } catch (error) {
                setMessage(error.message);
                setMessageType("error");
            }
        }

        loadMembers();
    }, [selectedProject]);

    // Add a user to the selected project.
    async function addMember() {
        if (!selectedProject || !selectedUser) {
            setMessage("Please select a project and a user.");
            setMessageType("error");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${selectedProject}/memberships`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId: selectedUser }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not add the member."
                );
            }

            setMessage(data.message);
            setMessageType("success");
            setSelectedUser("");

            // Refresh the member list after a successful addition.
            const membersResponse = await fetch(
                `http://localhost:9000/api/projects/${selectedProject}/memberships`
            );
            const membersData = await membersResponse.json();

            if (membersResponse.ok) {
                setMembers(membersData);
            }
        } catch (error) {
            setMessage(error.message);
            setMessageType("error");
        }
    }

    // Remove a user from the selected project.
    async function removeMember(userId) {
        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${selectedProject}/memberships/${userId}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not remove the member."
                );
            }

            setMessage(data.message);
            setMessageType("success");

            // Refresh the member list after a successful removal.
            const membersResponse = await fetch(
                `http://localhost:9000/api/projects/${selectedProject}/memberships`
            );
            const membersData = await membersResponse.json();

            if (membersResponse.ok) {
                setMembers(membersData);
            }
        } catch (error) {
            setMessage(error.message);
            setMessageType("error");
        }
    }

    // Find the project's lead so we can label them in the member list.
    const currentProject = projects.find(
        (project) => project._id === selectedProject
    );

    return (
        <section className="membership-section">
            {message && (
            <p 
                className={
                    messageType === "success"
                        ? "membership-success"
                        : "error-message"
                }
                role="status"
            >
                    {message}
            </p>
        )}

            <label htmlFor="membership-project">Select Project:</label>
            <select
                id="membership-project"
                value={selectedProject}
                onChange={(event) => {
                    setSelectedProject(event.target.value);
                    setMessage("");
                }}
            >
                <option value="">Choose a project</option>
                {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                        {project.name}
                    </option>
                ))}
            </select>

            {selectedProject && (
                <>
                    <h3>Current Members</h3>
                    {members.length === 0 ? (
                        <p className="empty-members">
                            No members found for this project.
                        </p>
                    ) : (
                        <div className="member-list">
                            {[...members]
                            .sort((a, b) => {
                                const aIsLead =
                                    a._id?.toString() ===
                                    currentProject?.project_lead_id?.toString();

                                const bIsLead =
                                    b._id?.toString() ===
                                    currentProject?.project_lead_id?.toString();

                                if (aIsLead) return -1;
                                if (bIsLead) return 1;
                                return 0;
                            })
                            .map((member) => {
                                const isLead =
                                    currentProject?.project_lead_id?.toString() ===
                                    member._id?.toString();

                                return (
                                    <div className="member-row" key={member._id}>
                                        <div className="member-info">
                                            <div className="member-avatar">
                                                {member.f_name?.charAt(0)}
                                                {member.l_name?.charAt(0)}
                                            </div>

                                            <div className="member-details">
                                                <span className="member-name">
                                                    {member.f_name} {member.l_name}
                                                </span>

                                                <span className="member-username">
                                                    @{member.username}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="member-actions">
                                            {isLead ? (
                                                <span className="lead-badge">
                                                    Project Lead
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="remove-member-button"
                                                    onClick={() =>
                                                        removeMember(member._id)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <h3>Add a Member</h3>

                    <label htmlFor="membership-user">Select User:</label>
                    <select
                        id="membership-user"
                        value={selectedUser}
                        onChange={(event) =>
                            setSelectedUser(event.target.value)
                        }
                    >
                        <option value="">Choose a user</option>
                        {users
                            .filter(
                                (user) =>
                                    !members.some(
                                        (member) => member._id === user._id
                                    )
                            )
                            .map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.f_name} {user.l_name} (@{user.username})
                                </option>
                            ))}
                    </select>

                    <button
                        type="button"
                        onClick={addMember}
                        disabled={!selectedProject || !selectedUser}
                    >
                        Add Member
                    </button>
                </>
            )}
        </section>
    );
}

export default ProjectMemberships;
