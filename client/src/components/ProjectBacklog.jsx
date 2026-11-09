
import { useEffect, useState } from "react";

function ProjectBacklog({ projectId }) {
    const [stories, setStories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentProjectId, setCurrentProjectId] = useState(projectId || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [members, setMembers] = useState([]);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [editingStory, setEditingStory] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState("Medium");
    const [editStatus, setEditStatus] = useState("To Do");
    const [editAssignedUserId, setEditAssignedUserId] = useState("");
    const [editError, setEditError] = useState("");

    useEffect(() => {
    async function fetchProjects() {
        try {
            const response = await fetch("http://localhost:9000/api/projects");

            if (!response.ok) {
                throw new Error("Could not load projects.");
            }

            const data = await response.json();
            setProjects(data);
        } catch (error) {
            setError(error.message);
        }
    }

    fetchProjects();
    }, []);


    useEffect(() => {
        if (!currentProjectId) {
            setStories([]);
            setError("");
            return;
        }

        let cancelled = false;

        async function fetchStories() {
            setLoading(true);
            setStories([]);
            setError("");

            try {
                const response = await fetch(
                    `http://localhost:9000/api/projects/${currentProjectId}/stories`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load stories."
                    );
                }

                if (!cancelled) {
                    setStories(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchStories();

        return () => {
            cancelled = true;
        };
    }, [currentProjectId]);

    useEffect(() => {
        if (!currentProjectId) {
            setMembers([]);
            setAssignedUserId("");
            return;
        }

        let cancelled = false;

        setMembers([]);
        setAssignedUserId("");
        setFormError("");
        setFormSuccess("");

        async function fetchMembers() {
            try {
                const response = await fetch(
                    `http://localhost:9000/api/projects/${currentProjectId}/memberships`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load project members."
                    );
                }

                if (!cancelled) {
                    setMembers(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setFormError(err.message);
                }
            }
        }

        fetchMembers();

        return () => {
            cancelled = true;
        };
    }, [currentProjectId]);

    // Creates a new user story in MongoDB
    async function handleCreateStory(e) {
        e.preventDefault();

        setFormError("");
        setFormSuccess("");

        if (!title.trim() || !description.trim()) {
            setFormError("Title and description are required.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${currentProjectId}/stories`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        description: description.trim(),
                        priority: priority,
                        assigned_user_id: assignedUserId || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not create user story."
                );
            }

            setStories((previousStories) => [
                ...previousStories,
                data.story
            ]);

            setTitle("");
            setDescription("");
            setPriority("Medium");
            setAssignedUserId("");

            setFormSuccess("User story created successfully!");

        } catch (err) {
            setFormError(err.message);
        }
    }

    function handleEditStory(story) {
        setEditingStory(story._id);
        setEditTitle(story.title);
        setEditDescription(story.description);
        setEditPriority(story.priority);
        setEditStatus(story.status);
        setEditAssignedUserId(story.assigned_user_id || "");
        setEditError("");
    }

    async function handleSaveStory() {
        setEditError("");

        if (!editTitle.trim() || !editDescription.trim()) {
            setEditError("Title and description are required.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${currentProjectId}/stories/${editingStory}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                        priority: editPriority,
                        status: editStatus,
                        assigned_user_id: editAssignedUserId || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update user story.");
            }

            setStories((previousStories) =>
                previousStories.map((story) =>
                    story._id === editingStory ? data.story : story
                )
            );

            setEditingStory(null);

        } catch (err) {
            setEditError(err.message);
        }
    }

    
    async function handleDeleteStory(story) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${story.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${currentProjectId}/stories/${story._id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete user story.");
            }

            setStories((previousStories) =>
                previousStories.filter(
                    (existingStory) => existingStory._id !== story._id
                )
            );

            if (editingStory === story._id) {
                setEditingStory(null);
            }

        } catch (err) {
            setError(err.message);
        }
    }


    return (
        <div className="backlog-section">
            <label htmlFor="backlog-project">Select Project: </label>

            <select
                id="backlog-project"
                value={currentProjectId}
                onChange={(e) => {
                    setEditingStory(null);
                    setEditTitle("");
                    setEditDescription("");
                    setEditPriority("Medium");
                    setEditStatus("To Do");
                    setEditAssignedUserId("");
                    setEditError("");
                    setCurrentProjectId(e.target.value);}
                }
            >
                <option value="">-- Choose a project --</option>

                {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                        {project.name}
                    </option>
                ))}
            </select>

            {!currentProjectId && (
                <p>Select a project to view its backlog.</p>
            )}

            {currentProjectId && (
                <div className="create-story">
                    <h3>Create User Story</h3>

                    <form onSubmit={handleCreateStory}>
                        <div>
                            <label htmlFor="story-title">Title: </label>
                            <input
                                id="story-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter story title"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="story-description">Description: </label>
                            <textarea
                                id="story-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="As a [user], I want [goal], so that [benefit]."
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="story-priority">Priority: </label>
                            <select
                                id="story-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="story-assignee">Assigned Member: </label>
                            <select
                                id="story-assignee"
                                value={assignedUserId}
                                onChange={(e) => setAssignedUserId(e.target.value)}
                            >
                                <option value="">Unassigned</option>

                                {members.map((member) => (
                                    <option key={member._id} value={member._id}>
                                        {member.f_name} {member.l_name} ({member.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formError && (
                            <p style={{ color: "red" }}>{formError}</p>
                        )}

                        {formSuccess && (
                            <p>{formSuccess}</p>
                        )}

                        <button type="submit">
                            Create Story
                        </button>
                    </form>
                </div>
            )}

            {loading && <p>Loading stories...</p>}

            {error && <p style={{ color: "red" }}>{error}</p>}

            {currentProjectId && !loading && !error && stories.length === 0 && (
                <p>No user stories for this project yet.</p>
            )}

            {currentProjectId && !loading && !error && stories.length > 0 && (
                <h2 className="stories-heading">User Stories</h2>
            )}



            {!loading && !error && stories.map((story) => (
                <div key={story._id} className="story-card">
                    <h3>{story.title}</h3>
                    <p>{story.description}</p>
                    <div className="story-details">
                        <div className="story-badges">
                            <span className={`priority-badge priority-${story.priority.toLowerCase()}`}>
                                {story.priority}
                            </span>

                            <span className={`status-badge status-${story.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                {story.status === "To Do" && "○ "}
                                {story.status === "In Progress" && "◷ "}
                                {story.status === "Done" && "✓ "}
                                {story.status}
                            </span>

                            <span className="assignee-badge">
                                👤{" "}
                                {members.find(
                                    (member) => member._id === story.assigned_user_id
                                )?.username || "Unassigned"}
                            </span>
                        </div>

                        <div className="story-actions">
                            <button
                                type="button"
                                onClick={() => handleEditStory(story)}
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDeleteStory(story)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    
                    
                    {editingStory === story._id && (
                        <div className="edit-story">
                            <h4>Edit User Story</h4>

                            <div>
                                <label>Title: </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Description: </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Priority: </label>
                                <select
                                    value={editPriority}
                                    onChange={(e) => setEditPriority(e.target.value)}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div>
                                <label>Status: </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>

                            <div>
                                <label>Assigned Member: </label>
                                <select
                                    value={editAssignedUserId}
                                    onChange={(e) => setEditAssignedUserId(e.target.value)}
                                >
                                    <option value="">Unassigned</option>

                                    {members.map((member) => (
                                        <option key={member._id} value={member._id}>
                                            {member.f_name} {member.l_name} ({member.username})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editError && (
                                <p style={{ color: "red" }}>{editError}</p>
                            )}

                            <button
                                type="button"
                                onClick={handleSaveStory}
                            >
                                Save Changes
                            </button>

                            <button
                                type="button"
                                onClick={() => setEditingStory(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default ProjectBacklog;
