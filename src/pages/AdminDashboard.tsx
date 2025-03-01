
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

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
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userReporters, setUserReporters] = useState<{[key: string]: string}>({});

  // Load real issues from Supabase
  useEffect(() => {
    const fetchIssues = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching issues:", error);
          toast.error("Failed to load issues");
        } else if (data) {
          // Format the issues data for display
          const formattedIssues = await Promise.all(data.map(async (issue) => {
            // Get reporter name from profiles
            let reporter = "Unknown User";
            
            if (issue.user_id) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', issue.user_id)
                .single();
                
              if (profiles && profiles.username) {
                reporter = profiles.username;
                // Store the user_id to username mapping
                setUserReporters(prev => ({...prev, [issue.user_id]: profiles.username}));
              }
            }
            
            return {
              id: issue.id,
              title: issue.title,
              description: issue.description,
              status: issue.status || 'pending',
              reporter: reporter,
              user_id: issue.user_id,
              date: new Date(issue.created_at || Date.now()).toLocaleDateString(),
              location: issue.location,
              image: issue.image_url
            };
          }));
          
          setIssues(formattedIssues);
          
          // Update global issues for backward compatibility
          if (typeof window !== 'undefined') {
            window.globalIssues = formattedIssues;
          }
        }
      } catch (error) {
        console.error("Error in issues fetch:", error);
        toast.error("An error occurred while loading issues");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
    
    // Set up real-time listener for new issues
    const issuesSubscription = supabase
      .channel('issues-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'issues' }, 
        (payload) => {
          console.log('Issues change received:', payload);
          fetchIssues();
        }
      )
      .subscribe();
      
    return () => {
      issuesSubscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating issue status:", error);
        toast.error("Failed to update issue status");
        return;
      }
      
      // Update local state for immediate UI update
      const updatedIssues = issues.map(issue => 
        issue.id === id ? { ...issue, status } : issue
      );
      
      setIssues(updatedIssues);
      
      // Update global issues for backward compatibility
      if (typeof window !== 'undefined') {
        window.globalIssues = updatedIssues;
      }
      
      toast.success(`Issue status updated to ${status}`);
    } catch (error) {
      console.error("Error in status update:", error);
      toast.error("An error occurred while updating status");
    }
  };

  const awardPoints = async (reporter: string, userId: string) => {
    if (!userId) {
      toast.error("Cannot award points - user ID not found");
      return;
    }
    
    try {
      // Award 100 points by updating the user's profile
      const { error } = await supabase.rpc('award_points', {
        user_id: userId,
        points_to_award: 100
      });
      
      if (error) {
        console.error("Error awarding points:", error);
        toast.error("Failed to award points");
        return;
      }
      
      toast.success(`100 points awarded to ${reporter}`);
    } catch (error) {
      console.error("Error in award points:", error);
      toast.error("An error occurred while awarding points");
    }
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
        
        {isLoading ? (
          <Card className="p-6 glass text-center">
            <p className="text-white/70">Loading issues...</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {issues.length > 0 ? (
              issues.map((issue) => (
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
                        variant="glass"
                        className={issue.status === "pending" ? "bg-white/20" : ""}
                        onClick={() => updateStatus(issue.id, "pending")}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        variant="glass"
                        className={issue.status === "in_progress" ? "bg-white/20" : ""}
                        onClick={() => updateStatus(issue.id, "in_progress")}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="glass"
                        className={issue.status === "completed" ? "bg-white/20" : ""}
                        onClick={() => updateStatus(issue.id, "completed")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="glass"
                        className="button-shine"
                        onClick={() => awardPoints(issue.reporter, issue.user_id)}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Award Points
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 glass text-center">
                <p className="text-white/70">No issues reported yet.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
