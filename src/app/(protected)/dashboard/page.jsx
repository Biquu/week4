"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileActionMenu } from "@/components/ui/file-action-menu";
import { FileContextMenu } from "@/components/ui/file-context-menu";
import { toast } from "sonner";
import {
    Folder,
    File,
    FileText,
    FileArchive,
    FileImage,
    FileVideo,
    FileAudio,
    Upload,
    FileCode,
    FileSpreadsheet,
    LogOut,
    LayoutGrid,
    List,
    Home,
    Search,
    ArrowUp,
    RefreshCw,
    FolderPlus,
    FilePlus,
    MoreHorizontal,
    SortAsc,
    SortDesc,
    Calendar,
    Download,
    Trash2,
    Edit2,
    Info,
    Share2,
    Copy,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardPage() {
	const [path, setPath] = React.useState("");
	const [loading, setLoading] = React.useState(false);
	const [items, setItems] = React.useState({ folders: [], files: [] });
	const [newFile, setNewFile] = React.useState("");
	const [newFolder, setNewFolder] = React.useState("");
	const [view, setView] = React.useState("grid"); // grid | list
	const [query, setQuery] = React.useState("");
	const [sortBy, setSortBy] = React.useState("name"); // name | size | date
	const [sortOrder, setSortOrder] = React.useState("asc"); // asc | desc
	const [selectedItem, setSelectedItem] = React.useState(null); // For context menu/actions
	
	// Dosya yükleme durum değişkenleri
	const [uploadProgress, setUploadProgress] = React.useState(0);
	const [isUploading, setIsUploading] = React.useState(false);
	const [uploadFileName, setUploadFileName] = React.useState("");
	const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
	const [uploadStatus, setUploadStatus] = React.useState(""); // "uploading", "processing", "success", "error"
	
	const router = useRouter();
	const logoutStore = useAuthStore((s) => s.logout);

	async function load(dir = "") {
		setLoading(true);
		try {
			// Log the path we're trying to access
			console.log(`Loading directory: ${dir || "root"}`);
			
			// Eski verileri koruyalım, geçiş sırasında boş görünmesin
			const oldItems = {...items};
			
			const res = await fetch(`/api/browse${dir ? `?klasorYolu=${encodeURIComponent(dir)}` : ""}`, {
				// Cache busting için rastgele query parametresi ekle
				headers: {
					'pragma': 'no-cache',
					'cache-control': 'no-cache'
				},
				// Random query string to force reload
				cache: 'no-store',
				// Timestamp ekleyerek önbellekleme sorununu çöz
				next: { revalidate: 0 }
			});
			
			const data = await res.json();
			
			if (!res.ok) {
				console.error("[browse] failed", { status: res.status, body: data });
				toast.error(`Klasör erişim hatası: ${data?.Mesaj || "Bilinmeyen hata"}`);
				return;
			}
			
			if (data?.Sonuc) {
				console.log("Received data:", data);
				
				// Yeni verileri hemen ayarla (boş gösterme)
				const newFolders = Array.isArray(data.Klasorler) ? data.Klasorler : [];
				const newFiles = Array.isArray(data.Dosyalar) ? data.Dosyalar : [];
				
				// Eğer dosya veya klasör yoksa ve önceki konumdaysak, eski verileri koruyalım
				if ((newFolders.length === 0 && newFiles.length === 0) && path === dir) {
					console.log("Empty result received but keeping old data temporarily");
					
					// Tekrar yüklemeyi dene
					setTimeout(() => {
						fetch(`/api/browse${dir ? `?klasorYolu=${encodeURIComponent(dir)}` : "?"}t=${Date.now()}`, {
							headers: {
								'pragma': 'no-cache',
								'cache-control': 'no-cache'
							},
							cache: 'no-store',
						})
						.then(res => res.json())
						.then(newData => {
							if (newData?.Sonuc) {
								console.log("Second attempt data:", newData);
								setItems({ 
									folders: Array.isArray(newData.Klasorler) ? newData.Klasorler : [], 
									files: Array.isArray(newData.Dosyalar) ? newData.Dosyalar : [] 
								});
							}
							setLoading(false);
						})
						.catch(err => {
							console.error("Second load attempt failed:", err);
							setLoading(false);
						});
					}, 1000);
				} else {
					// Normal durum - gelen verileri göster
					setItems({ folders: newFolders, files: newFiles });
					setPath(dir);
					setLoading(false);
				}
			} else {
				console.error("[browse] failed Object", data);
				toast.error(`Klasör içeriği alınamadı: ${data?.Mesaj || "Bilinmeyen hata"}`);
				setLoading(false);
			}
		} catch (error) {
			console.error("[browse] failed", error);
			toast.error("Klasör içeriği alınırken bir hata oluştu");
			setLoading(false);
		}
	}

	React.useEffect(() => {
		load("");
	}, []);

	function goInto(folderName) {
		// Sanitize the folder name
		if (!folderName || typeof folderName !== 'string') {
			console.error("Invalid folder name:", folderName);
			toast.error("Geçersiz klasör adı");
			return;
		}
		
		// Construct the path properly
		let next;
		if (!path) {
			next = folderName;
		} else {
			// Make sure we don't add double slashes
			next = path.endsWith('/') ? `${path}${folderName}` : `${path}/${folderName}`;
		}
		
		console.log(`Navigating to: ${next}`);
		load(next);
	}

	function goUp() {
		if (!path) return;
		const next = path.split("/").slice(0, -1).join("/");
		load(next);
	}

	async function doLogout() {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
		} finally {
			logoutStore();
			router.push("/login");
		}
	}

	async function createFile() {
		if (!newFile.trim()) return;
		await fetch(`/api/files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ klasorYolu: path || "", dosyaAdi: newFile.trim() }) });
		setNewFile("");
		load(path);
	}
	
	async function uploadFile(file) {
		if (!file) return;
		
		// Yükleme durumu değişkenlerini ayarla
		setUploadFileName(file.name);
		setUploadProgress(0);
		setUploadStatus("uploading");
		setIsUploading(true);
		setUploadDialogOpen(true);
		
		try {
			// FormData oluştur
			const formData = new FormData();
			formData.append("file", file);
			formData.append("dosyaAdi", file.name);
			formData.append("klasorYolu", path || "");
			
			// API çağrısı yap
			const res = await fetch("/api/files/upload", {
				method: "POST",
				body: formData
			});
			
			const data = await res.json();
			
			if (data.Sonuc) {
				// Yükleme başarılı oldu
				setUploadProgress(100);
				setUploadStatus("success");
				
				console.log("Dosya başarıyla yüklendi, listeyi yeniliyorum...");
				
				// Liste yenileme stratejisi: Birkaç denemeli ve zamanlamalı
				const refreshList = async () => {
					console.log("Dosya listesi yenileniyor - ilk deneme");
					
					try {
						// 1. deneme
						const fetchUrl = `/api/browse${path ? `?klasorYolu=${encodeURIComponent(path)}&` : "?"}t=${Date.now()}`;
						console.log("Liste URL:", fetchUrl);
						
						const response = await fetch(fetchUrl, {
							headers: {
								'pragma': 'no-cache',
								'cache-control': 'no-cache'
							},
							cache: 'no-store'
						});
						
						const newData = await response.json();
						
						if (newData?.Sonuc) {
							console.log("Yeni liste verisi:", newData);
							setItems({ 
								folders: Array.isArray(newData.Klasorler) ? newData.Klasorler : [], 
								files: Array.isArray(newData.Dosyalar) ? newData.Dosyalar : [] 
							});
							
							// 1 saniye sonra tekrar kontrol et
							setTimeout(async () => {
								console.log("Dosya listesi yenileniyor - ikinci deneme");
								try {
									const response2 = await fetch(`/api/browse${path ? `?klasorYolu=${encodeURIComponent(path)}&` : "?"}t=${Date.now()}`, {
										headers: {
											'pragma': 'no-cache',
											'cache-control': 'no-cache'
										},
										cache: 'no-store'
									});
									
									const finalData = await response2.json();
									
									if (finalData?.Sonuc) {
										console.log("Final liste verisi:", finalData);
										setItems({ 
											folders: Array.isArray(finalData.Klasorler) ? finalData.Klasorler : [], 
											files: Array.isArray(finalData.Dosyalar) ? finalData.Dosyalar : [] 
										});
									}
								} catch (err) {
									console.error("Son liste yenileme hatası:", err);
								}
							}, 1500);
						}
					} catch (err) {
						console.error("Liste yenileme hatası:", err);
						// Hata durumunda normal load fonksiyonunu kullan
						load(path);
					}
				};
				
				// 500ms sonra liste yenilemeyi başlat
				setTimeout(refreshList, 500);
				
			} else if (data.RequiresChunkedUpload) {
				// Parçalı yükleme gerekiyor
				setUploadStatus("processing");
				toast.info("Dosya boyutu 1MB'dan büyük olduğundan parçalı yükleme başlatılıyor");
				
				// Büyük dosya yükleme işlemi
				await handleChunkedUpload(file);
			} else {
				// Hata durumu
				setUploadStatus("error");
				toast.error(`Yükleme başarısız: ${data.Mesaj || "Bilinmeyen hata"}`);
			}
		} catch (error) {
			setUploadStatus("error");
			toast.error(`Yükleme sırasında hata: ${error.message}`);
			console.error("Upload error:", error);
		} finally {
			setIsUploading(false);
		}
	}
	
	async function handleChunkedUpload(file) {
		// Parçalı yükleme için gerekli değişkenler
		const chunkSize = 1024 * 1024; // 1MB
		const totalChunks = Math.ceil(file.size / chunkSize);
		let uploadedChunks = 0;
		let tempKlasorID = null;
		
		// Yükleme UI durumunu güncelle
		setUploadStatus("uploading");
		setUploadProgress(0);
		
		// 1. Metadata kaydı oluştur
		try {
			const initRes = await fetch("/api/files/chunked-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					step: "init",
					dosyaAdi: file.name,
					parcaSayisi: totalChunks,
					chunkSize: chunkSize,
					totalSize: file.size
				})
			});
			
			const initData = await initRes.json();
			
			if (!initData.Sonuc || !initData.tempKlasorID) {
				setUploadStatus("error");
				toast.error("Yükleme başlatılamadı");
				return;
			}
			
			tempKlasorID = initData.tempKlasorID;
			
			// 2. Parçaları paralel olarak yükle (aynı anda max 3 parça)
			const MAX_PARALLEL_UPLOADS = 3;
			let activeUploads = 0;
			let chunkIndex = 0;
			let failedChunks = false;
			
			// İlk ilerleme göstergesini ayarla
			setUploadProgress(1);
			
			// Parça yükleme fonksiyonu
			const uploadChunk = async (index) => {
				const start = index * chunkSize;
				const end = Math.min(start + chunkSize, file.size);
				const chunk = file.slice(start, end);
				
				// Parça hash'i oluştur (MD5 benzeri)
				const chunkHash = await createSimpleHash(chunk);
				
				try {
					// Parçayı yükle - Binary olarak
					const chunkRes = await fetch(`/api/files/chunked-upload?tempKlasorID=${tempKlasorID}&parcaNumarasi=${index+1}&parcaHash=${chunkHash}`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/octet-stream"
						},
						body: await chunk.arrayBuffer() // Binary buffer olarak gönder
					});
					
					const chunkData = await chunkRes.json();
					
					if (!chunkData.Sonuc) {
						throw new Error(`Parça ${index+1} yükleme hatası: ${chunkData.Mesaj || "Bilinmeyen hata"}`);
					}
					
					uploadedChunks++;
					const progressPercent = Math.round((uploadedChunks / totalChunks) * 100);
					
					// İlerlemeyi güncelle - modal diyalog için
					setUploadProgress(progressPercent);
					
					// Konsola log
					console.log(`Yükleme ilerleme durumu: %${progressPercent} (${uploadedChunks}/${totalChunks} parça)`);
					
				} catch (error) {
					failedChunks = true;
					setUploadStatus("error");
					toast.error(`Parça ${index+1} yüklenemedi: ${error.message}`);
					throw error;
				} finally {
					activeUploads--;
				}
			};
			
			// Paralel yükleme akışı
			while (chunkIndex < totalChunks && !failedChunks) {
				// Paralel işlem sayısı sınırını kontrol et
				if (activeUploads < MAX_PARALLEL_UPLOADS) {
					activeUploads++;
					uploadChunk(chunkIndex).catch(() => {
						failedChunks = true;
					});
					chunkIndex++;
				} else {
					// Aktif yüklemelerin tamamlanmasını bekle
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}
			
			// Tüm aktif yüklemelerin bitmesini bekle
			while (activeUploads > 0 && !failedChunks) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			
			// Hata kontrolü
			if (failedChunks || uploadedChunks !== totalChunks) {
				setUploadStatus("error");
				toast.error("Bazı dosya parçaları yüklenemedi");
				return;
			}
			
			// 3. Dosyayı yayınla
			setUploadStatus("processing");
			
			const completeRes = await fetch("/api/files/chunked-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					step: "complete",
					tempKlasorID: tempKlasorID,
					dosyaAdi: file.name,
					klasorYolu: path || ""
				})
			});
			
			const completeData = await completeRes.json();
			
			if (completeData.Sonuc) {
				// Yükleme başarılı
				setUploadStatus("success");
				
				console.log("Parçalı yükleme tamamlandı, listeyi yeniliyorum...");
				
				// Liste yenileme stratejisi: Birkaç denemeli ve zamanlamalı
				const refreshList = async () => {
					console.log("Parçalı yükleme sonrası liste yenileniyor - ilk deneme");
					
					try {
						// 1. deneme
						const fetchUrl = `/api/browse${path ? `?klasorYolu=${encodeURIComponent(path)}&` : "?"}t=${Date.now()}`;
						console.log("Liste URL:", fetchUrl);
						
						const response = await fetch(fetchUrl, {
							headers: {
								'pragma': 'no-cache',
								'cache-control': 'no-cache'
							},
							cache: 'no-store'
						});
						
						const newData = await response.json();
						
						if (newData?.Sonuc) {
							console.log("Yeni liste verisi:", newData);
							setItems({ 
								folders: Array.isArray(newData.Klasorler) ? newData.Klasorler : [], 
								files: Array.isArray(newData.Dosyalar) ? newData.Dosyalar : [] 
							});
							
							// 1 saniye sonra tekrar kontrol et
							setTimeout(async () => {
								console.log("Dosya listesi yenileniyor - ikinci deneme");
								try {
									const response2 = await fetch(`/api/browse${path ? `?klasorYolu=${encodeURIComponent(path)}&` : "?"}t=${Date.now()}`, {
										headers: {
											'pragma': 'no-cache',
											'cache-control': 'no-cache'
										},
										cache: 'no-store'
									});
									
									const finalData = await response2.json();
									
									if (finalData?.Sonuc) {
										console.log("Final liste verisi:", finalData);
										setItems({ 
											folders: Array.isArray(finalData.Klasorler) ? finalData.Klasorler : [], 
											files: Array.isArray(finalData.Dosyalar) ? finalData.Dosyalar : [] 
										});
									}
								} catch (err) {
									console.error("Son liste yenileme hatası:", err);
								}
							}, 1500);
						}
					} catch (err) {
						console.error("Liste yenileme hatası:", err);
						// Hata durumunda normal load fonksiyonunu kullan
						load(path);
					}
				};
				
				// 500ms sonra liste yenilemeyi başlat
				setTimeout(refreshList, 500);
			} else {
				setUploadStatus("error");
				toast.error(`Dosya yayınlama hatası: ${completeData.Mesaj || "Bilinmeyen hata"}`);
			}
		} catch (error) {
			setUploadStatus("error");
			toast.error(`Parçalı yükleme hatası: ${error.message}`);
			console.error("Chunked upload error:", error);
		} finally {
			// Yükleme işlemi tamamlandı
			setIsUploading(false);
		}
	}
	
	// Hash oluşturma fonksiyonu - fileToMd5 modülünü import ederek kullanabiliriz
	// Ancak bu modül server-side olduğu için client-side'da window.crypto kullanmalıyız
	async function createSimpleHash(blob) {
		try {
			// Web Crypto API ile SHA-256 hesapla
			const arrayBuffer = await blob.arrayBuffer();
			const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
			
			// Hash'i string'e çevir
			const hashHex = Array.from(new Uint8Array(hashBuffer))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');
				
			// MD5 uzunluğuna uygun olması için ilk 32 karakteri al
			return hashHex.substring(0, 32);
		} catch (error) {
			console.error("Hash hesaplama hatası:", error);
			
			// Fallback - basit bir hash algoritması
			const buffer = await blob.arrayBuffer();
			const view = new Uint8Array(buffer);
			
			// MD5 başlangıç değerleri
			let h1 = 0x67452301;
			let h2 = 0xEFCDAB89;
			let h3 = 0x98BADCFE;
			let h4 = 0x10325476;
			
			// Daha iyi karma sonuçları için geliştirilmiş algoritma
			for (let i = 0; i < view.length; i++) {
				h1 = ((h1 << 5) - h1 + view[i]) >>> 0;
				h2 = ((h2 << 7) - h2 + view[i]) >>> 0;
				h3 = ((h3 << 11) - h3 + view[i]) >>> 0;
				h4 = ((h4 << 19) - h4 + view[i]) >>> 0;
				
				// Her 4096 bayt işlendiğinde karıştırma yaparak daha iyi dağılım sağla
				if (i % 4096 === 0 && i > 0) {
					h1 = (h1 ^ h4) >>> 0;
					h2 = (h2 ^ h3) >>> 0;
					h3 = (h3 ^ h1) >>> 0;
					h4 = (h4 ^ h2) >>> 0;
				}
			}
			
			// Dosya boyutunu da hash'e dahil et
			h1 = (h1 ^ view.length) >>> 0;
			h4 = (h4 ^ view.length) >>> 0;
			
			// 32 karakterlik bir hash oluştur
			return (h1 >>> 0).toString(16).padStart(8, '0') +
				(h2 >>> 0).toString(16).padStart(8, '0') +
				(h3 >>> 0).toString(16).padStart(8, '0') +
				(h4 >>> 0).toString(16).padStart(8, '0');
		}
	}

	async function createFolder() {
		if (!newFolder.trim()) return;
		await fetch(`/api/folders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ klasorYolu: path || "", klasorAdi: newFolder.trim() }) });
		setNewFolder("");
		load(path);
	}

	const segments = (path ? path.split("/") : []).filter(Boolean);
	// Filter items by search query
const filteredFolders = items.folders.filter((f) => f.Adi.toLowerCase().includes(query.toLowerCase()));
const filteredFiles = items.files.filter((f) => f.Adi.toLowerCase().includes(query.toLowerCase()));

// Sort items
const sortedFolders = [...filteredFolders].sort((a, b) => {
	if (sortBy === "name") {
		return sortOrder === "asc" ? a.Adi.localeCompare(b.Adi) : b.Adi.localeCompare(a.Adi);
	}
	return 0;
});

const sortedFiles = [...filteredFiles].sort((a, b) => {
	if (sortBy === "name") {
		return sortOrder === "asc" ? a.Adi.localeCompare(b.Adi) : b.Adi.localeCompare(a.Adi);
	} else if (sortBy === "size") {
		const sizeA = a.Boyut || 0;
		const sizeB = b.Boyut || 0;
		return sortOrder === "asc" ? sizeA - sizeB : sizeB - sizeA;
	} else if (sortBy === "date") {
		// Assuming there's a date field, use it. If not, fall back to name
		// Replace 'Tarih' with the actual date field name from your API
		const dateA = a.Tarih ? new Date(a.Tarih).getTime() : 0;
		const dateB = b.Tarih ? new Date(b.Tarih).getTime() : 0;
		return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
	}
	return 0;
});


	function getExt(name) {
		const i = name.lastIndexOf(".");
		return i > -1 ? name.slice(i + 1).toLowerCase() : "";
	}

	function formatBytes(bytes) {
		if (!bytes || bytes <= 0) return "-";
		const units = ["B", "KB", "MB", "GB", "TB"];
		let idx = 0;
		let val = bytes;
		while (val >= 1024 && idx < units.length - 1) {
			val /= 1024;
			idx++;
		}
		return `${val.toFixed(val < 10 && idx > 0 ? 1 : 0)} ${units[idx]}`;
	}

	function FileIcon({ name }) {
		const ext = getExt(name);
		let Icon = File;
		let cls = "text-muted-foreground";
		if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
			Icon = FileImage; cls = "text-sky-500";
		} else if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
			Icon = FileVideo; cls = "text-violet-500";
		} else if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) {
			Icon = FileAudio; cls = "text-amber-500";
		} else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
			Icon = FileArchive; cls = "text-orange-500";
		} else if (["xls", "xlsx", "csv"].includes(ext)) {
			Icon = FileSpreadsheet; cls = "text-emerald-600";
		} else if (["pdf", "doc", "docx", "txt", "rtf", "md"].includes(ext)) {
			Icon = FileText; cls = ext === "pdf" ? "text-red-600" : "text-blue-600";
		} else if (["js", "ts", "tsx", "jsx", "json", "xml", "html", "css"].includes(ext)) {
			Icon = FileCode; cls = "text-teal-600";
		}
		return <Icon className={`h-8 w-8 ${cls}`} />;
	}

	// Handle file/folder actions
	function handleContextMenu(item, type) {
		return (e) => {
			e.preventDefault();
			e.stopPropagation();
			setSelectedItem({ ...item, type });
		};
	}

	async function handleDownloadFile(file) {
		if (!file) return;
		
		toast.loading(`${file.Adi} indiriliyor...`, { id: "download" });
		
		try {
			const res = await fetch("/api/files/download", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					klasorYolu: path || "",
					dosyaAdi: file.Adi
				})
			});
			
			const data = await res.json();
			
			if (data.Sonuc && data.downloadUrl) {
				toast.success(`İndirme başlatılıyor...`, { id: "download" });
				
				// İndirme bağlantısını aç - yeni bir pencerede açarak oturum kaybolmasını önle
				// indirmeden önce dosya bilgisini saklıyoruz
				const fileName = file.Adi;
				
				// iframe yöntemi ile indirme (oturum yönetimi sorununu çözer)
				const iframe = document.createElement('iframe');
				iframe.style.display = 'none';
				document.body.appendChild(iframe);
				
				iframe.onload = function() {
					setTimeout(() => {
						document.body.removeChild(iframe);
						toast.success(`${fileName} başarıyla indirildi`, { id: "download" });
					}, 2000);
				};
				
				iframe.src = data.downloadUrl;
				
				// Alternatif olarak pencere açma yöntemi
				// const popup = window.open('', '_blank');
				// if (popup) {
				//   popup.location.href = data.downloadUrl;
				// } else {
				//   toast.warning("Pop-up engelleyici izin vermedi. Lütfen pop-up engelleyiciyi devre dışı bırakın.", { id: "download" });
				// }
			} else {
				toast.error(`İndirme başarısız: ${data.Mesaj || "Bilinmeyen hata"}`, { id: "download" });
			}
		} catch (error) {
			toast.error(`İndirme sırasında hata: ${error.message}`, { id: "download" });
			console.error("Download error:", error);
		}
	}
	
	async function handleDelete(item) {
		if (!item) return;
		try {
			if (item.type === "folder") {
				await fetch(`/api/folders`, {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ klasorYolu: path || "", klasorAdi: item.Adi })
				});
			} else {
				await fetch(`/api/files`, {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ klasorYolu: path || "", dosyaAdi: item.Adi })
				});
			}
			toast.success(`${item.type === "folder" ? "Klasör" : "Dosya"} silindi`);
			load(path);
		} catch (error) {
			toast.error(`Silme işlemi başarısız: ${error.message}`);
		}
	}

	// Yükleme durumunu görselleştiren modal diyalog
	const renderUploadDialog = () => {
		return (
			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" /> 
							{uploadStatus === "success" ? "Yükleme Tamamlandı" : "Dosya Yükleniyor"}
						</DialogTitle>
					</DialogHeader>
					
					<div className="py-6">
						{uploadStatus === "uploading" && (
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<FileIcon name={uploadFileName} />
									<div className="flex-1">
										<p className="text-sm font-medium">{uploadFileName}</p>
										<p className="text-xs text-muted-foreground mt-1">{uploadProgress}% yüklendi</p>
									</div>
								</div>
								
								<Progress value={uploadProgress} className="h-2" />
							</div>
						)}
						
						{uploadStatus === "processing" && (
							<div className="flex flex-col items-center justify-center py-4">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
								<p className="text-sm">Dosya işleniyor, lütfen bekleyin...</p>
							</div>
						)}
						
						{uploadStatus === "success" && (
							<div className="flex flex-col items-center justify-center py-4 text-green-600">
								<svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								<p className="text-center">{uploadFileName} başarıyla yüklendi!</p>
							</div>
						)}
						
						{uploadStatus === "error" && (
							<div className="flex flex-col items-center justify-center py-4 text-red-600">
								<svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
								<p className="text-center">Yükleme sırasında bir hata oluştu!</p>
							</div>
						)}
					</div>
					
					<DialogFooter className="flex justify-between">
						{uploadStatus !== "uploading" && (
							<Button 
								onClick={() => setUploadDialogOpen(false)} 
								variant={uploadStatus === "success" ? "default" : "outline"}
								className={uploadStatus === "success" ? "bg-green-600 hover:bg-green-700" : ""}
							>
								{uploadStatus === "success" ? "Tamam" : "Kapat"}
							</Button>
						)}
						
						{uploadStatus === "uploading" && (
							<Button variant="outline" disabled>
								Yükleniyor...
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	};

	return (
		<div className="px-6 py-5 mx-auto max-w-7xl space-y-4">
			{renderUploadDialog()}
			{/* Toolbar */}
			<div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
				<div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
					{/* Breadcrumbs */}
					<div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 md:pb-0 no-scrollbar">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="sm" onClick={() => load("")}>
									<Home className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Ana Klasör</TooltipContent>
						</Tooltip>
						<span className="text-muted-foreground">/</span>
						{segments.map((seg, idx) => {
							const crumb = segments.slice(0, idx + 1).join("/");
							return (
								<React.Fragment key={crumb}>
									<button onClick={() => load(crumb)} className="hover:underline truncate max-w-[120px]" title={seg}>
										{seg}
									</button>
									{idx < segments.length - 1 && <span className="text-muted-foreground">/</span>}
								</React.Fragment>
							);
						})}
					</div>
					
					{/* Actions */}
					<div className="flex items-center gap-2 flex-wrap justify-end">
						<div className="relative flex-grow max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input 
								placeholder="Dosyaları ve klasörleri ara..." 
								className="pl-9 h-10 rounded-full bg-muted/40 border-muted focus:border-primary/50 focus:bg-background transition-all" 
								value={query} 
								onChange={(e) => setQuery(e.target.value)} 
							/>
						</div>

						{/* View toggle */}
						<div className="flex rounded-md overflow-hidden border border-input">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" className={`rounded-none ${view === "grid" ? "bg-muted" : ""}`} onClick={() => setView("grid")}>
										<LayoutGrid className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Izgara Görünümü</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" className={`rounded-none ${view === "list" ? "bg-muted" : ""}`} onClick={() => setView("list")}>
										<List className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Liste Görünümü</TooltipContent>
							</Tooltip>
						</div>

						{/* Sort options */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="flex gap-1 items-center">
									{sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
									<span className="hidden sm:inline">
										{sortBy === "name" ? "İsim" : sortBy === "size" ? "Boyut" : "Tarih"}
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => setSortBy("name")} className={sortBy === "name" ? "bg-muted" : ""}>İsim</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortBy("size")} className={sortBy === "size" ? "bg-muted" : ""}>Boyut</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortBy("date")} className={sortBy === "date" ? "bg-muted" : ""}>Tarih</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
									{sortOrder === "asc" ? "Artan" : "Azalan"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="secondary" size="icon" onClick={goUp} disabled={!path || loading}>
										<ArrowUp className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Yukarı</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => load(path)} disabled={loading}>
										<RefreshCw className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Yenile</TooltipContent>
							</Tooltip>
						</div>

						{/* Create buttons */}
						<div className="flex items-center gap-1">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="flex gap-1">
										<FolderPlus className="h-4 w-4" /> Klasör
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="p-2">
									<div className="flex items-center gap-2">
										<Input placeholder="Yeni klasör" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} className="h-9 w-40" />
										<Button onClick={createFolder} disabled={!newFolder.trim()}>Oluştur</Button>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="flex gap-1">
										<FilePlus className="h-4 w-4" /> Dosya
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="p-2">
									<div className="flex items-center gap-2">
										<Input placeholder="Yeni dosya" value={newFile} onChange={(e) => setNewFile(e.target.value)} className="h-9 w-40" />
										<Button onClick={createFile} disabled={!newFile.trim()}>Oluştur</Button>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
							
							{/* Dosya yükleme butonu */}
							<Button 
								variant="default" 
								className="flex gap-1 bg-[#0076bc] hover:bg-[#0076bc]/90"
								onClick={() => {
									const input = document.createElement('input');
									input.type = 'file';
									input.onchange = (e) => {
										if (e.target.files.length > 0) {
											const file = e.target.files[0];
											uploadFile(file);
										}
									};
									input.click();
								}}
							>
								<Upload className="h-4 w-4" /> Yükle
							</Button>
							
							{/* Çıkış butonu sidebar profil menüsüne taşındı */}
						</div>
					</div>
				</div>
			</div>

			{/* Path info and stats */}
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center gap-2 text-sm">
					<span className="font-medium">Konum:</span>
					<div className="text-muted-foreground truncate">{path || "Ana Dizin"}</div>
				</div>
				<div className="flex gap-3 items-center">
					<div className="flex items-center gap-1">
						<Folder className="h-4 w-4 text-primary" /> 
						<span className="text-sm">{sortedFolders.length}</span>
					</div>
					<div className="flex items-center gap-1">
						<File className="h-4 w-4 text-primary" /> 
						<span className="text-sm">{sortedFiles.length}</span>
					</div>
				</div>
			</div>

			{/* Content */}
			{loading ? (
				// Loading skeleton
				<div className="space-y-6">
					<div>
						<h2 className="text-lg font-medium mb-3">Klasörler</h2>
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
							{[...Array(4)].map((_, i) => (
								<Card key={`skeleton-folder-${i}`} className="animate-pulse">
									<CardContent className="flex flex-col items-center gap-2 p-3">
										<div className="h-6 w-6 rounded-full bg-muted"></div>
										<div className="h-2 w-16 bg-muted rounded"></div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
					<div>
						<h2 className="text-lg font-medium mb-3">Dosyalar</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
							{[...Array(4)].map((_, i) => (
								<Card key={`skeleton-file-${i}`} className="animate-pulse">
									<CardContent className="flex flex-col items-center gap-2 p-5">
										<div className="h-8 w-8 rounded-full bg-muted"></div>
										<div className="h-3 w-24 bg-muted rounded"></div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			) : view === "grid" ? (
				<div className="space-y-4">
					{/* Klasörler Başlığı ve Grid */}
					<div>
						<h2 className="text-lg font-medium mb-3">Klasörler</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
							{sortedFolders.map((f) => (
								<FileContextMenu 
									key={`f-${f.ID}`}
									item={{
										name: f.Adi,
										path: path || "",
										id: f.ID
									}}
									type="folder"
									onRefresh={() => load(path)}
									onOpenFolder={() => goInto(f.Adi)}
								>
									<Card className="group border border-border/50 hover:border-primary/30 overflow-hidden">
										<CardContent className="p-0">
											<button 
												onClick={() => goInto(f.Adi)} 
												className="w-full flex flex-row items-center gap-2 py-1.5 px-3"
											>
												<Folder className="h-5 w-5 text-primary flex-shrink-0" />
												<span className="text-sm truncate">{f.Adi}</span>
											</button>
										</CardContent>
										<div className="absolute top-0 right-0">
											<FileActionMenu 
												item={{
													name: f.Adi,
													path: path || "",
													id: f.ID
												}}
												type="folder"
												onRefresh={() => load(path)}
											/>
										</div>
									</Card>
								</FileContextMenu>
							))}
						</div>
					</div>

					{/* Dosyalar Başlığı ve Grid */}
					<div>
						<h2 className="text-lg font-medium mb-3">Dosyalar</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
							{sortedFiles.map((f) => (
								<FileContextMenu 
									key={`d-${f.ID}`}
									item={{
										name: f.Adi,
										path: path || "",
										id: f.ID
									}}
									type="file"
									onRefresh={() => load(path)}
								>
									<Card className="group border border-border/50 hover:border-primary/30 overflow-hidden">
										<CardContent className="p-0">
											<div 
												className="w-full h-full flex flex-col items-center justify-center py-4 px-3 cursor-pointer"
												onClick={() => handleDownloadFile(f)}
											>
												<FileIcon name={f.Adi} />
												<span className="text-sm truncate w-full text-center mt-2">{f.Adi}</span>
												<span className="text-xs text-muted-foreground mt-1">{f.Boyut > 0 ? formatBytes(f.Boyut) : "0 B"}</span>
											</div>
										</CardContent>
										<div className="absolute top-1 right-1">
											<FileActionMenu 
												item={{
													name: f.Adi,
													path: path || "",
													id: f.ID
												}}
												type="file"
												onRefresh={() => load(path)}
											/>
										</div>
									</Card>
								</FileContextMenu>
							))}
						</div>
					</div>
				</div>
			) : (
				// List view
				<div className="space-y-6">
					{/* Klasörler Bölümü */}
					<div>
						<h2 className="text-lg font-medium mb-3">Klasörler</h2>
						<div className="rounded-md border overflow-hidden">
							<div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-sm font-medium border-b">
								<div className="flex-1">İsim</div>
								<div className="w-32 text-center">Tür</div>
								<div className="w-20 text-right">İşlemler</div>
							</div>

							<div className="divide-y divide-border/60">
								{sortedFolders.length === 0 ? (
									<div className="px-3 py-4 text-center text-muted-foreground">
										Bu konumda klasör bulunmuyor.
									</div>
								) : (
									sortedFolders.map((f) => (
										<FileContextMenu 
											key={`f-${f.ID}`}
											item={{
												name: f.Adi,
												path: path || "",
												id: f.ID
											}}
											type="folder"
											onRefresh={() => load(path)}
											onOpenFolder={() => goInto(f.Adi)}
										>
											<div className="group hover:bg-muted/40">
												<div className="flex items-center justify-between px-3 py-3">
													<div className="flex-1 min-w-0">
														<button onClick={() => goInto(f.Adi)} className="flex items-center gap-3 max-w-full">
															<Folder className="h-5 w-5 text-primary shrink-0" />
															<span className="truncate group-hover:text-primary">{f.Adi}</span>
														</button>
													</div>
													<div className="w-32 text-center text-xs text-muted-foreground">
														Klasör
													</div>
													<div className="w-20 flex justify-end">
														<FileActionMenu 
															item={{
																name: f.Adi,
																path: path || "",
																id: f.ID
															}}
															type="folder"
															onRefresh={() => load(path)}
														/>
													</div>
												</div>
											</div>
										</FileContextMenu>
									))
								)}
							</div>
						</div>
					</div>
					
					{/* Dosyalar Bölümü */}
					<div>
						<h2 className="text-lg font-medium mb-3">Dosyalar</h2>
						<div className="rounded-md border overflow-hidden">
							<div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-sm font-medium border-b">
								<div className="flex-1">İsim</div>
								<div className="w-32 text-center">Boyut</div>
								<div className="w-20 text-right">İşlemler</div>
							</div>

							<div className="divide-y divide-border/60">
								{sortedFiles.length === 0 ? (
									<div className="px-3 py-4 text-center text-muted-foreground">
										Bu konumda dosya bulunmuyor.
									</div>
								) : (
									sortedFiles.map((f) => (
										<FileContextMenu 
											key={`d-${f.ID}`}
											item={{
												name: f.Adi,
												path: path || "",
												id: f.ID
											}}
											type="file"
											onRefresh={() => load(path)}
										>
											<div className="group hover:bg-muted/40">
												<div className="flex items-center justify-between px-3 py-3">
													<div className="flex-1 min-w-0 flex items-center gap-3">
														<FileIcon name={f.Adi} />
														<span className="truncate">{f.Adi}</span>
													</div>
													<div className="w-32 text-center text-xs text-muted-foreground">
														{f.Boyut > 0 ? formatBytes(f.Boyut) : "0 B"}
													</div>
													<div className="w-20 flex justify-end">
														<FileActionMenu 
															item={{
																name: f.Adi,
																path: path || "",
																id: f.ID
															}}
															type="file"
															onRefresh={() => load(path)}
														/>
													</div>
												</div>
											</div>
										</FileContextMenu>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Empty state */}
			{!loading && sortedFolders.length === 0 && sortedFiles.length === 0 && (
				<div className="text-center py-16 rounded-lg border border-dashed border-muted">
					<div className="flex flex-col items-center gap-3">
						<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
							<Folder className="h-8 w-8 text-primary/80" />
						</div>
						<p className="text-muted-foreground text-base">Bu konumda öğe yok.</p>
						<div className="flex gap-3 mt-2">
							<Button size="sm" className="flex gap-1.5 items-center" onClick={() => {
								const input = document.querySelector('input[placeholder="Yeni klasör"]');
								if (input) input.focus();
							}}>
								<FolderPlus className="h-4 w-4" /> Klasör Oluştur
							</Button>
							<Button variant="outline" size="sm" className="flex gap-1.5 items-center" onClick={() => {
								const input = document.querySelector('input[placeholder="Yeni dosya"]');
								if (input) input.focus();
							}}>
								<FilePlus className="h-4 w-4" /> Dosya Oluştur
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}