// src/components/HeroSection.jsx
import React from "react";
import flagg from "../assets/flagg.mp4";
import luka from "../assets/luka.mp4";
import "../css/HeroSection.css";

const HeroSection = () => {
  return (
    <div className="hero-section">
      {/* Gradient Background Blur */}
      <div className="hero-background-blur">
        <div className="hero-gradient-shape" />
      </div>

      {/* Hero Content */}
      <div className="hero-content">
        <h1 className="hero-title">
          NBA Analytics for{" "}
          <span className="hero-title-gradient">Everyone</span>
        </h1>

        <p className="hero-subtitle">
          Real-time, AI-powered NBA analytics—crystal-clear stats, bold
          predictions, undeniable edge.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta">
          <a href="#" className="cta-primary">
            Join the Movement
          </a>
          <a href="#" className="cta-secondary">
            Partners
          </a>
        </div>

        {/* Video Section */}
        <div className="hero-videos">
          <video autoPlay loop muted playsInline className="hero-video">
            <source src={luka} type="video/mp4" />
            Your browser does not support the video 😭
          </video>
          <video autoPlay loop muted playsInline className="hero-video">
            <source src={flagg} type="video/mp4" />
            Your browser does not support the video 😭
          </video>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
