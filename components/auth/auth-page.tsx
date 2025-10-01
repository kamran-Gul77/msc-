"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers";
import { Brain, BookOpen, MessageCircle, Target } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Description } from "@radix-ui/react-toast";

export function AuthPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const { signIn, signUp } = useAuth();
const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signIn(email, password);
  } catch (error) {
    toast({
      title: "Failed to Login",
      description: error instanceof Error ? error.message : String(error),
      variant: "destructive",
    });
    console.error("Sign in error:", error);
  } finally {
    setLoading(false);
  }
};

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signUp(email, password);
    setSignupMessage(
      "We've sent a confirmation email. Please confirm your email before logging in."
    );
    setEmail("");
    setPassword("");
  } catch (error) {
    toast({
      title: "Failed to Sign Up",
      description: error instanceof Error ? error.message : String(error),
      variant: "destructive",
    });
    console.error("Sign up error:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col space-y-8 max-w-lg">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-[#fff]" />
              <span className="text-xl font-bold text-white">LinguaAi</span>
            </Link>

            <h2 className="text-4xl font-bold text-white leading-tight">
              Master English with AI-Powered Learning
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Experience personalized vocabulary, grammar, and conversation
              practice tailored to your learning level with advanced AI
              technology.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Vocabulary Training
                </h3>
                <p className="text-gray-400">
                  Dynamic exercises for synonyms, antonyms, and context usage
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Grammar Practice</h3>
                <p className="text-gray-400">
                  Real-time corrections and rule-based learning
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Conversations</h3>
                <p className="text-gray-400">
                  Interactive dialogues and real-world scenarios
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="w-full max-w-md shadow-xl border border-[#303030] bg-[#212121] text-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <Brain className="h-8 w-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to LinguaAI
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to continue your English learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full  grid-cols-2">
                <TabsTrigger color="#fff" value="signin">
                  Sign In
                </TabsTrigger>
                <TabsTrigger color="#fff" value="signup">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                  />
                  <Button
                    type="submit"
                    className="text-md px-8 py-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#181818] border border-[#303030] text-white placeholder-gray-400"
                  />
                  <Button
                    type="submit"
                    className="text-md px-8 py-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                {signupMessage && (
                  <p className="mt-4 text-sm text-green-400 text-center">
                    {signupMessage}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
