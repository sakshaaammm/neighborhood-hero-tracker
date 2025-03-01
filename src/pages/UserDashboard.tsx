import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trophy, MoreVertical, User, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

// Define the issue type with proper types
interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  date: string;
  reporter: string;
  reporter_id: string;
  image_url?: string | null;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: {
    username?: string;
    id?: string;
  } | null;
}

export default function AdminDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [displayedIssues, setDisplayedIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [awardValue, setAwardValue] = useState(10);

  const { user, isAuthenticated } = useAuth();

  // Fetch all issues from Supabase DB
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          profiles:user_id (
            username,
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching issues:", error);
        setError(error.message);
        toast.error("Failed to load issues");
      } else if (data) {
        // Format the issues data for display
        const formattedIssues = data.map(issue => {
          const profile = issue.profiles as { username?: string; id?: string } | null;
          return {
            ...issue,
            date: new Date(issue.created_at || Date.now()).toLocaleDateString(),
            reporter: profile?.username || "Anonymous",
            reporter_id: profile?.id || "",
            profiles: profile
          };
        });
        
        setIssues(formattedIssues);
      }

      setLoading(false);
    };

    const fetchUsers = async () => {
      // Fetch users via profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else if (data) {
        setUsers(data);
      }
    };

    fetchIssues();
    fetchUsers();
  }, []);

  // Filter and search issues
  useEffect(() => {
    let filtered = [...issues];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((issue) => issue.status === filterStatus);
    }

    // Search by title, description, or location
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.location.toLowerCase().includes(query)
      );
    }

    setDisplayedIssues(filtered);
  }, [issues, searchQuery, filterStatus]);

  const updateIssueStatus = async (issueId: number, newStatus: string) => {
    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issueId);

    if (error) {
      console.error("Error updating issue status:", error);
      toast.error("Failed to update issue status");
      return false;
    }

    // Update the local state
    setIssues(
      issues.map((issue) =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    );

    // If new status is 'completed', award points to the reporter
    if (newStatus === 'completed') {
      // Find the issue to get the reporter_id
      const issue = issues.find(i => i.id === issueId);
      if (issue && issue.user_id) {
        // Use user_id from the issue instead of reporter_id
        const pointsResult = await awardPoints(issue.user_id, awardValue);
        if (pointsResult) {
          toast.success(`Awarded ${awardValue} points to reporter`);
        }
      }
    }

    toast.success(`Issue status updated to ${newStatus}`);
    return true;
  };

  const awardPoints = async (userId: string, points: number) => {
    try {
      // Call the Supabase RPC function to award points
      const { error } = await supabase.rpc('award_points', {
        user_id: userId,
        points_to_award: points
      });
      
      if (error) {
        console.error("Error awarding points:", error);
        toast.error("Failed to award points");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Exception in award points:", error);
      toast.error("An error occurred while awarding points");
      return false;
    }
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDetailsOpen(true);
  };

  const totalIssues = issues.length;
  const pendingIssues = issues.filter((i) => i.status === "pending").length;
  const inProgressIssues = issues.filter((i) => i.status === "in_progress").length;
  const completedIssues = issues.filter((i) => i.status === "completed").length;

  // Chart data for the statistics tab
  const chartData = [
    { name: "Pending", value: pendingIssues },
    { name: "In Progress", value: inProgressIssues },
    { name: "Completed", value: completedIssues },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Issues
              </p>
              <h3 className="text-2xl font-bold">{totalIssues}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <h3 className="text-2xl font-bold">{pendingIssues}</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-full">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <h3 className="text-2xl font-bold">{completedIssues}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Trophy className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading issues...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : displayedIssues.length === 0 ? (
              <div className="py-8 text-center">No issues found</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedIssues.map((issue) => (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleIssueClick(issue)}
                      >
                        <TableCell className="font-medium">
                          #{issue.id}
                        </TableCell>
                        <TableCell>{issue.title}</TableCell>
                        <TableCell>{issue.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              issue.status === "completed"
                                ? "outline"
                                : issue.status === "in_progress"
                                ? "secondary"
                                : "default"
                            }
                            className={
                              issue.status === "completed"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : issue.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : ""
                            }
                          >
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{issue.reporter}</TableCell>
                        <TableCell>{issue.date}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateIssueStatus(issue.id, "pending");
                                }}
                              >
                                Mark as Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateIssueStatus(issue.id, "in_progress");
                                }}
                              >
                                Mark as In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateIssueStatus(issue.id, "completed");
                                }}
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Issues Reported</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {user.username || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        {
                          issues.filter(
                            (issue) => issue.user_id === user.id
                          ).length
                        }
                      </TableCell>
                      <TableCell>{user.points || 0} pts</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Award 10 points to the user
                            awardPoints(user.id, 10);
                          }}
                        >
                          Award Points
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Issues by Status</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`${value} issues`, 'Count']}
                      />
                    } 
                  />
                  <Bar 
                    dataKey="value" 
                    fill="var(--primary)" 
                    name="Issues" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedIssue && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedIssue.title}</DialogTitle>
              <DialogDescription>
                Reported by {selectedIssue.reporter} on{" "}
                {selectedIssue.date}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssue.description}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Location</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssue.location}
                </p>
              </div>
              {selectedIssue.image_url && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Image</h4>
                  <img
                    src={selectedIssue.image_url}
                    alt="Issue"
                    className="rounded-md max-h-[300px] object-contain"
                  />
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <Badge
                  variant={
                    selectedIssue.status === "completed"
                      ? "outline"
                      : selectedIssue.status === "in_progress"
                      ? "secondary"
                      : "default"
                  }
                  className={
                    selectedIssue.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : selectedIssue.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : ""
                  }
                >
                  {selectedIssue.status}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">
                  Award points when marking as complete
                </h4>
                <Input
                  type="number"
                  value={awardValue}
                  onChange={(e) => setAwardValue(parseInt(e.target.value) || 0)}
                  className="w-[100px]"
                  min={0}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
              >
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-yellow-500 hover:bg-yellow-600"
                  onClick={() => {
                    updateIssueStatus(selectedIssue.id, "in_progress");
                    setIsDetailsOpen(false);
                  }}
                >
                  Mark as In Progress
                </Button>
                <Button
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    updateIssueStatus(selectedIssue.id, "completed");
                    setIsDetailsOpen(false);
                  }}
                >
                  Mark as Completed
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
