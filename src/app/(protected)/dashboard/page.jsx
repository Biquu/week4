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
import { toast } from "sonner";
import {
    Folder,
    File,
    FileText,
    FileArchive,
    FileImage,
    FileVideo,
    FileAudio,
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
	const router = useRouter();
	const logoutStore = useAuthStore((s) => s.logout);

	async function load(dir = "") {
		setLoading(true);
		try {
			// Log the path we're trying to access
			console.log(`Loading directory: ${dir || "root"}`);
			
			const res = await fetch(`/api/browse${dir ? `?klasorYolu=${encodeURIComponent(dir)}` : ""}`);
			const data = await res.json();
			
			if (!res.ok) {
				console.error("[browse] failed", { status: res.status, body: data });
				toast.error(`Klasör erişim hatası: ${data?.Mesaj || "Bilinmeyen hata"}`);
				return;
			}
			
			if (data?.Sonuc) {
				setItems({ folders: data.Klasorler || [], files: data.Dosyalar || [] });
				setPath(dir);
			} else {
				console.error("[browse] failed Object", data);
				toast.error(`Klasör içeriği alınamadı: ${data?.Mesaj || "Bilinmeyen hata"}`);
			}
		} catch (error) {
			console.error("[browse] failed", error);
			toast.error("Klasör içeriği alınırken bir hata oluştu");
		} finally {
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

	return (
		<div className="px-6 py-5 mx-auto max-w-7xl space-y-4">
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
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
					{[...Array(8)].map((_, i) => (
						<Card key={`skeleton-${i}`} className="animate-pulse">
							<CardContent className="flex flex-col items-center gap-2 p-5">
								<div className="h-8 w-8 rounded-full bg-muted"></div>
								<div className="h-3 w-24 bg-muted rounded"></div>
							</CardContent>
						</Card>
					))}
				</div>
			) : view === "grid" ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
					{/* Folders */}
					{sortedFolders.map((f) => (
						<Card key={`f-${f.ID}`} className="group border border-border/50 hover:border-primary/30 overflow-hidden">
							<CardContent className="p-0">
								<button 
									onClick={() => goInto(f.Adi)} 
									className="w-full h-full flex flex-col items-center justify-center py-5 px-3"
									onContextMenu={handleContextMenu(f, "folder")}
								>
									<Folder className="h-10 w-10 text-primary mb-2" />
									<span className="text-sm truncate w-full text-center">{f.Adi}</span>
								</button>
							</CardContent>
							<div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => goInto(f.Adi)}>Aç</DropdownMenuItem>
										<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Yeniden adlandır</DropdownMenuItem>
										<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Taşı</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => handleDelete(f)} className="text-red-600 focus:text-red-600">Sil</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</Card>
					))}

					{/* Files */}
					{sortedFiles.map((f) => (
						<Card key={`d-${f.ID}`} className="group border border-border/50 hover:border-primary/30 overflow-hidden">
							<CardContent className="p-0">
								<div 
									className="w-full h-full flex flex-col items-center justify-center py-5 px-3 cursor-pointer"
									onClick={() => toast.info("Dosya işlemleri henüz eklenmedi")}
									onContextMenu={handleContextMenu(f, "file")}
								>
									<FileIcon name={f.Adi} />
									<span className="text-sm truncate w-full text-center mt-2">{f.Adi}</span>
									<span className="text-[10px] text-muted-foreground mt-1">{formatBytes(f.Boyut)}</span>
								</div>
							</CardContent>
							<div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>İndir</DropdownMenuItem>
										<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Yeniden adlandır</DropdownMenuItem>
										<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Taşı</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => handleDelete(f)} className="text-red-600 focus:text-red-600">Sil</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</Card>
					))}
				</div>
			) : (
				// List view
				<div className="rounded-md border overflow-hidden">
					<div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-sm font-medium border-b">
						<div className="flex-1">İsim</div>
						<div className="w-32 text-center">Boyut</div>
						<div className="w-20 text-right">İşlemler</div>
					</div>

					<div className="divide-y divide-border/60">
						{/* Folders */}
						{sortedFolders.map((f) => (
							<div key={`f-${f.ID}`} className="group hover:bg-muted/40" onContextMenu={handleContextMenu(f, "folder")}>
								<div className="flex items-center justify-between px-3 py-3">
									<div className="flex-1 min-w-0">
										<button onClick={() => goInto(f.Adi)} className="flex items-center gap-3 max-w-full">
											<Folder className="h-5 w-5 text-primary shrink-0" />
											<span className="truncate group-hover:text-primary">{f.Adi}</span>
										</button>
									</div>
									<div className="w-32 text-center text-xs text-muted-foreground">
										-
									</div>
									<div className="w-20 flex justify-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => goInto(f.Adi)}>Aç</DropdownMenuItem>
												<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Yeniden adlandır</DropdownMenuItem>
												<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Taşı</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => handleDelete(f)} className="text-red-600 focus:text-red-600">Sil</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						))}

						{/* Files */}
						{sortedFiles.map((f) => (
							<div key={`d-${f.ID}`} className="group hover:bg-muted/40" onContextMenu={handleContextMenu(f, "file")}>
								<div className="flex items-center justify-between px-3 py-3">
									<div className="flex-1 min-w-0 flex items-center gap-3">
										<FileIcon name={f.Adi} />
										<span className="truncate">{f.Adi}</span>
									</div>
									<div className="w-32 text-center text-xs text-muted-foreground">
										{formatBytes(f.Boyut)}
									</div>
									<div className="w-20 flex justify-end">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>İndir</DropdownMenuItem>
												<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Yeniden adlandır</DropdownMenuItem>
												<DropdownMenuItem onClick={() => toast.info("İşlev henüz eklenmedi")}>Taşı</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => handleDelete(f)} className="text-red-600 focus:text-red-600">Sil</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						))}
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