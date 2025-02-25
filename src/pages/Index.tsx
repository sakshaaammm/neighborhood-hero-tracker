
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { MapPin, AlertCircle, Award } from "lucide-react";

export default function Index() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (type: "resident" | "authority") => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    login(type);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 space-y-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Neighborhood Problem Resolver
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Join our community-driven platform to report and resolve neighborhood issues
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="p-6 glass hover:bg-white/10 transition-all">
          <MapPin className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Report Issues</h3>
          <p className="text-muted-foreground">
            Easily report and track neighborhood problems
          </p>
        </Card>

        <Card className="p-6 glass hover:bg-white/10 transition-all">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
          <p className="text-muted-foreground">
            Monitor the status of reported issues
          </p>
        </Card>

        <Card className="p-6 glass hover:bg-white/10 transition-all">
          <Award className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
          <p className="text-muted-foreground">
            Get points and redeem exclusive rewards
          </p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="glass hover:bg-white/20"
          disabled={isLoading}
          onClick={() => handleLogin("resident")}
        >
          Login as Resident
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="glass hover:bg-white/20"
          disabled={isLoading}
          onClick={() => handleLogin("authority")}
        >
          Authority Login
        </Button>
      </div>
    </div>
  );
}
