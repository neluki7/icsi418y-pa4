require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const client = new MongoClient(process.env.MONGO_URI);

const db = client.db("pa2");
const users = db.collection("users");
const projects = db.collection("projects");
const projectMemberships = db.collection("project_memberships");
const userStories = db.collection("user_stories");

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

connectDatabase();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.get("/api/users", async (req, res) => {
    try {
        const allUsers = await users
            .find(
                {},
                {
                    projection: {
                        f_name: 1,
                        l_name: 1,
                        username: 1
                    }
                }
            )
            .toArray();
        res.status(200).json(allUsers);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            message: "Could not retrieve users. Please try again."
        });
    }
});

app.post("/api/projects", async (req, res) => {
    try {
        const { name, description, status, project_lead_id } = req.body;

        //Checks that all fields are provided
        if (!name?.trim() || !description?.trim() || !status|| !project_lead_id) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        //Checks that the status is valid
        const validStatuses = ["Planning", "Active", "Completed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Please choose Planning, Active, or Completed."
            });
        }

        //Checks that the project lead id is a valid ObjectId
        if (!ObjectId.isValid(project_lead_id)) {
            return res.status(400).json({
                message: "Invalid project lead ID."
            });
        }

        //Checks that the selected project lead exists
        const projectLead = await users.findOne({
            _id: new ObjectId(project_lead_id)
        });

        if (!projectLead) {
            return res.status(404).json({
                message: "Selected Project Lead not found."
            });
        }

        //Creates the new project
        const projectResult = await projects.insertOne({
            name: name.trim(),
            description: description.trim(),
            status: status,
            project_lead_id: projectLead._id
        });
        
        //Automatically adds the project lead as a member of the project
        await projectMemberships.insertOne({
            project_id: projectResult.insertedId,
            user_id: projectLead._id
        });

        res.status(201).json({
            message: "Project created successfully!",
            projectId: projectResult.insertedId
        });

    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({
            message: "Could not create project. Please try again."
        });
    }
});

app.get("/api/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).toArray();

        res.status(200).json(allProjects);
    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({ 
            message: "Could not retrieve projects. Please try again."
        });
    }
});

app.get("/api/projects/:projectId/memberships", async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID."
            });
        }

        const project = await projects.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        const memberships = await projectMemberships.find({
            project_id: project._id
        }).toArray();

        const memberIds = memberships.map(
            (membership) => membership.user_id
        );

        const members = await users.find({
            _id: { $in: memberIds }
        },{
            projection: {
                f_name: 1,
                l_name: 1,
                username: 1
            }
        }).toArray();

        res.status(200).json(members);
    } catch (error) {
        console.error("Get project memberships error:", error);

        res.status(500).json({
            message: "Could not retrieve project memberships. Please try again."
        });
    }
});

// Adds a user to a project
app.post("/api/projects/:projectId/memberships", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid project ID or user ID."
            });
        }

        const project = await projects.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        const user = await users.findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const existingMembership = await projectMemberships.findOne({
            project_id: project._id,
            user_id: user._id
        });

        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this project."
            });
        }

        await projectMemberships.insertOne({
            project_id: project._id,
            user_id: user._id
        });

        res.status(201).json({
            message: "User added to project successfully!"
        });

    } catch (error) {
        console.error("Add user to project error:", error);

        res.status(500).json({
            message: "Could not add user to project. Please try again."
        });
    }
});

// Removes a user from a project
app.delete("/api/projects/:projectId/memberships/:userId", async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid project ID or user ID."
            });
        }

        const project = await projects.findOne({
            _id: new ObjectId(projectId)
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        //The project lead must remain a member of the project
        if (project.project_lead_id.toString() === userId) {
            return res.status(403).json({
                message: "The project lead cannot be removed from the project."
            });
        }

        const membership = await projectMemberships.findOne({
            project_id: project._id,
            user_id: new ObjectId(userId)
        });

        if (!membership) {
            return res.status(404).json({
                message: "Membership not found."
            });
        }
        
        // Check whether this member has assigned user stories
        const assignedStory = await userStories.findOne({
            project_id: project._id,
            assigned_user_id: new ObjectId(userId)
        });

        if (assignedStory) {
            return res.status(409).json({
                message: "Cannot remove this member because they have assigned user stories in this project."
            });
        }

        await projectMemberships.deleteOne({
            _id: membership._id
        });

        res.status(200).json({
            message: "User removed from project successfully!"
        });
    } catch (error) {
        console.error("Remove user from project error:", error);

        res.status(500).json({
            message: "Could not remove user from project. Please try again."
        });
        }
    }
);

app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, username, password } = req.body;

        // Checks that all fields are provided
        if (!firstName || !lastName || !username || !password) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        // Checks whether the username already exists
        const existingUser = await users.findOne({
            username: username
        });

        if (existingUser) {
            return res.status(409).json({
                message: "That username is already taken."
            });
        }

        // Creates the new user
        await users.insertOne({
            f_name: firstName,
            l_name: lastName,
            username: username,
            password: password
        });

        res.status(201).json({
            message: "Signup successful!"
        });

    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        const user = await users.findOne({
            username: username,
            password: password
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        res.status(200).json({
            message: "Login successful!"
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            message: "Something went wrong. Please try again."
        });
    }
});

app.post("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, priority, assigned_user_id } = req.body;

        // Check the project ID
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID."
            });
        }

        const projectObjectId = new ObjectId(projectId);

        // Check that the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        // Validate required fields
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Title and description are required."
            });
        }

        // Validate user story description format
        const storyFormat =
            /^As a[n]? .+?, I want .+?, so that .+\.?$/i;

        if (!storyFormat.test(description.trim())) {
            return res.status(400).json({
                message: "Description must follow: As a [user], I want [goal], so that [benefit]."
            });
        }

        // Validate priority
        const validPriorities = ["High", "Medium", "Low"];

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority."
            });
        }

        // Validate assigned member
        let assignedUserId = null;

        if (assigned_user_id !== null &&
            assigned_user_id !== undefined) {

            if (
                typeof assigned_user_id !== "string" ||
                !ObjectId.isValid(assigned_user_id)
            ) {
                return res.status(400).json({
                    message: "Invalid assigned user ID."
                });
            }

            assignedUserId = new ObjectId(assigned_user_id);

            const user = await users.findOne({
                _id: assignedUserId
            });

            if (!user) {
                return res.status(404).json({
                    message: "Assigned user not found."
                });
            }

            const membership = await projectMemberships.findOne({
                project_id: projectObjectId,
                user_id: assignedUserId
            });

            if (!membership) {
                return res.status(400).json({
                    message: "Assigned user must be a member of this project."
                });
            }
        }

        // Create the story document
        const newStory = {
            project_id: projectObjectId,
            title: title.trim(),
            description: description.trim(),
            priority,
            status: "To Do",
            assigned_user_id: assignedUserId
        };

        // Save the story in MongoDB
        const result = await userStories.insertOne(newStory);

        res.status(201).json({
            message: "User story created successfully.",
            story: {
                ...newStory,
                _id: result.insertedId
            }
        });

    } catch (error) {
        console.error("Create user story error:", error);

        res.status(500).json({
            message: "Could not create user story."
        });
    }
});


app.get("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate the project ID
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID."
            });
        }

        const projectObjectId = new ObjectId(projectId);

        // Check that the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        // Retrieve stories belonging to this project
        const stories = await userStories.find({
            project_id: projectObjectId
        }).toArray();

        res.status(200).json(stories);

    } catch (error) {
        console.error("Get user stories error:", error);

        res.status(500).json({
            message: "Could not retrieve user stories."
        });
    }
});



app.put("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;
        const { title, description, priority, status, assigned_user_id } = req.body;

        // Validate project and story IDs
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({
                message: "Invalid project ID or story ID."
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const storyObjectId = new ObjectId(storyId);

        // Check that the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        // Check that the story belongs to this project
        const story = await userStories.findOne({
            _id: storyObjectId,
            project_id: projectObjectId
        });

        if (!story) {
            return res.status(404).json({
                message: "User story not found in this project."
            });
        }

        // Validate title and description
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Title and description are required."
            });
        }

        // Validate user story description format
        const storyFormat =
            /^As a[n]? .+?, I want .+?, so that .+\.?$/i;

        if (!storyFormat.test(description.trim())) {
            return res.status(400).json({
                message: "Description must follow: As a [user], I want [goal], so that [benefit]."
            });
        }
        
        // Validate priority
        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority."
            });
        }

        // Validate status
        if (!["To Do", "In Progress", "Done"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status."
            });
        }

        // Validate assigned member
        let assignedUserId = null;

        if (assigned_user_id !== null && assigned_user_id !== undefined) {
            if (
                typeof assigned_user_id !== "string" ||
                !ObjectId.isValid(assigned_user_id)
            ) {
                return res.status(400).json({
                    message: "Invalid assigned user ID."
                });
            }

            assignedUserId = new ObjectId(assigned_user_id);

            const user = await users.findOne({
                _id: assignedUserId
            });

            if (!user) {
                return res.status(404).json({
                    message: "Assigned user not found."
                });
            }

            const membership = await projectMemberships.findOne({
                project_id: projectObjectId,
                user_id: assignedUserId
            });

            if (!membership) {
                return res.status(400).json({
                    message: "Assigned user must be a member of this project."
                });
            }
        }

        // Update only editable fields
        const updatedFields = {
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            assigned_user_id: assignedUserId
        };

        const result = await userStories.updateOne(
            {
                _id: storyObjectId,
                project_id: projectObjectId
            },
            {
                $set: updatedFields
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "User story not found."
            });
        }

        res.status(200).json({
            message: "User story updated successfully.",
            story: {
                ...story,
                ...updatedFields
            }
        });

    } catch (error) {
        console.error("Update user story error:", error);

        res.status(500).json({
            message: "Could not update user story."
        });
    }
});



app.delete("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({
                message: "Invalid project ID or story ID."
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const storyObjectId = new ObjectId(storyId);

        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found."
            });
        }

        const result = await userStories.deleteOne({
            _id: storyObjectId,
            project_id: projectObjectId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "User story not found in this project."
            });
        }

        res.status(200).json({
            message: "User story deleted successfully."
        });

    } catch (error) {
        console.error("Delete user story error:", error);

        res.status(500).json({
            message: "Could not delete user story."
        });
    }
});



app.listen(9000, () => {
    console.log("Server running on port 9000");
});