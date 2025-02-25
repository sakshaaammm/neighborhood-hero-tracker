
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { MapPin, AlertCircle, Award, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Index() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<"resident" | "authority" | null>(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleLogin = async (type: "resident" | "authority") => {
    setIsLoading(true);
    
    // Demo credentials check
    const isValidCredentials = type === "resident" 
      ? credentials.username === "demo" && credentials.password === "demo123"
      : credentials.username === "admin" && credentials.password === "admin123";

    if (!isValidCredentials) {
      toast.error("Invalid credentials. Please use demo accounts.");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    login(type);
    setIsLoading(false);
    // Navigate to appropriate dashboard
    navigate(type === "resident" ? "/user-dashboard" : "/admin-dashboard");
    toast.success(`Welcome back, ${credentials.username}!`);
  };

  const handleDemoLogin = (type: "resident" | "authority") => {
    const demoCredentials = type === "resident" 
      ? { username: "demo", password: "demo123" }
      : { username: "admin", password: "admin123" };
    
    setCredentials(demoCredentials);
    setLoginType(type);
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
        <div className="text-sm text-white/60 neo-blur p-2 rounded-lg">
          Demo Accounts: 
          <br />
          Resident: demo / demo123
          <br />
          Authority: admin / admin123
        </div>
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

      {loginType ? (
        <Card className="relative z-10 p-6 glass w-full max-w-md animate-fadeIn">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center text-glow mb-6">
              {loginType === "resident" ? "Resident Login" : "Authority Login"}
            </h2>
            <Input
              type="text"
              placeholder="Username"
              className="glass"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              className="glass"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
            <div className="flex gap-4">
              <Button
                size="lg"
                className="w-full button-shine glass hover:bg-white/20"
                disabled={isLoading}
                onClick={() => handleLogin(loginType)}
              >
                <Lock className="mr-2 h-4 w-4" />
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="glass hover:bg-white/20"
                onClick={() => setLoginType(null)}
              >
                Back
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="button-shine glass hover:bg-white/20 hover:scale-105 transition-all duration-300"
            disabled={isLoading}
            onClick={() => handleDemoLogin("resident")}
          >
            Login as Resident
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="button-shine glass hover:bg-white/20 hover:scale-105 transition-all duration-300"
            disabled={isLoading}
            onClick={() => handleDemoLogin("authority")}
          >
            Authority Login
          </Button>
        </div>
      )}
    </div>
  );
}
