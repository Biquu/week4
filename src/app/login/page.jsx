"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { generateRequestId, logInfo, logError, redactShallow } from "@/lib/safe-logger";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { User, Lock, Eye, EyeOff, LogIn } from "lucide-react";

const schema = z.object({
	KullaniciAdi: z.string().min(1, "KullaniciAdi zorunlu"),
	Sifre: z.string().min(1, "Sifre zorunlu"),
});

export default function LoginPage() {
	const router = useRouter();
	const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
	const [showPassword, setShowPassword] = React.useState(false);

	const {
		handleSubmit,
		register,
		formState: { errors, isSubmitting },
		reset,
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: { KullaniciAdi: "", Sifre: "" },
	});

	const onSubmit = async (values) => {
		try {
			const requestId = generateRequestId();
			logInfo(`[login] (${requestId}) submit`, redactShallow(values));
			const res = await fetch("/api/auth/ticket", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			logInfo(`[login] (${requestId}) response received`, { status: res.status });
			const data = await res.json();
			if (data?.Sonuc) {
				setAuthenticated(true);
				router.push("/dashboard");
				return;
			}
			logError(`[login] (${requestId}) auth failed`);
			toast.error("Giriş bilgileri hatalı");
		} catch (e) {
			logError("[login] unhandled error", { message: String(e?.message || e) });
			toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
		} finally {
			reset({ Sifre: "" });
		}
	};

	return (
		<div className="min-h-svh flex items-center justify-center p-6 bg-background">
			<Card className="w-full max-w-md shadow-xl border-border/60">
				<CardHeader className="space-y-1">
					<div className="flex items-center justify-center mb-6">
						<Image src="/logo.png" alt="DivvyDrive" width={220} height={76} priority />
					</div>
					<CardTitle className="text-3xl text-center">Kullanıcı Girişi</CardTitle>
					<CardDescription className="text-neutral-500 text-center">DivvyDrive yönetim paneline erişim</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="KullaniciAdi">Kullanıcı Adı</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
								<Input id="KullaniciAdi" className="pl-10 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary" autoComplete="username" {...register("KullaniciAdi")} disabled={isSubmitting} />
							</div>
							{errors.KullaniciAdi && (
								<p className="text-sm text-red-600">{errors.KullaniciAdi.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="Sifre">Şifre</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
								<Input id="Sifre" type={showPassword ? "text" : "password"} className="pl-10 pr-11 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary" autoComplete="current-password" {...register("Sifre")} disabled={isSubmitting} />
								<button type="button" aria-label="Şifreyi göster" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{errors.Sifre && <p className="text-sm text-red-600">{errors.Sifre.message}</p>}
						</div>
						<Button type="submit" className="w-full h-12 text-base bg-primary text-primary-foreground hover:opacity-90" disabled={isSubmitting}>
							<LogIn className="mr-2 h-5 w-5" />
							{isSubmitting ? "Gönderiliyor..." : "Oturum Aç"}
						</Button>
					</form>
				</CardContent>
				<CardFooter>
					<p className="text-xs text-muted-foreground text-center w-full">Test hesabı: Kullanıcı Adı: Test — Şifre: 123456Abc.</p>
				</CardFooter>
			</Card>
		</div>
	);
}


