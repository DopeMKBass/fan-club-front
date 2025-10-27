import "./App.css";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Messages from "./Pages/Messages";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Home() {
  return (
    <section className="content">
      <h1>Best wife ever 🥰</h1>
    </section>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-root">
          <aside className="sidebar">
            <div className="logo">Fan Club</div>
            <nav className="nav">
              <NavLink
                to="/"
                end
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <span className="icon">🏠</span>
                <span className="label">Home</span>
              </NavLink>
              <NavLink
                to="/messages"
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <span className="icon">✉️</span>
                <span className="label">Messages</span>
              </NavLink>
            </nav>
          </aside>

          <main className="main">
            <div className="topbar">
              <div className="search-wrap">
                <input className="search" aria-label="Search" />
              </div>
              <div style={{ marginLeft: "auto", paddingRight: 18 }}>
                <AuthActions />
              </div>
            </div>

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AuthActions() {
  const { user, logout } = useAuth();
  if (user) {
    return (
      <div className="auth-actions">
        <span style={{ marginRight: 12 }}>{user.username ?? "You"}</span>
        <button onClick={() => logout()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="auth-actions">
      <NavLink to="/signin" className="auth-link">
        Sign in
      </NavLink>
      <NavLink to="/signup" className="auth-link">
        Sign up
      </NavLink>
    </div>
  );
}

export default App;
