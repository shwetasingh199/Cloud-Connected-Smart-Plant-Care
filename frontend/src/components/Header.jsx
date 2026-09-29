import { logoutUser } from "../services/authService";

export default function Header({
  user
}) {
  return (
    <header className="header">
      <div>
        <h1>
          🌱 Smart Plant Care
        </h1>

        <span>
          Cloud IoT Monitoring
        </span>
      </div>

      <div className="user-area">
        <span>{user?.email}</span>

        <button
          onClick={logoutUser}
        >
          Logout
        </button>
      </div>
    </header>
  );
}