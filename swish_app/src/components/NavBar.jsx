// src/components/NavBar.jsx
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "/swish_logo.png";
import "../css/NavBar.css";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Favorites", href: "/favorites" },
  { label: "Teams", href: "/teams" },
  { label: "Tankathon", href: "/tankathon" },
];

function NavBar() {
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { user, login, logout } = useAuth();

  const toggleNavbar = () => setMobileDrawerOpen(!mobileDrawerOpen);

  const isActive = (path) => {
    if (path === "/teams") {
      return (
        location.pathname === "/teams" ||
        location.pathname.startsWith("/teams/")
      );
    }
    return location.pathname === path;
  };

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    login({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    });
    setMobileDrawerOpen(false);
    navigate("/welcome");
  };

  const handleLogout = () => {
    googleLogout();
    logout();
    setShowDropdown(false);
  };

  return (
    <nav className="navbar-enhanced">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={user ? "/welcome" : "/"} className="navbar-logo-enhanced">
          <img src={logo} alt="SWISH logo" className="logo-img" />
          <span className="logo-text-enhanced">SWISH</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="navbar-links-desktop">
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.href}
                className={`nav-link-enhanced ${isActive(item.href) ? "active" : ""}`}
              >
                {item.label}
                {isActive(item.href) && <span className="active-indicator" />}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Section */}
        <div className="navbar-auth-enhanced">
          {user ? (
            <div className="user-menu">
              {/* Avatar Button */}
              <button
                className="user-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
                <span className="user-name">{user.name.split(" ")[0]}</span>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  {/* Backdrop - clicking anywhere closes dropdown */}
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 98,
                      cursor: "default",
                    }}
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="dropdown-avatar"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="dropdown-name">{user.name}</p>
                        <p className="dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-logout" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log("Login Failed")}
              shape="pill"
              theme="filled_black"
              size="medium"
            />
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-toggle" onClick={toggleNavbar}>
          {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileDrawerOpen && (
        <div className="mobile-menu-enhanced">
          <ul className="mobile-nav-list">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`mobile-nav-link ${isActive(item.href) ? "active" : ""}`}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-auth-buttons">
            {user ? (
              <button className="btn-signin-enhanced" onClick={handleLogout}>
                Sign Out
              </button>
            ) : (
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.log("Login Failed")}
                shape="pill"
                theme="filled_black"
                size="medium"
              />
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
