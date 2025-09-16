"use client"

import { Logo } from "./logo"
import Link from "next/link"

export default function NetflixStyleNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm text-white px-6 py-4 border-b border-gray-800/50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo */}
        <Logo size="md" variant="light" />

        {/* Center: Navigation Links */}
        <div className="hidden md:flex gap-8 text-white font-medium">
          <a href="#ctv" className="hover:text-red-500 transition-colors duration-300 cursor-pointer relative group">
            CTV
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#dooh" className="hover:text-red-500 transition-colors duration-300 cursor-pointer relative group">
            DOOH
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#digital"
            className="hover:text-red-500 transition-colors duration-300 cursor-pointer relative group"
          >
            Digital
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#apps" className="hover:text-red-500 transition-colors duration-300 cursor-pointer relative group">
            Apps
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#smart-devices"
            className="hover:text-red-500 transition-colors duration-300 cursor-pointer relative group"
          >
            Smart Devices
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-lg hover:shadow-red-600/25 transform hover:scale-105"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 border border-white/30 text-white rounded-lg hover:bg-white hover:text-black transition-all duration-300 font-medium backdrop-blur-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}
