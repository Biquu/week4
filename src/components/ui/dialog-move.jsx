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
import { FolderBrowserDialog } from "@/components/ui/folder-browser-dialog";

export function MoveDialog({ 
  isOpen, 
  onClose, 
  item, 
  type, 
  onRefresh 
}) {
  const [targetPath, setTargetPath] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFolderBrowserOpen, setIsFolderBrowserOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTargetPath("");
    }
  }, [isOpen]);
  
  const handleOpenFolderBrowser = () => {
    setIsFolderBrowserOpen(true);
  };
  
  const handleFolderSelected = (selectedPath) => {
    setTargetPath(selectedPath);
  };

  const handleMove = async (e) => {
    e.preventDefault();
    
    if (targetPath === null || targetPath === undefined) {
      onClose();
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (type === "folder") {
        console.log("Klasör taşıma isteği:", {
          klasorYolu: item.path || "",
          klasorAdi: item.name,
          yeniKlasorYolu: targetPath
        });
        
        const response = await fetch(`/api/folders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "move",
            klasorYolu: item.path || "",
            klasorAdi: item.name,
            yeniKlasorYolu: targetPath
          })
        });
        
        const data = await response.json();
        console.log("Klasör taşıma yanıtı:", data);
        
        if (data.Sonuc) {
          toast.success(`Klasör taşındı`);
          if (onRefresh) onRefresh();
        } else {
          toast.error(`Taşıma başarısız: ${data.Mesaj || "Bilinmeyen hata"}`);
        }
      } else {
        console.log("Dosya taşıma isteği:", {
          klasorYolu: item.path || "",
          dosyaAdi: item.name,
          yeniDosyaYolu: targetPath
        });
        
        const response = await fetch(`/api/files`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "move",
            klasorYolu: item.path || "",
            dosyaAdi: item.name,
            yeniDosyaYolu: targetPath
          })
        });
        
        const data = await response.json();
        console.log("Dosya taşıma yanıtı:", data);
        
        if (data.Sonuc) {
          toast.success(`Dosya taşındı`);
          if (onRefresh) onRefresh();
        } else {
          toast.error(`Taşıma başarısız: ${data.Mesaj || "Bilinmeyen hata"}`);
        }
      }
    } catch (error) {
      console.error("Taşıma hatası:", error);
      toast.error(`Taşıma işlemi başarısız: ${error.message}`);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {type === "folder" ? "Klasör" : "Dosya"} Taşı
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMove}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 flex gap-2">
                  <Input
                    id="targetPath"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    className="flex-1"
                    placeholder="Hedef klasör yolu (örn: /Klasor1 veya boş bırakın ana dizin için)"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    onClick={handleOpenFolderBrowser}
                    variant="outline"
                  >
                    Gözat
                  </Button>
                </div>
              </div>
              
              {/* Seçilen yol bilgisi */}
              {targetPath && (
                <div className="col-span-4 text-sm">
                  <span className="font-medium">Seçilen klasör:</span>{" "}
                  {targetPath || "Ana Dizin"}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "İşleniyor..." : "Taşı"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Klasör seçme dialog'u */}
      <FolderBrowserDialog
        isOpen={isFolderBrowserOpen}
        onClose={() => setIsFolderBrowserOpen(false)}
        onSelectFolder={handleFolderSelected}
        title="Hedef Klasör Seçin"
      />
    </>
  );
}
