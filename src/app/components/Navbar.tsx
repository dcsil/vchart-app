"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { log } from "@/app/utils/log";

interface Session {
  username: string;
  role: string;
}

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  console.log("Navbar component rendered");

  useEffect(() => {
    // Check if user is logged in by looking for the cookie
    const cookies = document.cookie.split("; ");
    const authCookie = cookies.find((cookie) =>
      cookie.startsWith("auth-session=")
    );

    if (authCookie) {
      // Extract the cookie value and decode it (if URL encoded)
      const cookieValue = authCookie.split("=")[1];
      try {
        const sessionData: Session = JSON.parse(
          decodeURIComponent(cookieValue)
        );
        setSession(sessionData);
        console.log("Session data set:", sessionData);
      } catch (error) {
        log("Failed to parse auth-session cookie: " + error, "error");
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to login page after logging out
      router.push("/login");
      router.refresh();
    } catch (error) {
      log("Logout error: " + error, "error");
    }
  };

  return (
    <nav className="flex justify-between items-center py-3 px-4 sm:px-6 md:px-8 bg-gray-50 border-b border-gray-200">
      <div className="text-xl sm:text-2xl font-bold text-gray-800">
        VChart App
      </div>

      {session && (
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <span className="hidden sm:block text-sm md:text-base text-gray-600">
            Welcome, {session.username} ({session.role})
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
