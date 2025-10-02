"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
// Assuming this import defines the structure of your user profile
import { UserProfile } from "../dashboard/dashboard";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data as UserProfile); // Cast data to UserProfile type
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 1. Unified function for getting the avatar initial
  const getAvatarInitial = () => {
    return (
      profile?.display_name?.charAt(0).toUpperCase() ||
      user?.email?.charAt(0).toUpperCase() ||
      "U"
    );
  };

  const NavLinks = (
    <>
      <Link
        href="/"
        className="text-white hover:text-yellow-400 transition-colors"
      >
        Home
      </Link>
      <Link
        href="/privacy"
        className="text-white hover:text-yellow-400 transition-colors"
      >
        Privacy Policy
      </Link>
      <Link
        href="/contact"
        className="text-white hover:text-yellow-400 transition-colors"
      >
        Contact
      </Link>
      <Link
        href="/feedback"
        className="text-white hover:text-yellow-400 transition-colors"
      >
        Feedback
      </Link>
    </>
  );

  // 2. Corrected AuthButton for Desktop (small avatar, name)
  const AuthButton = user ? (
    <Link
      href="/login"
      onClick={() => setIsMenuOpen(false)}
      // Removed w-16 h-16 classes which are too big for a navbar
      className="flex items-center space-x-2 p-1 rounded-full hover:bg-[#303030] transition-colors"
    >
      {/* Small Avatar for Navigation Bar */}
      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-[#121212] text-sm font-bold shadow-sm">
        {getAvatarInitial()}
      </div>

      {/* Display Name - Visible on Desktop/Larger Screens */}
      <span className="hidden lg:inline text-white font-semibold">
        {profile?.display_name || user?.email?.split("@")[0] || "Dashboard"}
      </span>
    </Link>
  ) : (
    // If logged out, show "Start Learning Now" button linked to Login
    <Link
      href="/login"
      className="text-white hover:text-yellow-400 transition-colors font-semibold"
      onClick={() => setIsMenuOpen(false)}
    >
      Start Learning Now
    </Link>
  );

  return (
    <nav className="bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/60 sticky top-0 z-50 w-full border-b border-[#303030]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-[#fff]" />
            <span className="text-xl font-bold text-white">LinguaAi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {NavLinks}
            {AuthButton}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1c1c1c] rounded-lg mt-2">
              {NavLinks}
              {/* Mobile Auth/Profile Link */}
              <div className="px-3 py-2">
                {user ? (
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 text-white hover:text-yellow-400 transition-colors font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {/* 3. Corrected Mobile Avatar */}
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-[#121212] text-sm font-bold">
                      {getAvatarInitial()}
                    </div>
                    <span>
                      {/* Display name or default to email name part */}
                      {profile?.display_name ||
                        user?.email?.split("@")[0] ||
                        "Go to Dashboard"}
                    </span>
                  </Link>
                ) : (
                  // Fallback to Start Learning Now link on mobile too
                  <Link
                    href="/login"
                    className="block text-white hover:text-yellow-400 transition-colors font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start Learning Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
