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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface AdminAuthProps {
  expectedAdminId: string;
  onAuthenticated: (isAuthenticated: boolean) => void;
  children: ReactNode;
}

const authSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required."),
});
type AuthFormValues = z.infer<typeof authSchema>;

export function AdminAuth({ expectedAdminId, onAuthenticated, children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { adminId: "" },
  });

  const handleAuthSubmit = (data: AuthFormValues) => {
    setAuthAttempted(true);
    if (data.adminId === expectedAdminId) {
      setIsAuthenticated(true);
      onAuthenticated(true);
    } else {
      form.setError("adminId", { type: "manual", message: "Incorrect Admin ID." });
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
          <ShieldCheck className="mr-2 h-7 w-7 text-primary" /> Admin Access
        </CardTitle>
        <CardDescription>Enter the creator's attendance number to manage this vote.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAuthSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="adminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Attendance Number</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter Admin ID" {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Authenticate
            </Button>
          </form>
        </Form>
        {authAttempted && !isAuthenticated && (
          <p className="mt-4 text-sm text-destructive text-center">Authentication failed. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
