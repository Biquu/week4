"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
	KullaniciAdi: z.string().min(1, "KullaniciAdi zorunlu"),
	Sifre: z.string().min(1, "Sifre zorunlu"),
});

export default function LoginPage() {
	const router = useRouter();
	const setTicket = useAuthStore((s) => s.setTicket);

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
			const res = await fetch("/api/auth/ticket", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			const data = await res.json();
			if (data?.Sonuc && data?.ID) {
				setTicket(data.ID);
				router.push("/dashboard");
				return;
			}
			toast.error("Giriş bilgileri hatalı");
		} catch (e) {
			toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
		} finally {
			reset({ Sifre: "" });
		}
	};

	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Giriş Yap</CardTitle>
					<CardDescription>DivvyDrive yönetim paneline giriş yapın</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="KullaniciAdi">Kullanıcı Adı</Label>
							<Input id="KullaniciAdi" autoComplete="username" {...register("KullaniciAdi")} disabled={isSubmitting} />
							{errors.KullaniciAdi && (
								<p className="text-sm text-red-600">{errors.KullaniciAdi.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="Sifre">Şifre</Label>
							<Input id="Sifre" type="password" autoComplete="current-password" {...register("Sifre")} disabled={isSubmitting} />
							{errors.Sifre && <p className="text-sm text-red-600">{errors.Sifre.message}</p>}
						</div>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Gönderiliyor..." : "Giriş Yap"}
						</Button>
					</form>
				</CardContent>
				<CardFooter>
					<p className="text-xs text-muted-foreground">Test/Test kullanıcı bilgilerini kullanabilirsiniz.</p>
				</CardFooter>
			</Card>
		</div>
	);
}


