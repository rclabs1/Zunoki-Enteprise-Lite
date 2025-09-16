"use client"

import { Camera } from "lucide-react"
import Link from "next/link"

export default function LandingNavbar() {
  return (
    <nav className="w-full bg-black shadow-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center space-x-2">
        <div className="rounded bg-red-600 p-1">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">Zunoki.</span>
      </div>

      {/* Center: Navigation Links */}
      <div className="hidden md:flex gap-6 text-gray-300 font-medium">
        <a href="#ctv" className="hover:text-white transition-colors">
          CTV
        </a>
        <a href="#dooh" className="hover:text-white transition-colors">
          DOOH
        </a>
        <a href="#digital" className="hover:text-white transition-colors">
          Digital
        </a>
        <a href="#apps" className="hover:text-white transition-colors">
          Apps
        </a>
        <a href="#smart-devices" className="hover:text-white transition-colors">
          Smart Devices
        </a>
      </div>

      {/* Right: Buttons */}
      <div className="flex space-x-4">
        <Link href="/signup" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">
          Create Account
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border border-gray-700 text-white rounded-md hover:bg-gray-800 transition"
        >
          Sign In
        </Link>
      </div>
    </nav>
  )
}
