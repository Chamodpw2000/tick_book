"use client";

import { useState } from "react";
import { useArtists, useDeleteArtist } from "@/hooks/useArtists";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Music, Mail, Trash2, Loader2 } from "lucide-react";
import { ServiceError } from "@/components/ServiceError";
import { Artist } from "@/api/artists";

export function ArtistList() {
  const { data: artists, isLoading, error } = useArtists();
  const deleteArtist = useDeleteArtist();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (artist: Artist) => {
    setDeletingId(artist._id);
    try {
      await deleteArtist.mutateAsync(artist._id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">Artist</TableHead>
            <TableHead className="font-semibold text-slate-700">Genre</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists?.map((artist) => (
            <TableRow
              key={artist._id}
              className="hover:bg-slate-50/50 transition-colors text-left"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0">
                    {artist.profileImageUrl ? (
                      <img
                        src={artist.profileImageUrl}
                        alt={artist.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Music className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{artist.name}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail className="h-3 w-3" />
                      {artist.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600 border-none"
                >
                  {artist.genre || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={artist.isActive ? "success" : "secondary"}
                  className="capitalize"
                >
                  {artist.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId === artist._id}
                    >
                      {deletingId === artist._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-900">
                          {artist.name}
                        </span>
                        ? This will also remove their profile image from storage.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(artist)}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-slate-200">
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorMessage() {
  return (
    <ServiceError
      serviceName="Artist Directory"
      port="3004"
      icon={Music}
    />
  );
}
