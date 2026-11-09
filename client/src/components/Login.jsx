import { useState } from "react";

function Login({ onSignupClick, onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();

        console.log("Login form submitted");

        setError("");
        setSuccess("");
        
        const response = await fetch(
            "http://localhost:9000/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            setSuccess(data.message || "Login successful!");

            if (onLoginSuccess) {
                onLoginSuccess();
            }
            
        } else {
            setError(data.message || "Invalid username or password.");
        }
    }
    return (
        <div className="form-container">
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                        required
                    />
                </label>

                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button type="submit">Login</button>
            </form>
            <p className="auth-switch">
                Don't have an account?{" "}
                <span
                    className="text-button"
                    onClick={onSignupClick}
                >
                    Sign up
                </span>
            </p>
        </div>
    );
}

export default Login;