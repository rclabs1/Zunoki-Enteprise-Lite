"use client"

import { useState, useEffect, useRef } from "react"

interface AudioPlayerOptions {
  autoPlay?: boolean
  onEnded?: () => void
  volume?: number
}

export function useAudioPlayer(options: AudioPlayerOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "auto"
    audio.volume = options.volume ?? 1.0

    audio.addEventListener("play", () => setIsPlaying(true))
    audio.addEventListener("pause", () => setIsPlaying(false))
    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      options.onEnded?.()
    })
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime))
    audio.addEventListener("durationchange", () => setDuration(audio.duration))
    audio.addEventListener("loadstart", () => setIsLoading(true))
    audio.addEventListener("canplaythrough", () => setIsLoading(false))
    audio.addEventListener("error", () => {
      setError("Error loading audio")
      setIsLoading(false)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ""

      audio.removeEventListener("play", () => setIsPlaying(true))
      audio.removeEventListener("pause", () => setIsPlaying(false))
      audio.removeEventListener("ended", () => {
        setIsPlaying(false)
        options.onEnded?.()
      })
      audio.removeEventListener("timeupdate", () => setCurrentTime(audio.currentTime))
      audio.removeEventListener("durationchange", () => setDuration(audio.duration))
      audio.removeEventListener("loadstart", () => setIsLoading(true))
      audio.removeEventListener("canplaythrough", () => setIsLoading(false))
      audio.removeEventListener("error", () => {
        setError("Error loading audio")
        setIsLoading(false)
      })
    }
  }, [options.onEnded, options.volume])

  // Load and play audio
  const load = async (url: string, autoPlay = options.autoPlay) => {
    if (!audioRef.current) return

    try {
      setError(null)
      setIsLoading(true)

      audioRef.current.src = url
      await audioRef.current.load()

      if (autoPlay) {
        await play()
      }

      setIsLoading(false)
    } catch (err) {
      setError("Failed to load audio")
      setIsLoading(false)
      console.error("Error loading audio:", err)
    }
  }

  // Play audio
  const play = async () => {
    if (!audioRef.current) return

    try {
      setError(null)
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      setError("Failed to play audio")
      console.error("Error playing audio:", err)
    }
  }

  // Pause audio
  const pause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }

  // Stop audio (pause and reset position)
  const stop = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
  }

  // Seek to position
  const seek = (time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  // Set volume
  const setVolume = (volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.max(0, Math.min(1, volume))
  }

  return {
    isPlaying,
    duration,
    currentTime,
    isLoading,
    error,
    load,
    play,
    pause,
    stop,
    seek,
    setVolume,
  }
}
