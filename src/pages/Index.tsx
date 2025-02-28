
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { MapPin, AlertCircle, Award, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Index() {
  const { isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();

  const navigateToDashboard = () => {
    if (isAuthenticated) {
      if (userType === "resident") {
        navigate("/user-dashboard");
      } else if (userType === "authority") {
        navigate("/admin-dashboard");
      }
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 space-y-8 animate-fadeIn overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 text-center space-y-4 animate-float">
        <h1 className="text-5xl font-bold tracking-tight text-glow" style={{ fontFamily: 'Playfair Display, serif' }}>
          Neighborhood Problem Resolver
        </h1>
        <p className="text-xl text-white/80 max-w-[600px] neo-blur p-4 rounded-lg">
          Join our community-driven platform to report and resolve neighborhood issues
        </p>
      </div>

      <div className="relative z-10 grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="p-6 glass hover:scale-105 transition-all duration-300 animate-float">
          <MapPin className="w-12 h-12 mb-4 text-blue-400" />
          <h3 className="text-xl font-semibold mb-2 text-glow">Report Issues</h3>
          <p className="text-white/70">
            Easily report and track neighborhood problems
          </p>
        </Card>

        <Card className="p-6 glass hover:scale-105 transition-all duration-300 animate-float" style={{ animationDelay: "0.2s" }}>
          <AlertCircle className="w-12 h-12 mb-4 text-yellow-400" />
          <h3 className="text-xl font-semibold mb-2 text-glow">Track Progress</h3>
          <p className="text-white/70">
            Monitor the status of reported issues
          </p>
        </Card>

        <Card className="p-6 glass hover:scale-105 transition-all duration-300 animate-float" style={{ animationDelay: "0.4s" }}>
          <Award className="w-12 h-12 mb-4 text-green-400" />
          <h3 className="text-xl font-semibold mb-2 text-glow">Earn Rewards</h3>
          <p className="text-white/70">
            Get points and redeem exclusive rewards
          </p>
        </Card>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        {isAuthenticated ? (
          <Button
            size="lg"
            className="button-shine glass hover:bg-white/20 hover:scale-105 transition-all duration-300"
            onClick={navigateToDashboard}
          >
            Go to Dashboard
          </Button>
        ) : (
          <Button
            size="lg"
            className="button-shine glass hover:bg-white/20 hover:scale-105 transition-all duration-300"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        )}
      </div>
      
      {/* Status indicator for debugging */}
      <div className="relative z-10 text-sm text-white/50 mt-8">
        Status: {isAuthenticated ? `Logged in as ${userType}` : "Not logged in"}
        {isAuthenticated && (
          <Button
            variant="link"
            className="text-blue-400 ml-2 p-0"
            onClick={() => navigate(userType === "resident" ? "/user-dashboard" : "/admin-dashboard")}
          >
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
