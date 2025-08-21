"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RenameDialog({ 
  isOpen, 
  onClose, 
  item, 
  type, 
  onRefresh 
}) {
  const [newName, setNewName] = React.useState(item?.name || "");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && item) {
      setNewName(item.name);
    }
  }, [isOpen, item]);

  const handleRename = async (e) => {
    e.preventDefault();
    
    if (!newName || newName === item.name) {
      onClose();
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (type === "folder") {
        console.log("Klasör yeniden adlandırma isteği:", {
          klasorYolu: item.path || "",
          klasorAdi: item.name,
          yeniKlasorAdi: newName
        });
        
        const response = await fetch(`/api/folders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rename",
            klasorYolu: item.path || "",
            klasorAdi: item.name,
            yeniKlasorAdi: newName
          })
        });
        
        const data = await response.json();
        console.log("Klasör yeniden adlandırma yanıtı:", data);
        
        if (data.Sonuc) {
          toast.success(`Klasör yeniden adlandırıldı`);
          if (onRefresh) onRefresh();
        } else {
          toast.error(`Yeniden adlandırma başarısız: ${data.Mesaj || "Bilinmeyen hata"}`);
        }
      } else {
        console.log("Dosya yeniden adlandırma isteği:", {
          klasorYolu: item.path || "",
          dosyaAdi: item.name,
          yeniDosyaAdi: newName
        });
        
        const response = await fetch(`/api/files`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rename",
            klasorYolu: item.path || "",
            dosyaAdi: item.name,
            yeniDosyaAdi: newName
          })
        });
        
        const data = await response.json();
        console.log("Dosya yeniden adlandırma yanıtı:", data);
        
        if (data.Sonuc) {
          toast.success(`Dosya yeniden adlandırıldı`);
          if (onRefresh) onRefresh();
        } else {
          toast.error(`Yeniden adlandırma başarısız: ${data.Mesaj || "Bilinmeyen hata"}`);
        }
      }
    } catch (error) {
      console.error("Yeniden adlandırma hatası:", error);
      toast.error(`Yeniden adlandırma işlemi başarısız: ${error.message}`);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "folder" ? "Klasör" : "Dosya"} Yeniden Adlandır
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleRename}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-4"
                placeholder={`Yeni ${type === "folder" ? "klasör" : "dosya"} adı`}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading || !newName || newName === item?.name}>
              {isLoading ? "İşleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
