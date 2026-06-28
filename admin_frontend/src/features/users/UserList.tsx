"use client";

import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { User, Mail, Shield, UserX, MoreVertical, Edit } from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ServiceError } from "@/components/ServiceError";

export function UserList() {
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser.mutateAsync(id);
        toast.success("User deleted successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user");
      }
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">User</TableHead>
            <TableHead className="font-semibold text-slate-700">Roles</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Joined</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!users || users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                    {user.email.substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">
                      {user.userProfile ? `${user.userProfile.firstName} ${user.userProfile.lastName}` : "No Profile"}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No roles</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={user.status === "active" ? "success" : "secondary"}
                  className="capitalize"
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="gap-2 text-red-600 focus:text-red-600"
                      onSelect={() => handleDelete(user.id)}
                    >
                      <UserX className="h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-slate-200">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorMessage() {
  return (
    <ServiceError 
      serviceName="Identity Hub" 
      port="3002" 
      icon={User} 
    />
  );
}
