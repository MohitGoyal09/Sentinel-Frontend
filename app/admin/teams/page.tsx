"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Trash2, RefreshCw, ChevronRight,
  AlertTriangle, UserCheck, Calendar, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface Team {
  id: string;
  name: string;
  manager_hash: string | null;
  tenant_id: string;
  member_count: number;
  created_at: string;
}

interface TeamMember {
  user_hash: string;
  role: string;
}

interface TeamDetail extends Team {
  members: TeamMember[];
}

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

// ============================================================
// Sub-components
// ============================================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">No teams yet</p>
      <p className="text-sm mt-1">Create your first team to get started.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16 text-red-500">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
      <p className="font-medium">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ============================================================
// Create Team Dialog
// ============================================================

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function CreateTeamDialog({ open, onOpenChange, onCreated }: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      setName("");
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Team name is required.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/admin/teams", { name: trimmed, manager_hash: null });
      toast.success(`Team "${trimmed}" created successfully.`);
      setName("");
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create team.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Give the team a name. You can assign a manager and members after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium mb-1.5 block" htmlFor="team-name">
            Team Name
          </label>
          <Input
            id="team-name"
            placeholder="e.g. Engineering, Product, Sales..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={submitting}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? "Creating..." : "Create Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Team Detail Dialog
// ============================================================

interface TeamDetailDialogProps {
  team: Team | null;
  onClose: () => void;
  onDeleted: () => void;
}

function TeamDetailDialog({ team, onClose, onDeleted }: TeamDetailDialogProps) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!team) {
      setDetail(null);
      setDetailError(null);
      setConfirmDelete(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        const raw = await api.get<unknown>(`/admin/teams/${team.id}`);
        setDetail(unwrap<TeamDetail>(raw));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load team details.";
        setDetailError(msg);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [team]);

  const handleDelete = async () => {
    if (!team) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/teams/${team.id}`);
      toast.success(`Team "${team.name}" deleted.`);
      onClose();
      onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete team.";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const canDelete = detail !== null && detail.members.length === 0;

  return (
    <Dialog open={!!team} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {team?.name}
          </DialogTitle>
          <DialogDescription>
            Team details and member roster
          </DialogDescription>
        </DialogHeader>

        {/* Meta row */}
        {team && (
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground border-b pb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatDate(team.created_at)}
            </span>
            {team.manager_hash && (
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{team.manager_hash.slice(0, 12)}…</span>
              </span>
            )}
          </div>
        )}

        {/* Members */}
        <div className="min-h-[120px]">
          {loadingDetail ? (
            <LoadingSpinner />
          ) : detailError ? (
            <p className="text-sm text-red-500 text-center py-6">{detailError}</p>
          ) : detail && detail.members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No members assigned to this team.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {detail?.members.map((m) => (
                <div
                  key={m.user_hash}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.user_hash.slice(0, 16)}…
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2">
          {!confirmDelete ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!canDelete || deleting}
                onClick={() => setConfirmDelete(true)}
                title={!canDelete ? "Remove all members before deleting" : "Delete team"}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Team
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground flex-1">
                Are you sure? This cannot be undone.
              </p>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await api.get<unknown>("/admin/teams");
      const data = unwrap<Team[]>(raw);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load teams.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const totalMembers = teams.reduce((sum, t) => sum + (t.member_count ?? 0), 0);
  const teamsWithManager = teams.filter((t) => !!t.manager_hash).length;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Team Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage teams, review membership, and configure team settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeams}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Team
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-xs text-muted-foreground">Total teams</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total members</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamsWithManager}</p>
                <p className="text-xs text-muted-foreground">Teams with manager</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Table */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Teams</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${teams.length} team${teams.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchTeams} />
            ) : teams.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left pb-3 pr-4 font-medium">Team</th>
                      <th className="text-left pb-3 pr-4 font-medium">Members</th>
                      <th className="text-left pb-3 pr-4 font-medium hidden sm:table-cell">Manager</th>
                      <th className="text-left pb-3 pr-4 font-medium hidden md:table-cell">Created</th>
                      <th className="text-right pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {teams.map((team) => (
                      <tr
                        key={team.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={team.member_count === 0 ? "outline" : "secondary"}>
                            {team.member_count} {team.member_count === 1 ? "member" : "members"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {team.manager_hash ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {team.manager_hash.slice(0, 12)}…
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                          {formatDate(team.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeam(team);
                            }}
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchTeams}
      />

      <TeamDetailDialog
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        onDeleted={fetchTeams}
      />
    </ProtectedRoute>
  );
}
