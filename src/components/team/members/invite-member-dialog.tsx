"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Sparkles, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTeamStore } from "@/stores/team-store";

interface Department {
  id: string;
  name: string;
}

export function InviteMemberDialog() {
  const qc = useQueryClient();
  const { inviteDialogOpen, setInviteDialogOpen } = useTeamStore();

  const { data: deptData } = useQuery<{ departments: Department[] }>({
    queryKey: ["team-departments-mini"],
    queryFn: async () => {
      const res = await fetch("/api/team/departments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: inviteDialogOpen,
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SALES" | "SUPPORT" | "MANAGER" | "ADMIN" | "VIEWER">("SALES");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [accessLevel, setAccessLevel] = useState<"STAFF" | "MANAGER" | "ADMIN" | "VIEWER">("STAFF");
  const [result, setResult] = useState<{
    invited: number;
    skipped: number;
    details?: { created: { email: string; name: string }[]; skipped: { email: string; reason: string }[] };
  } | null>(null);

  const invite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/team/members/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role,
          departmentId: departmentId || undefined,
          accessLevel,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to invite");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
      qc.invalidateQueries({ queryKey: ["team-activity"] });
    },
  });

  function reset() {
    setEmail("");
    setName("");
    setRole("SALES");
    setDepartmentId("");
    setAccessLevel("STAFF");
    setResult(null);
  }

  return (
    <Dialog
      open={inviteDialogOpen}
      onOpenChange={(o) => {
        if (!o) {
          setInviteDialogOpen(false);
          setTimeout(reset, 250);
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.35)]">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Invite team member</DialogTitle>
              <DialogDescription>
                Send a branded invitation and provision access in one step.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!result ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="name@aetheros.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Base role</Label>
                <Select
                  id="invite-role"
                  className="mt-1.5"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SALES">Sales / Staff</option>
                  <option value="SUPPORT">Support</option>
                  <option value="VIEWER">Viewer</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="invite-access">Access level</Label>
                <Select
                  id="invite-access"
                  className="mt-1.5"
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value as typeof accessLevel)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                  <option value="VIEWER">Viewer</option>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="invite-dept">Department (optional)</Label>
                <Select
                  id="invite-dept"
                  className="mt-1.5"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">—</option>
                  {deptData?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2.5 text-xs text-indigo-700 ring-1 ring-indigo-100">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <p>
                AI will auto-classify role permissions and surface this member in the assignment
                routing engine the moment they accept.
              </p>
            </div>

            {invite.error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                {(invite.error as Error).message}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={invite.isPending || !email}>
                {invite.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {result.invited} invitation{result.invited === 1 ? "" : "s"} sent
                </p>
                <p className="text-xs text-emerald-700">
                  New members will receive a branded email invitation.
                </p>
              </div>
            </div>
            {result.skipped > 0 && result.details && (
              <div className="rounded-xl bg-amber-50 px-3 py-3 text-xs text-amber-700 ring-1 ring-amber-100">
                <p className="font-semibold">{result.skipped} skipped</p>
                <ul className="mt-1.5 space-y-0.5">
                  {result.details.skipped.map((s, i) => (
                    <li key={i}>
                      <strong>{s.email}</strong> — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                Done
              </Button>
              <Button onClick={reset}>Invite another</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
