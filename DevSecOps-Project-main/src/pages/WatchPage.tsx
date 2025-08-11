import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Player from "video.js/dist/types/player";
import { Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import SettingsIcon from "@mui/icons-material/Settings";
import BrandingWatermarkOutlinedIcon from "@mui/icons-material/BrandingWatermarkOutlined";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

import useWindowSize from "src/hooks/useWindowSize";
import { formatTime } from "src/utils/common";

import MaxLineTypography from "src/components/MaxLineTypography";
import VolumeControllers from "src/components/watch/VolumeControllers";
import VideoJSPlayer from "src/components/watch/VideoJSPlayer";
import PlayerSeekbar from "src/components/watch/PlayerSeekbar";
import PlayerControlButton from "src/components/watch/PlayerControlButton";
import MainLoadingScreen from "src/components/MainLoadingScreen";

import React from "react";

// Explicitly type the player state interface
interface PlayerState {
  paused: boolean;
  muted: boolean;
  playedSeconds: number;
  duration: number; // always number, no undefined
  volume: number;
  loaded: number;
}

export function Component() {
  const playerRef = useRef<Player | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    paused: false,
    muted: false,
    playedSeconds: 0,
    duration: 0,
    volume: 0.8,
    loaded: 0,
  });

  const navigate = useNavigate();
  const [playerInitialized, setPlayerInitialized] = useState(false);

  const windowSize = useWindowSize();
  const videoJsOptions = useMemo(() => {
    return {
      preload: "metadata",
      autoplay: true,
      controls: false,
      width: windowSize.width,
      height: windowSize.height,
      sources: [
        {
          src: "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
          type: "application/x-mpegurl",
        },
      ],
    };
  }, [windowSize]);

  const handlePlayerReady = function (player: Player): void {
    player.on("pause", () => {
      setPlayerState((draft) => {
        return { ...draft, paused: true };
      });
    });

    player.on("play", () => {
      setPlayerState((draft) => {
        return { ...draft, paused: false };
      });
    });

    player.on("timeupdate", () => {
      setPlayerState((draft) => {
        // Fix: Ensure playedSeconds is always a number
        const currentTime = player.currentTime();
        return { 
          ...draft, 
          playedSeconds: typeof currentTime === "number" ? currentTime : 0 
        };
      });
    });

    player.one("durationchange", () => {
      setPlayerInitialized(true);

      // Fix: Properly handle the duration to ensure it's always a number
      const duration = player.duration();
      setPlayerState((draft) => ({
        ...draft,
        duration: typeof duration === "number" && !isNaN(duration) ? duration : 0,
      }));
    });

    playerRef.current = player;

    // Fix: Ensure paused is always a boolean
    const isPaused = player.paused();
    setPlayerState((draft) => {
      return { ...draft, paused: typeof isPaused === "boolean" ? isPaused : false };
    });
  };

  // Explicit types on parameters to avoid implicit any errors
  const handleVolumeChange = (
    _event: React.SyntheticEvent<Element, Event>,
    value: number | number[]
  ) => {
    const volumeValue = Array.isArray(value) ? value[0] : value;

    playerRef.current?.volume(volumeValue / 100);
    setPlayerState((draft) => {
      return { ...draft, volume: volumeValue / 100 };
    });
  };

  const handleSeekTo = (v: number) => {
    playerRef.current?.currentTime(v);
  };

  const handleGoBack = () => {
    navigate("/browse");
  };

  if (!!videoJsOptions.width) {
    return (
      <Box sx={{ position: "relative" }}>
        <VideoJSPlayer options={videoJsOptions} onReady={handlePlayerReady} />
        {playerRef.current && playerInitialized && (
          <Box sx={{ top: 0, left: 0, right: 0, bottom: 0, position: "absolute" }}>
            <Box px={2} sx={{ position: "absolute", top: 75 }}>
              <PlayerControlButton onClick={handleGoBack}>
                <KeyboardBackspaceIcon />
              </PlayerControlButton>
            </Box>
            {/* Add the rest of your UI components here */}
          </Box>
        )}
      </Box>
    );
  }
  return null;
}

Component.displayName = "WatchPage";