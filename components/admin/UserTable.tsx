"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, maskEid } from "@/lib/utils";
import type { User } from "@/types";

type SafeUser = Omit<User, "passwordHash">;

interface UserTableProps {
  users: SafeUser[];
  onRoleChange: (userId: string, role: string) => void;
}

interface ConfirmDialogState {
  open: boolean;
  user: SafeUser | null;
  targetRole: string;
}

export function UserTable({ users, onRoleChange }: UserTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    user: null,
    targetRole: "",
  });
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleToggleRole = (user: SafeUser) => {
    const targetRole = user.role === "admin" ? "regular" : "admin";
    setConfirmDialog({ open: true, user, targetRole });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.user) return;
    setLoadingUserId(confirmDialog.user.id);
    setConfirmDialog({ open: false, user: null, targetRole: "" });

    try {
      onRoleChange(confirmDialog.user.id, confirmDialog.targetRole);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>SID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {user.sid || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRole(user)}
                      disabled={loadingUserId === user.id}
                      className="h-8"
                    >
                      {loadingUserId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.role === "admin" ? (
                        <>
                          <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Demote</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Promote</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirm Role Change</DialogTitle>
            <DialogDescription>
              Change{" "}
              <span className="font-medium text-foreground">
                {confirmDialog.user?.name}
              </span>{" "}
              from{" "}
              <Badge variant="outline" className="mx-0.5 capitalize">
                {confirmDialog.user?.role}
              </Badge>{" "}
              to{" "}
              <Badge variant="outline" className="mx-0.5 capitalize">
                {confirmDialog.targetRole}
              </Badge>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, user: null, targetRole: "" })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
