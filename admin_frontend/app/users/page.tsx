"use client";

import { UserList } from "@/features/users/UserList";
import { CreateUserForm } from "@/features/users/CreateUserForm";
import { RoleManager } from "@/features/users/RoleManager";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useState } from "react";

export default function UsersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h1>
          <p className="text-slate-500 mt-1">Manage system personnel, customers, and their permission profiles.</p>
        </div>
        <div className="flex items-center gap-3">

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:shadow-lg">
                <UserPlus className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create User Account</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new administrative or customer account.
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="directory" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UsersIcon className="h-4 w-4" />
            User Directory
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Role Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="directory" className="space-y-4 border-none p-0 outline-none">
          <UserList />
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4 border-none p-0 outline-none">
          <RoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
