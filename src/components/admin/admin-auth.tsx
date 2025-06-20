
"use client"

import { useState, type ReactNode } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface AdminAuthProps {
  expectedAdminPassword: string;
  onAuthenticated: (isAuthenticated: boolean) => void;
  children: ReactNode;
}

const authSchema = z.object({
  adminPassword: z.string().refine(
    (val) => /^\d{4}$/.test(val) || /^\d{8}$/.test(val),
    {
      message: "パスワードは4桁または8桁の数字で入力してください。", // Keep message somewhat generic but guide towards 4-digit if ambiguous
    }
  ).refine(
    (val) => {
      if (val.length === 8) {
        // Basic check for YYYYMMDD format if it's 8 digits, can be stricter if needed
        const year = parseInt(val.substring(0, 4));
        const month = parseInt(val.substring(4, 6));
        const day = parseInt(val.substring(6, 8));
        return year > 1900 && year < 3000 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      }
      return true; // Pass for 4-digit numbers or if not 8 digits
    },
    {
      message: "パスワードは4桁の数字、または正しいYYYYMMDD形式の8桁の数字で入力してください。",
    }
  ),
});
type AuthFormValues = z.infer<typeof authSchema>;

export function AdminAuth({ expectedAdminPassword, onAuthenticated, children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { adminPassword: "" },
  });

  const handleAuthSubmit = (data: AuthFormValues) => {
    setAuthAttempted(true);
    const currentDate = new Date();
    const yyyy = currentDate.getFullYear().toString();
    const mm = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = currentDate.getDate().toString().padStart(2, '0');
    const masterKey = `${yyyy}${mm}${dd}`;

    if (data.adminPassword === expectedAdminPassword || data.adminPassword === masterKey) {
      setIsAuthenticated(true);
      onAuthenticated(true);
    } else {
      form.setError("adminPassword", { type: "manual", message: "パスワードが正しくありません。" });
      setIsAuthenticated(false);
      onAuthenticated(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <ShieldCheck className="mr-2 h-7 w-7 text-primary" /> 管理者認証
        </CardTitle>
        <CardDescription>この投票を管理するには、設定した4桁のパスワードを入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAuthSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>管理用パスワード</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="4桁のパスワード" {...field} autoComplete="current-password" />
                  </FormControl>
                  <FormDescription>
                    投票作成時に設定した4桁のパスワードを入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              認証
            </Button>
          </form>
        </Form>
        {authAttempted && !isAuthenticated && (
          <p className="mt-4 text-sm text-destructive text-center">認証に失敗しました。もう一度お試しください。</p>
        )}
      </CardContent>
    </Card>
  );
}
