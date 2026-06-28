"use client";

import { useRoles, useCreateRole, useDeleteRole } from "@/hooks/useUsers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RoleManager() {
  const { data: roles, isLoading } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const [newRoleName, setNewRoleName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      await createRole.mutateAsync(newRoleName);
      setNewRoleName("");
      toast.success("Role created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create role");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? Users with this role will lose it.")) {
      try {
        await deleteRole.mutateAsync(id);
        toast.success("Role deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete role");
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-200">
        <form onSubmit={handleCreate} className="flex gap-3">
          <div className="relative flex-1">
            <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="e.g. Content Moderator" 
              className="pl-10" 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createRole.isPending} className="bg-slate-900">
            {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Role
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-50 border-slate-200" />)
        ) : (
          roles?.map((role) => (
            <Card key={role.id} className="p-4 flex items-center justify-between border-slate-200 group hover:border-blue-200 hover:shadow-sm transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{role.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">System Role</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                onClick={() => handleDelete(role.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
