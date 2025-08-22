"use client";

import React, { useState } from 'react';
import { toast } from "sonner";
import { 
  Download, 
  Edit2, 
  Trash2, 
  ArrowUp,
  MoreHorizontal,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { RenameDialog } from "@/components/ui/dialog-rename";
import { MoveDialog } from "@/components/ui/dialog-move";
import { DeleteDialog } from "@/components/ui/dialog-delete";

export function FileActionMenu({ item, type, onRefresh }) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handleDownload = async () => {
    toast.loading(`${item.name} indiriliyor...`, { id: "download" });
    
    try {
      console.log("İndirme isteği gönderiliyor:", {
        klasorYolu: item.path || "",
        dosyaAdi: item.name
      });
      
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          klasorYolu: item.path || "",
          dosyaAdi: item.name
        })
      });
      
      console.log("İndirme yanıtı alındı:", {
        status: response.status,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log("İndirme yanıt verisi:", data);
      
      if (data.Sonuc && data.downloadUrl) {
        console.log("İndirme URL'si alındı:", data.downloadUrl);
        toast.success(`İndirme başlatılıyor...`, { id: "download" });
        
        // İndirme bağlantısını aç
        const fileName = item.name;
        
        // iframe yöntemi ile indirme
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.onload = function() {
          console.log("iframe yüklendi, dosya indiriliyor:", fileName);
          setTimeout(() => {
            document.body.removeChild(iframe);
            toast.success(`${fileName} başarıyla indirildi`, { id: "download" });
          }, 2000);
        };
        
        iframe.onerror = function(error) {
          console.error("iframe yükleme hatası:", error);
          document.body.removeChild(iframe);
          toast.error(`İndirme başarısız: iframe yükleme hatası`, { id: "download" });
        };
        
        console.log("iframe.src ayarlanıyor:", data.downloadUrl);
        iframe.src = data.downloadUrl;
      } else {
        console.error("İndirme başarısız:", data);
        toast.error(`İndirme başarısız: ${data.Mesaj || "Bilinmeyen hata"}`, { id: "download" });
      }
    } catch (error) {
      console.error("İndirme hatası:", error);
      toast.error(`İndirme sırasında hata: ${error.message}`, { id: "download" });
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleRename = () => {
    setIsRenameDialogOpen(true);
  };

  const handleMove = () => {
    setIsMoveDialogOpen(true);
  };
  
  const handleFileInfo = () => {
    toast.info("Dosya bilgileri işlevi henüz eklenmedi");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {type === "file" && (
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              İndir
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleRename}>
            <Edit2 className="h-4 w-4 mr-2" />
            Yeniden Adlandır
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleMove}>
            <ArrowUp className="h-4 w-4 mr-2 rotate-45" />
            Taşı
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {type === "file" && (
            <DropdownMenuItem onClick={handleFileInfo}>
              <Info className="h-4 w-4 mr-2" />
              Dosya Bilgileri
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Yeniden Adlandırma Dialog */}
      <RenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        item={item}
        type={type}
        onRefresh={onRefresh}
      />

      {/* Taşıma Dialog */}
      <MoveDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        item={item}
        type={type}
        onRefresh={onRefresh}
      />

      {/* Silme Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        item={item}
        type={type}
        onRefresh={onRefresh}
      />
    </>
  );
}
