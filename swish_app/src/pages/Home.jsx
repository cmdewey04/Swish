// src/pages/Home.jsx
import HeroSection from "../components/HeroSection";
import LiveScores from "../components/LiveScores";
import PlayerList from "../components/PlayerList";
("../");

function Home() {
  return (
    <>
      <HeroSection />
      <LiveScores />
      {/* <PlayerList /> */}
    </>
  );
}

export default Home;
