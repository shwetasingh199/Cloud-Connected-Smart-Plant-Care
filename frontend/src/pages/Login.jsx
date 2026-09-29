import { useState } from "react";
import { loginUser } from "../services/authService";

export default function Login({ onLogin, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const user = await loginUser(
        email,
        password
      );

      onLogin(user);
    } catch (error) {
      console.error(error);
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="auth-container">
      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >
        <h1>🌱 Smart Plant Care</h1>

        <p>Cloud IoT Monitoring Platform</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button type="submit">
          Login
        </button>

        <button
          type="button"
          className="secondary"
          onClick={goToRegister}
        >
          Create Account
        </button>
      </form>
    </div>
  );
}