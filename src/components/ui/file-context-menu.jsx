"use client";

import React, { useState, useCallback } from 'react';
import { toast } from "sonner";
import { 
  Download, 
  Edit2, 
  Trash2, 
  ArrowUp,
  Info,
  FolderOpen
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { RenameDialog } from "@/components/ui/dialog-rename";
import { MoveDialog } from "@/components/ui/dialog-move";

export function FileContextMenu({ children, item, type, onRefresh, onOpenFolder }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  // Sağ tık olayı işleyicisi
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  }, []);

  const handleDownload = async () => {
    setIsOpen(false);
    toast.loading(`${item.name} indiriliyor...`, { id: "download" });
    
    try {
      console.log("Context menu - İndirme isteği gönderiliyor:", {
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
      
      console.log("Context menu - İndirme yanıtı alındı:", {
        status: response.status,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log("Context menu - İndirme yanıt verisi:", data);
      
      if (data.Sonuc && data.downloadUrl) {
        console.log("Context menu - İndirme URL'si alındı:", data.downloadUrl);
        toast.success(`İndirme başlatılıyor...`, { id: "download" });
        
        // İndirme bağlantısını aç
        const fileName = item.name;
        
        // iframe yöntemi ile indirme
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.onload = function() {
          console.log("Context menu - iframe yüklendi, dosya indiriliyor:", fileName);
          setTimeout(() => {
            document.body.removeChild(iframe);
            toast.success(`${fileName} başarıyla indirildi`, { id: "download" });
          }, 2000);
        };
        
        iframe.onerror = function(error) {
          console.error("Context menu - iframe yükleme hatası:", error);
          document.body.removeChild(iframe);
          toast.error(`İndirme başarısız: iframe yükleme hatası`, { id: "download" });
        };
        
        console.log("Context menu - iframe.src ayarlanıyor:", data.downloadUrl);
        iframe.src = data.downloadUrl;
      } else {
        console.error("Context menu - İndirme başarısız:", data);
        toast.error(`İndirme başarısız: ${data.Mesaj || "Bilinmeyen hata"}`, { id: "download" });
      }
    } catch (error) {
      console.error("Context menu - İndirme hatası:", error);
      toast.error(`İndirme sırasında hata: ${error.message}`, { id: "download" });
    }
  };

  const handleDelete = async () => {
    setIsOpen(false);
    try {
      if (!confirm(`"${item.name}" öğesini silmek istediğinizden emin misiniz?`)) {
        return;
      }
      
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
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(`Silme işlemi başarısız: ${error.message}`);
    }
  };

  const handleRename = () => {
    setIsOpen(false);
    setIsRenameDialogOpen(true);
  };

  const handleMove = () => {
    setIsOpen(false);
    setIsMoveDialogOpen(true);
  };
  
  const handleFileInfo = () => {
    setIsOpen(false);
    toast.info("Dosya bilgileri işlevi henüz eklenmedi");
  };

  const handleOpenFolder = () => {
    setIsOpen(false);
    if (onOpenFolder) onOpenFolder(item);
  };

  return (
    <div onContextMenu={handleContextMenu} className="w-full h-full">
      {children}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <span style={{ 
            position: "fixed", 
            left: position.x, 
            top: position.y, 
            height: 0, 
            width: 0,
            opacity: 0
          }}></span>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-52">
          {type === "folder" && (
            <DropdownMenuItem onClick={handleOpenFolder} className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>Aç</span>
            </DropdownMenuItem>
          )}
          
          {type === "file" && (
            <DropdownMenuItem onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>İndir</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleRename} className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            <span>Yeniden Adlandır</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleMove} className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 rotate-45" />
            <span>Taşı</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {type === "file" && (
            <DropdownMenuItem onClick={handleFileInfo} className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Dosya Bilgileri</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-4 w-4" />
            <span>Sil</span>
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
    </div>
  );
}