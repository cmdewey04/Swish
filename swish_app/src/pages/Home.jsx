import HeroSection from "../components/HeroSection";
import PlayerList from "../components/PlayerList";
import { useState } from "react";

function Home() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    alert(query);
  };

  return (
    <>
      <HeroSection />
      <PlayerList />
    </>
    // <div className="home">
    //   <form onSubmit={handleSearch} className="search-form">
    //     <input
    //       type="text"
    //       placeholder="Search for a player"
    //       className="search-input"
    //       value={query}
    //       onChange={(e) => setQuery(e.target.value)}
    //     />
    //     <button type="submit" className="search-button">
    //       Search
    //     </button>
    //   </form>
    //   <PlayerList search={query} />
    // </div>
  );
}
export default Home;
