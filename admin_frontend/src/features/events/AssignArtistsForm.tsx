"use client";

import { useArtists } from "@/hooks/useArtists";
import { useAssignArtists } from "@/hooks/useEvents";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Music, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface AssignArtistsFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export function AssignArtistsForm({ eventId, onSuccess }: AssignArtistsFormProps) {
  const { data: artists, isLoading: isLoadingArtists } = useArtists();
  const assignArtists = useAssignArtists();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArtists = artists?.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleArtist = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    try {
      await assignArtists.mutateAsync({
        eventId,
        artistIds: selectedIds
      });
      toast.success(`${selectedIds.length} artists linked to event!`);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to link artists");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search artists..." 
          className="pl-10" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {isLoadingArtists ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-slate-300" /></div>
        ) : filteredArtists?.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No artists found.</p>
        ) : (
          filteredArtists?.map(artist => (
            <div 
              key={artist._id} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                selectedIds.includes(artist._id) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => toggleArtist(artist._id)}
            >
              <div className="flex items-center gap-3">
                <Music className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{artist.name}</p>
                  <p className="text-xs text-slate-500">{artist.genre || "Global Artist"}</p>
                </div>
              </div>
              <Checkbox 
                checked={selectedIds.includes(artist._id)} 
                onCheckedChange={() => toggleArtist(artist._id)}
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">{selectedIds.length}</span> artists selected
        </p>
        <Button 
          onClick={handleSubmit} 
          disabled={selectedIds.length === 0 || assignArtists.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {assignArtists.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign to Event
        </Button>
      </div>
    </div>
  );
}
