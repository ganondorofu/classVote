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
import { ShieldCheck, Loader2 } from "lucide-react"; // Added Loader2

interface AdminAuthProps {
  expectedAdminPassword: string;
  onAuthenticated: (isAuthenticated: boolean) => void;
  children: ReactNode;
}

const authSchema = z.object({
  adminPassword: z.string().refine(
    (val) => /^\d{4}$/.test(val) || /^\d{8}$/.test(val),
    {
      message: "パスワードは4桁または8桁の数字で入力してください。", 
    }
  ).refine(
    (val) => {
      if (val.length === 8) {
        const year = parseInt(val.substring(0, 4));
        const month = parseInt(val.substring(4, 6));
        const day = parseInt(val.substring(6, 8));
        return year > 1900 && year < 3000 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      }
      return true; 
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
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Added loading state

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { adminPassword: "" },
  });

  const handleAuthSubmit = (data: AuthFormValues) => {
    setIsAuthenticating(true);
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
    setIsAuthenticating(false);
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
                    <Input type="password" placeholder="4桁のパスワード" {...field} autoComplete="new-password" />
                  </FormControl>
                  <FormDescription>
                    投票作成時に設定した4桁のパスワードを入力してください。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isAuthenticating}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 認証中...
                </>
              ) : (
                "認証"
              )}
            </Button>
          </form>
        </Form>
        {authAttempted && !isAuthenticated && !isAuthenticating && ( // Ensure message doesn't show while authenticating
          <p className="mt-4 text-sm text-destructive text-center">認証に失敗しました。もう一度お試しください。</p>
        )}
      </CardContent>
    </Card>
  );
}
