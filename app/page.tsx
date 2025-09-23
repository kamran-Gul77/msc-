import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  BookOpen,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  Zap,
  Target,
} from "lucide-react";
import { Navigation } from "@/components/Elements/Navigation";
import { Footer } from "@/components/Elements/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1E1E]/50 to-[#121212]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-gray-700 text-white">
              AI-Powered English Learning
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">
              Master English with Your Personal AI Tutor
            </h1>
            <p className="text-xl text-gray-400 mb-8 text-pretty max-w-2xl mx-auto">
              Learn vocabulary, perfect your grammar, and practice conversations
              with our intelligent chatbot. Personalized lessons that adapt to
              your learning pace and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <MessageCircle className="mr-2 h-5 w-5 text-black" />
                Start Learning Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-transparent border border-gray-600 text-white hover:bg-gray-800"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#1E1E1E]/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete English Learning Experience
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Our AI chatbot provides comprehensive learning across all
              essential English skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white">
                  Vocabulary Building
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Learn new words with context, practice usage, and reinforce
                  memory through interactive exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Contextual word learning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Adaptive difficulty levels
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Spaced repetition system
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <Target className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white">Grammar Mastery</CardTitle>
                <CardDescription className="text-gray-300">
                  Get instant corrections, understand grammar rules, and
                  practice with targeted exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Real-time error correction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Grammar rule explanations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Practice exercises
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-[#1E1E1E] border border-[#303030]">
              <CardHeader>
                <Users className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white">
                  Conversation Practice
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Engage in realistic dialogues and build confidence through
                  interactive conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Real-world scenarios
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Confidence building
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    Fluency development
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#121212]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How linguaAi Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple steps to start your English learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="text-center">
                <div className="bg-yellow-400/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-400">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step === 1
                    ? "Sign Up"
                    : step === 2
                    ? "Choose Focus"
                    : step === 3
                    ? "Practice"
                    : "Improve"}
                </h3>
                <p className="text-gray-400 text-sm">
                  {step === 1
                    ? "Create your account and set your learning goals"
                    : step === 2
                    ? "Select vocabulary, grammar, or conversation practice"
                    : step === 3
                    ? "Engage with AI exercises and conversations"
                    : "Track progress and achieve your English goals"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#1E1E1E]/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose linguaAi?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: "Instant Feedback",
                    desc: "Get immediate corrections and suggestions to learn faster and more effectively",
                  },
                  {
                    icon: TrendingUp,
                    title: "Personalized Learning",
                    desc: "AI adapts to your skill level and learning pace for optimal progress",
                  },
                  {
                    icon: Star,
                    title: "Gamified Experience",
                    desc: "Stay motivated with achievements, scores, and progress tracking",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <item.icon className="h-6 w-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1E1E1E] rounded-lg p-8 shadow-lg border border-[#303030]">
              <div className="text-center">
                <div className="bg-yellow-400/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Ready to Start Learning?
                </h3>
                <p className="text-gray-400 mb-6">
                  Join thousands of learners improving their English with AI
                </p>
                <Button
                  size="lg"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Begin Your Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
