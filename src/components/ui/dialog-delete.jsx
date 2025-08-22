"use client";

import React, { useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function DeleteDialog({ isOpen, onClose, item, type, onRefresh }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      if (type === "folder") {
        await fetch(`/api/folders`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            klasorYolu: item.path || "", 
            klasorAdi: item.name 
          })
        });
      } else {
        await fetch(`/api/files`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            klasorYolu: item.path || "", 
            dosyaAdi: item.name 
          })
        });
      }
      
      toast.success(`${type === "folder" ? "Klasör" : "Dosya"} silindi`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(`Silme işlemi başarısız: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Öğeyi Sil
          </DialogTitle>
          <DialogDescription>
            <span className="text-foreground font-medium">&quot;{item?.name}&quot;</span> öğesini silmek istediğinizden emin misiniz?
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            İptal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
