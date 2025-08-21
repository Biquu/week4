"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, ChevronRight, ChevronLeft, Upload, Download, FolderPlus, FilePlus, Share2, Server, Shield, Home, File, Folder } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const navGroups = [
	{
		title: "ANA MENÜ",
		items: [
			{ label: "Duvarım", href: "/dashboard", icon: Home, action: () => {} },
		],
	}
];

export default function Sidebar({ collapsed = false, onToggle }) {
	const pathname = usePathname();
	const router = useRouter();
	const logoutStore = useAuthStore((s) => s.logout);
	const widthClass = collapsed ? "w-24" : "w-80";
	return (
		<aside className={`flex flex-col ${widthClass} shrink-0 border-r border-r-muted/60 bg-background/60 transition-[width] duration-300 shadow-sm fixed top-0 bottom-0 left-0 z-40`}>
			<div className="h-24 px-2 flex items-center justify-center border-b border-b-muted/40">
				<Link href="/dashboard" className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity w-full justify-center">
					<div className="relative mx-auto ml-6 h-16 w-16 overflow-hidden rounded-sm">
						<Image src="/logo.png" alt="logo" fill className="object-contain" />
					</div>
					
				</Link>
				<Button 
					variant="ghost" 
					size="icon" 
					className="ml-auto h-8 w-8 flex-shrink-0" 
					onClick={onToggle}
				>
					{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
				</Button>
			</div>
			<div className="flex-1 flex flex-col justify-between overflow-hidden">
				<nav className="py-4 px-2 space-y-5 overflow-y-auto flex-1">
					{navGroups.map((group, idx) => (
						<div key={idx} className="space-y-1.5">
							{group.title && !collapsed ? (
								<p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground px-3 pb-1 mb-1">{group.title}</p>
							) : collapsed && idx > 0 ? <div className="h-px bg-border/60 my-3 mx-1"></div> : null}
							<ul className="space-y-0.5">
								{group.items.map((it) => {
									const Icon = it.icon;
									const active = pathname === it.href;
									return (
										<li key={it.label}>
																				<a
										href={it.href}
										onClick={(e) => {
											e.preventDefault();
											it.action(router);
											if (it.href.startsWith("/")) {
												router.push(it.href);
											}
										}}
										className={`flex items-center gap-3 ${collapsed ? "px-2 justify-center" : "px-4"} py-2 text-sm transition-all ${
											active 
											? "bg-[#e7f5fc] text-[#0076bc] font-medium" 
											: "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
										}`}
									>
										<div className={`flex items-center justify-center ${collapsed ? "h-8 w-8 rounded-md bg-muted/50" : ""}`}>
											<Icon className={`h-5 w-5 ${active ? "text-[#0076bc]" : "text-muted-foreground"}`} />
										</div>
										{!collapsed && <span>{it.label}</span>}
									</a>
										</li>
									);
								})}
							</ul>
						</div>
					))}

														{collapsed ? (
					<div className="px-2 pt-4">
						<Button 
							variant="default" 
							className="w-full aspect-square flex items-center justify-center bg-[#0076bc] hover:bg-[#0076bc]/90" 
							onClick={() => {
								// Dosya yükleme işlevi
								const input = document.createElement('input');
								input.type = 'file';
								input.onchange = (e) => {
									if (e.target.files.length > 0) {
										const file = e.target.files[0];
										console.log(`Dosya yükleme: ${file.name}`);
										toast.success(`${file.name} yükleme başlatıldı`);
										// API çağrısı yapılacak
									}
								};
								input.click();
							}}
						>
							<Upload className="h-5 w-5" />
						</Button>
					</div>
				) : (
						<div className="px-3 pt-4">
													<Button 
							variant="default" 
							className="w-full justify-center gap-2 bg-[#0076bc] hover:bg-[#0076bc]/90 text-base py-3" 
							onClick={() => {
								// Dosya yükleme işlevi
								const input = document.createElement('input');
								input.type = 'file';
								input.onchange = (e) => {
									if (e.target.files.length > 0) {
										const file = e.target.files[0];
										console.log(`Dosya yükleme: ${file.name}`);
										toast.success(`${file.name} yükleme başlatıldı`);
										// API çağrısı yapılacak
									}
								};
								input.click();
							}}
						>
							<Upload className="h-4 w-4" />
							<span>Dosya Yükle</span>
						</Button>
						</div>
					)}
				</nav>

				{/* Profile section at bottom */}
				<div className="mt-auto border-t py-2 px-3">
					{collapsed ? (
						<div className="flex flex-col items-center gap-2">
							<div className="flex justify-center mb-1">
								<Avatar className="h-10 w-10">
									<AvatarFallback className="bg-[#0076bc]/10 text-[#0076bc]">T</AvatarFallback>
								</Avatar>
							</div>
							<Button 
								variant="ghost" 
								size="sm" 
								className="h-8 w-full flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
								onClick={async () => {
									try {
										await fetch("/api/auth/logout", { method: "POST" });
									} finally {
										logoutStore();
										router.push("/login");
									}
								}}
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-3 px-4 py-1">
							<Avatar className="h-7 w-7">
								<AvatarFallback className="bg-[#0076bc]/10 text-[#0076bc] text-xs">T</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium">Test Kullanıcı</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
										<ChevronRight className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem onClick={async () => {
										try {
											await fetch("/api/auth/logout", { method: "POST" });
										} finally {
											logoutStore();
											router.push("/login");
										}
									}} className="text-red-600">
										<LogOut className="mr-2 h-4 w-4" />
										<span>Çıkış Yap</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}


