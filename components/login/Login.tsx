"use client";
import { AuthPage } from "@/components/auth/auth-page";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useAuth } from "@/components/providers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import React from "react";

const Login = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Login;
