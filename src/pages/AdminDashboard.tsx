import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Award, Eye } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<any>(null);
  const [showPoints, setShowPoints] = useState(false);
  const [pointsToAward, setPointsToAward] = useState(50);
  const [issueStatusUpdating, setIssueStatusUpdating] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  useEffect(() => {
    fetchIssues();
    
    // Set up real-time subscription for changes to issues
    const issuesSubscription = supabase
      .channel('public:issues')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'issues' }, 
        (payload) => {
          console.log('Issue change received:', payload);
          fetchIssues();
        }
      )
      .subscribe();
      
    return () => {
      issuesSubscription.unsubscribe();
    };
  }, []);
  
  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      // Fetch issues and join with profiles to get reporter usernames
      let query = supabase
        .from('issues')
        .select(`
          *,
          profiles(username, id, points)
        `)
        .order('created_at', { ascending: false });
      
      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error("Error fetching issues:", error);
        toast.error("Failed to load issues");
      } else if (data) {
        // Format the issues data for display
        const formattedIssues = data.map(issue => ({
          ...issue,
          date: new Date(issue.created_at || Date.now()).toLocaleDateString(),
          reporter: issue.profiles?.username || "Anonymous",
          reporter_id: issue.profiles?.id
        }));
        
        setIssues(formattedIssues);
      }
    } catch (error) {
      console.error("Error in fetchIssues:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusUpdate = async (issueId: number, newStatus: string) => {
    setIssueStatusUpdating(issueId);
    setIsUpdatingStatus(true);
    
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId);
        
      if (error) {
        console.error("Error updating issue status:", error);
        toast.error("Failed to update status");
      } else {
        toast.success(`Status updated to ${newStatus}`);
        
        // If marked as completed, prompt to award points
        if (newStatus === "completed") {
          const issue = issues.find(i => i.id === issueId);
          if (issue) {
            setCurrentIssue(issue);
            setShowPoints(true);
          }
        }
        
        // Update issues list
        fetchIssues();
      }
    } catch (error) {
      console.error("Error in handleStatusUpdate:", error);
    } finally {
      setIssueStatusUpdating(null);
      setIsUpdatingStatus(false);
    }
  };
  
  const awardPoints = async () => {
    if (!currentIssue || !currentIssue.reporter_id) {
      toast.error("Unable to identify user to award points");
      setShowPoints(false);
      return;
    }
    
    try {
      // Call the RPC function to award points
      const { error } = await supabase.rpc('award_points', { 
        user_id: currentIssue.reporter_id,
        points_to_award: pointsToAward 
      });
      
      if (error) {
        console.error("Error awarding points:", error);
        toast.error("Failed to award points");
      } else {
        toast.success(`${pointsToAward} points awarded to ${currentIssue.reporter || "user"}`);
      }
    } catch (error) {
      console.error("Error in awardPoints:", error);
    } finally {
      setShowPoints(false);
    }
  };
  
  const viewIssueDetails = (issue: any) => {
    setCurrentIssue(issue);
    setShowIssue(true);
  };
  
  // Filter issues based on search term
  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.reporter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-400">Manage reported issues and award points to contributors</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input 
          placeholder="Search issues..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/2"
        />
        
        <Select 
          value={statusFilter} 
          onValueChange={(value) => {
            setStatusFilter(value);
            fetchIssues();
          }}
        >
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p>Loading issues...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <p className="text-xl">No issues found</p>
          <p className="text-gray-400 mt-2">Try changing your search or filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-sm text-gray-400 truncate max-w-[200px]">
                        {issue.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{issue.reporter}</TableCell>
                  <TableCell>{issue.date}</TableCell>
                  <TableCell>
                    <div className={`px-3 py-1 rounded-full text-xs inline-block ${
                      issue.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      issue.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                      issue.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {issue.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewIssueDetails(issue)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {issue.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                            onClick={() => handleStatusUpdate(issue.id, 'in_progress')}
                            disabled={issueStatusUpdating === issue.id && isUpdatingStatus}
                          >
                            Start
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            onClick={() => handleStatusUpdate(issue.id, 'rejected')}
                            disabled={issueStatusUpdating === issue.id && isUpdatingStatus}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {issue.status === 'in_progress' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-green-500/20 text-green-500 hover:bg-green-500/30"
                          onClick={() => handleStatusUpdate(issue.id, 'completed')}
                          disabled={issueStatusUpdating === issue.id && isUpdatingStatus}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {issue.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                          onClick={() => {
                            setCurrentIssue(issue);
                            setShowPoints(true);
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* View Issue Dialog */}
      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          
          {currentIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{currentIssue.title}</h3>
                  <p className="text-gray-400">{currentIssue.description}</p>
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 rounded ${
                        currentIssue.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        currentIssue.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                        currentIssue.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {currentIssue.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reported by:</span>
                      <span>{currentIssue.reporter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span>{currentIssue.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span>{currentIssue.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {currentIssue.image_url && (
                <div>
                  <h4 className="font-medium mb-2">Attached Media</h4>
                  <img 
                    src={currentIssue.image_url} 
                    alt="Issue"
                    className="w-full max-h-96 object-contain rounded-md"
                  />
                </div>
              )}
              
              <div className="pt-4 flex space-x-2 justify-end">
                {currentIssue.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                      onClick={() => {
                        handleStatusUpdate(currentIssue.id, 'in_progress');
                        setShowIssue(false);
                      }}
                    >
                      Start Work
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      onClick={() => {
                        handleStatusUpdate(currentIssue.id, 'rejected');
                        setShowIssue(false);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {currentIssue.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    className="bg-green-500/20 text-green-500 hover:bg-green-500/30"
                    onClick={() => {
                      handleStatusUpdate(currentIssue.id, 'completed');
                      setShowIssue(false);
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
                
                {currentIssue.status === 'completed' && (
                  <Button
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                    onClick={() => {
                      setShowPoints(true);
                      setShowIssue(false);
                    }}
                  >
                    Award Points
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Award Points Dialog */}
      <Dialog open={showPoints} onOpenChange={setShowPoints}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Award Points</DialogTitle>
          </DialogHeader>
          
          {currentIssue && (
            <div className="space-y-4">
              <p>
                Award points to <span className="font-semibold">{currentIssue.reporter}</span> for reporting 
                <span className="font-semibold"> {currentIssue.title}</span>
              </p>
              
              <div className="flex space-x-4 items-center">
                <Input
                  type="number"
                  value={pointsToAward}
                  onChange={(e) => setPointsToAward(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                />
                <span>Points</span>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setShowPoints(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={awardPoints}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Award Points
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
