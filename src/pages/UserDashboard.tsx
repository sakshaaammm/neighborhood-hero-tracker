import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, ArrowUp, ArrowDown, MoreVertical, Trophy, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

// Define types
interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  image_url?: string;
}

interface Reporter {
  id: string;
  name: string;
  points: number;
  issues: number;
}

export default function UserDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    location: "",
    image_url: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchUserIssues(user.id);
  }, [user]);

  const fetchUserIssues = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching issues:", error);
        setError(error.message);
        toast.error("Failed to load issues");
      } else {
        setIssues(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const reportIssue = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("issues").insert([
        {
          ...newIssue,
          user_id: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error reporting issue:", error);
        toast.error("Failed to report issue");
      } else {
        toast.success("Issue reported successfully!");
        setNewIssue({ title: "", description: "", location: "", image_url: "" });
        setIsReporting(false);
        fetchUserIssues(user.id); // Refresh issues
      }
    } catch (error) {
      console.error("Unexpected error reporting issue:", error);
      toast.error("An unexpected error occurred");
    }
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

  const sortedIssues = [...issues].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const filteredIssues = sortedIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || issue.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>

      <Tabs defaultValue="my_issues" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my_issues">My Issues</TabsTrigger>
          <TabsTrigger value="report_issue">Report Issue</TabsTrigger>
        </TabsList>

        <TabsContent value="my_issues">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Reported Issues</h2>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" /> Filter by Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus("in_progress")}
                    >
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                      Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Oldest First
                    </>
                  ) : (
                    <>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Newest First
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading issues...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-4">No issues found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>{issue.title}</TableCell>
                        <TableCell>{issue.location}</TableCell>
                        <TableCell>
                          <Badge variant={issue.status === "completed" ? "outline" : "secondary"}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(issue.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="report_issue">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Report a New Issue</h2>
            <div className="grid gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Issue Title"
                  value={newIssue.title}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Location"
                  value={newIssue.location}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Description"
                  value={newIssue.description}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={newIssue.image_url}
                  onChange={(e) =>
                    setNewIssue({ ...newIssue, image_url: e.target.value })
                  }
                />
              </div>
              <Button onClick={reportIssue} className="w-full">
                Report Issue
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
