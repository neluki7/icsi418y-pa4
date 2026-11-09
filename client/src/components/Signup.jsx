import { useState } from "react";

function Signup({ onLoginClick, onSignupSuccess }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        // We will send the data to Express here:
        const response = await fetch(
        "http://localhost:9000/signup",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // data to send:
                firstName: firstName,
                lastName: lastName,
                username: username,
                password: password
            })
        }
        );

        const data = await response.json();

        if (response.ok) {
            setSuccess(data.message || "Account created successfully!");

            if (onSignupSuccess) {
                onSignupSuccess();
            }
        } else {
            setError(data.message || "Unable to create your account.");
        }
    }

    return (
        <div className="form-container">
            <h2>Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <label>
                    First Name:
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </label>
                <label>
                    Last Name:
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </label>
                <label>
                    Username:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </label>
                <label>
                    Password:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <button type="submit">Sign Up</button>
            </form>
            <p className="auth-switch">
                Already have an account?{" "}
                <span
                    className="text-button"
                    onClick={onLoginClick}
                >
                    Log in
                </span>
            </p>
        </div>        
    );
}

export default Signup;