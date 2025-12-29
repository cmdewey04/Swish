import React from "react";
import flagg from "../assets/flagg.mp4";
import luka from "../assets/luka.mp4";

export const HeroSection = () => {
  return (
    <div className="flex flex-col items-center mt-6 lg:mt-20">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="mx-auto aspect-1155/678 w-288.75 bg-gradient-to-tr from-[#cc5496] to-[#9089fc] opacity-20"
        />
      </div>
      <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide">
        NBA Analytics for{" "}
        <span className="bg-gradient-to-r from-purple-800 to-purple-500 text-transparent bg-clip-text">
          Everyone
        </span>
      </h1>
      <p className="mt-10 text-lg text-center dark:text-violet-300/90 max-w-4xl">
        Real-time, AI-powered NBA analytics—crystal-clear stats, bold
        predictions, undeniable edge.
      </p>
      <div className="flex justify-center my-10">
        <a
          href="#"
          className="bg-gradient-to-r from-purple-500 to-purple-800 py-3 px-4 mx-3 rounded-md"
        >
          Join the Movement
        </a>
        <a href="#" className="py-3 px-4 mx-3 rounded-md border">
          Partners
        </a>
      </div>
      <div className="flex mt-10 justify-center">
        <video
          autoPlay
          loop
          muted
          className="rounded-lg w-1/2 border border-purple-700 shadow-purple-400 mx-2 my-4"
        >
          <source src={luka} type="video/mp4" />
          Your browser does not support the video 😭
        </video>
        <video
          autoPlay
          loop
          muted
          className="rounded-lg w-1/2 border border-purple-700 shadow-purple-400 mx-2 my-4"
        >
          <source src={flagg} type="video/mp4" />
          Your browser does not support the video 😭
        </video>
      </div>
    </div>
  );
};
export default HeroSection;
