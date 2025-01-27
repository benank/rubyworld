import { musicVolume } from "@/state";
import { useAtom } from "jotai";
import React, { useState, useRef, useEffect } from "react";

const MusicPlayer: React.FC = () => {
  const [canPlay, setCanPlay] = useState(false);

  // Music by Lud and Schlatts Musical Emporium
  const songs = [
    "/assets/music/2PM-PM-Music.mp3",
    "/assets/music/Dentists-Office-PM-Music.mp3",
    "/assets/music/Financial-Obligations-PM-Music.mp3",
    "/assets/music/Sunset-Pier-PM-Music.mp3",
  ];

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume] = useAtom(musicVolume);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const onClick = () => {
      setCanPlay(true);
      document.removeEventListener("click", onClick);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.5;
  }, [audioRef.current]);

  useEffect(() => {
    if (audioRef.current && canPlay) {
      audioRef.current.play();
    }
  }, [currentSongIndex, canPlay]);

  // Automatically play the next song when the current song ends
  const handleSongEnd = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
  };

  return (
    <audio
      ref={audioRef}
      src={songs[currentSongIndex]}
      onEnded={handleSongEnd}
      autoPlay
    />
  );
};

export default MusicPlayer;
