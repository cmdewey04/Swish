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
import GameDetail from "./pages/GameDetail";
import Welcome from "./pages/Welcome";
import Tankathon from "./pages/Tank";

function App() {
  return (
    <div className="main-content">
      <ThemeProvider>
        <ScrollToTop />
        <NavBar />
        <Routes>
          {/* Full-width routes */}
          <Route path="/teams/:abbreviation" element={<TeamDetail />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/game/:gameId" element={<GameDetail />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/tankathon" element={<Tankathon />} />

          {/* Constrained routes */}
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/teams" element={<Teams />} />
        </Routes>
      </ThemeProvider>
    </div>
  );
}

export default App;
