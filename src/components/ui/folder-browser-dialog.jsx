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
import { Folder, ChevronRight, FolderOpen } from "lucide-react";

export function FolderBrowserDialog({ 
  isOpen, 
  onClose, 
  onSelectFolder,
  title = "Klasör Seç"
}) {
  const [currentPath, setCurrentPath] = React.useState("");
  const [folders, setFolders] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [breadcrumbs, setBreadcrumbs] = React.useState([{ name: "Ana Dizin", path: "" }]);

  // Klasörleri yükle
  const loadFolders = React.useCallback(async (path) => {
    setIsLoading(true);
    try {
      console.log("Klasörleri yükleniyor:", path);
      const response = await fetch(`/api/browse?klasorYolu=${encodeURIComponent(path || "")}`);
      const data = await response.json();
      console.log("Klasör listesi yanıtı:", data);
      
      if (data.Sonuc) {
        setFolders(data.Klasorler || []);
      } else {
        toast.error(`Klasörler yüklenemedi: ${data.Mesaj || "Bilinmeyen hata"}`);
        setFolders([]);
      }
    } catch (error) {
      console.error("Klasör listesi hatası:", error);
      toast.error("Klasörler yüklenirken bir hata oluştu");
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dialog açıldığında klasörleri yükle
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPath("");
      setBreadcrumbs([{ name: "Ana Dizin", path: "" }]);
      loadFolders("");
    }
  }, [isOpen, loadFolders]);

  // Klasöre gir
  const navigateToFolder = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    
    // Breadcrumbs güncelle
    const newBreadcrumbs = [...breadcrumbs, { name: folderName, path: newPath }];
    setBreadcrumbs(newBreadcrumbs);
    
    loadFolders(newPath);
  };

  // Breadcrumb'a tıklandığında
  const handleBreadcrumbClick = (path, index) => {
    setCurrentPath(path);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    loadFolders(path);
  };

  // Klasör seçildiğinde
  const handleSelectFolder = () => {
    onSelectFolder(currentPath);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1 text-sm mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <button
                onClick={() => handleBreadcrumbClick(crumb.path, index)}
                className={`hover:underline ${
                  index === breadcrumbs.length - 1 ? "font-medium" : ""
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        {/* Seçilen klasör yolu */}
        <div className="border rounded-md p-2 bg-muted/30 text-sm">
          <span className="font-medium">Seçilen klasör:</span>{" "}
          {currentPath || "Ana Dizin"}
        </div>
        
        {/* Klasör listesi */}
        <div className="border rounded-md h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse">Yükleniyor...</div>
            </div>
          ) : folders.length > 0 ? (
            <div className="divide-y">
              {folders.map((folder) => (
                <button
                  key={folder.ID}
                  className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 text-left"
                  onClick={() => navigateToFolder(folder.Adi)}
                >
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <span>{folder.Adi}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Folder className="h-8 w-8 mb-2" />
              <p>Bu dizinde klasör bulunmuyor</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSelectFolder}>
            Bu Klasörü Seç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
