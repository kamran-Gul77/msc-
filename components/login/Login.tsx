"use client";
import { AuthPage } from "@/components/auth/auth-page";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useAuth } from "@/components/providers";
import React from "react";
import Loading from "../Loading";

const Login = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Login;
