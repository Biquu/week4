"use client";

import { Menu, Bell, Search, User, LogOut, Settings, ChevronDown, Upload, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Sidebar from "./Sidebar";

export default function Header({ onToggleSidebar }) {
	const router = useRouter();
	const logoutStore = useAuthStore((s) => s.logout);
	
	async function doLogout() {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			toast.success("Başarıyla çıkış yapıldı");
		} finally {
			logoutStore();
			router.push("/login");
		}
	}
	return (
		<header className="h-16 border-b bg-background/90 sticky top-0 z-20 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 shadow-sm">
			<div className="h-full px-4 md:px-6 flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
				<div className="flex items-center gap-3">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden opacity-0 pointer-events-none">
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-72">
							<Sidebar />
						</SheetContent>
					</Sheet>
									
				</div>
				
				<div className="flex-1"></div>

				<div className="flex items-center gap-3">
					
					
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="gap-2 pl-2 pr-2.5 rounded-full border-0 hover:bg-muted/50">
								<Avatar className="h-8 w-8 ring-2 ring-primary/20">
									<AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">DD</AvatarFallback>
								</Avatar>
								<div className="flex items-center gap-1 hidden md:flex">
									<span className="text-sm font-medium">Test Kullanıcı</span>
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<div className="flex items-center gap-3 p-3 mb-1 bg-muted/30 rounded-md mx-2 mt-1">
								<Avatar className="h-10 w-10 ring-2 ring-primary/20">
									<AvatarFallback className="bg-primary/10 text-primary font-medium">DD</AvatarFallback>
								</Avatar>
								<div className="grid gap-0.5">
									<p className="text-sm font-medium">Test Kullanıcı</p>
									<p className="text-xs text-muted-foreground">test@example.com</p>
								</div>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<User className="mr-2 h-4 w-4" />
								<span>Profil</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Settings className="mr-2 h-4 w-4" />
								<span>Ayarlar</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={doLogout} className="text-red-600 focus:text-red-600">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Çıkış Yap</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}


