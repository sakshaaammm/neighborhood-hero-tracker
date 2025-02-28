
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, User, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [userType, setUserType] = useState<"resident" | "authority">("resident");
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await signIn(credentials.email, credentials.password);
      
      if (error) throw error;
      
      if (data.user) {
        const userType = data.user.user_metadata.user_type;
        toast.success(`Welcome back, ${data.user.email}`);
        
        // Explicitly navigate based on user type
        if (userType === "resident") {
          navigate("/user-dashboard");
        } else if (userType === "authority") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (credentials.password !== credentials.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await signUp(
        credentials.email,
        credentials.password,
        userType
      );
      
      if (error) throw error;
      
      if (data) {
        toast.success("Account created successfully! Please check your email to confirm your account.");
        // Switching to sign in mode after successful sign up
        setAuthMode("signin");
      }
    } catch (error: any) {
      toast.error(error.error_description || error.message || "Failed to sign up");
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        <Card className="p-6 glass">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-glow mb-2">
              {authMode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-white/70">
              {authMode === "signin" 
                ? "Sign in to access your account" 
                : "Join our community of problem solvers"}
            </p>
          </div>
          
          <Tabs 
            defaultValue={authMode} 
            onValueChange={(v) => setAuthMode(v as "signin" | "signup")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input 
                      type="email" 
                      placeholder="Email"
                      className="pl-10 glass"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input 
                      type="password" 
                      placeholder="Password"
                      className="pl-10 glass"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full button-shine glass hover:bg-white/20"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input 
                      type="email" 
                      placeholder="Email"
                      className="pl-10 glass"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input 
                      type="password" 
                      placeholder="Password"
                      className="pl-10 glass"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Input 
                      type="password" 
                      placeholder="Confirm Password"
                      className="pl-10 glass"
                      value={credentials.confirmPassword}
                      onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-white/70 text-sm">I am a:</p>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="glass"
                        className={`flex-1 ${userType === "resident" ? "bg-white/20" : ""}`}
                        onClick={() => setUserType("resident")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Resident
                      </Button>
                      <Button
                        type="button"
                        variant="glass"
                        className={`flex-1 ${userType === "authority" ? "bg-white/20" : ""}`}
                        onClick={() => setUserType("authority")}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Authority
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full button-shine glass hover:bg-white/20"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
