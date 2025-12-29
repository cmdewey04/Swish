import { useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Explore from "./pages/Explore";
import NavBar from "./components/NavBar";
import { ThemeProvider } from "./contexts/ThemeContext";
import HeroSection from "./components/HeroSection";
import Teams from "./pages/Teams";
import TeamDetail from "./components/TeamDetail";
import ScrollToTop from "./components/ScrollToTop";
import PlayerDetail from "./components/PlayerDetail";

function App() {
  return (
    <div className="main-content">
      <ThemeProvider>
        <ScrollToTop />
        <NavBar />
        <div className="max-w-7xl mx-auto pt-5 px-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:alias" element={<TeamDetail />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
          </Routes>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default App;
