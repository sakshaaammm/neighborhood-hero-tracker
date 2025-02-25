
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// Access global issues (replace with proper state management)
declare const globalIssues: any[];

export default function AdminDashboard() {
  const [issues, setIssues] = useState<any[]>([
    {
      id: 1,
      title: "Pothole on Main Street",
      description: "Large pothole causing traffic issues",
      status: "pending",
      reporter: "John Doe",
      date: "2024-02-20",
      location: "123 Main St",
    },
    {
      id: 2,
      title: "Broken Streetlight",
      description: "Street light not working on Oak Avenue",
      status: "in_progress",
      reporter: "Jane Smith",
      date: "2024-02-19",
      location: "456 Oak Ave",
    },
    {
      id: 3,
      title: "Illegal Dumping",
      description: "Garbage being dumped near the park",
      status: "pending",
      reporter: "Mike Johnson",
      date: "2024-02-18",
      location: "789 Park Rd",
    },
    {
      id: 4,
      title: "Graffiti on Wall",
      description: "Vandalism on public property",
      status: "completed",
      reporter: "Sarah Williams",
      date: "2024-02-17",
      location: "321 Wall St",
    },
  ]);

  // Check for new issues periodically
  useEffect(() => {
    const checkNewIssues = () => {
      if (typeof globalIssues !== 'undefined' && globalIssues.length > 0) {
        setIssues(prev => {
          const newIssues = globalIssues.filter(
            issue => !prev.some(existingIssue => existingIssue.id === issue.id)
          );
          if (newIssues.length > 0) {
            toast.info(`${newIssues.length} new issue(s) reported`);
            return [...prev, ...newIssues];
          }
          return prev;
        });
      }
    };

    const interval = setInterval(checkNewIssues, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id: number, status: string) => {
    setIssues(issues.map(issue => 
      issue.id === id ? { ...issue, status } : issue
    ));
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
