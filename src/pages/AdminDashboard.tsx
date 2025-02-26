
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  User,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

// Initialize global issues if it doesn't exist
if (typeof window !== 'undefined' && !window.hasOwnProperty('globalIssues')) {
  (window as any).globalIssues = [];
}

declare global {
  interface Window {
    globalIssues: any[];
  }
}

export default function AdminDashboard() {
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    const checkNewIssues = () => {
      if (typeof window !== 'undefined') {
        if (!window.globalIssues) {
          window.globalIssues = [];
        }
        setIssues([...window.globalIssues]);
      }
    };

    checkNewIssues();
    const interval = setInterval(checkNewIssues, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id: number, status: string) => {
    if (!window.globalIssues) {
      window.globalIssues = [];
    }
    
    const updatedIssues = issues.map(issue => 
      issue.id === id ? { ...issue, status } : issue
    );
    setIssues(updatedIssues);
    window.globalIssues = updatedIssues;
    toast.success(`Issue status updated to ${status}`);
  };

  const awardPoints = (reporter: string) => {
    toast.success(`100 points awarded to ${reporter}`);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "completed":
        return <CheckCircle className="text-green-400" />;
      case "in_progress":
        return <Clock className="text-yellow-400" />;
      default:
        return <AlertCircle className="text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 space-y-8">
        <h1 className="text-3xl font-bold text-glow">Admin Dashboard</h1>
        
        <div className="space-y-6">
          {issues.map((issue) => (
            <Card key={issue.id} className="p-6 glass hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <h3 className="text-xl font-semibold text-glow">{issue.title}</h3>
                  </div>
                  <p className="text-white/70">{issue.description}</p>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <User size={16} />
                    <span>{issue.reporter}</span>
                    <span>•</span>
                    <span>{issue.date}</span>
                    <span>•</span>
                    <MapPin size={16} />
                    <span>{issue.location}</span>
                  </div>
                  {issue.image && (
                    <div className="mt-4">
                      <img
                        src={issue.image}
                        alt="Problem"
                        className="rounded-lg max-h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className={`glass ${issue.status === "pending" ? "bg-white/20" : ""}`}
                    onClick={() => updateStatus(issue.id, "pending")}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    className={`glass ${issue.status === "in_progress" ? "bg-white/20" : ""}`}
                    onClick={() => updateStatus(issue.id, "in_progress")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    className={`glass ${issue.status === "completed" ? "bg-white/20" : ""}`}
                    onClick={() => updateStatus(issue.id, "completed")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    className="glass button-shine"
                    onClick={() => awardPoints(issue.reporter)}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Award Points
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
