import Player from "./Player";

function PlayerList() {
  const players = [
    { id: 1, name: "Lebron James", img: "/lebron.avif" },
    { id: 2, name: "Luka Doncic", img: "/luka.avif" },
    { id: 3, name: "Cooper Flagg", img: "/flagg.avif" },
  ];
  return (
    <section className="mt-10 py-12 border border-violet-500 rounded-3xl">
      <h2 className="mt-16 text-center tracking-wide text-3xl sm:text-6xl lg:text-7xl">
        Top Performers
      </h2>

      <ul
        role="list"
        className="
          mx-auto mt-12 max-w-7xl px-4
          grid gap-8 justify-center justify-items-center
          [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]
        "
      >
        {players.map((p) => (
          <li key={p.id} className="w-full max-w-sm">
            <div className="rounded-xl bg-white shadow-sm transition-transform duration-200 hover:scale-105 dark:bg-gray-800/50">
              <Player player={p} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PlayerList;
