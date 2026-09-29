import { useState } from "react";
import { registerUser } from "../services/authService";

export default function Register({
  onLogin,
  goToLogin
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const user = await registerUser(
        name,
        email,
        password
      );

      onLogin(user);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  }

  return (
    <div className="auth-container">
      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >
        <h1>Create Account</h1>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />

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
          minLength={6}
          required
        />

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button type="submit">
          Register
        </button>

        <button
          type="button"
          className="secondary"
          onClick={goToLogin}
        >
          Already have an account?
        </button>
      </form>
    </div>
  );
}