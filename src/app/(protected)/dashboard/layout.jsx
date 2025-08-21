"use client";

import React from "react";
import Sidebar from "@/components/app/Sidebar";
import Header from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }) {
	const [collapsed, setCollapsed] = React.useState(false);
	return (
		<div className="min-h-svh flex relative overflow-x-hidden">
			<Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
			<div className={`flex-1 flex flex-col ${collapsed ? 'ml-24' : 'ml-80'} transition-[margin] duration-300`}>
				<Header onToggleSidebar={() => setCollapsed((s) => !s)} />
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}


