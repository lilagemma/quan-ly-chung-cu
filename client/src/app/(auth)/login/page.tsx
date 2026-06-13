'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, ArrowRight, Loader2, LogIn } from 'lucide-react';

import { requestNotificationPermission } from "@/firebase/notification";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin vào tất cả các trường.");
      return;
    }

    if (!email.includes('@')) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setLoading(true);
    
    try {
      const result = await login({ email, password });
      
      // if (result.success) {
      //   // Redirect based on user role
      //   if (result.user?.role === 'watchman') {
      //     router.push('/watchman');
      //   } else {
      //     router.push('/');
      //   }
      // } 
      if (result.success) {
        // lấy token nhận thông báo firebase
        const token = await requestNotificationPermission();

        console.log("FCM TOKEN:", token);

        if (token) {
          console.log("Đang gửi token lên server");

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/fcm-token`, {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              token: token,
            }),
          });
        }

        // Redirect based on user role
        if (result.user?.role === "watchman") {
          router.push("/watchman");
        } else {
          router.push("/");
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <p className="text-sm text-slate-500">Đang kiểm tra xác thực...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-slate-900">
          Chào mừng trở lại!
        </CardTitle>
        <CardDescription className="text-center text-slate-500">
          Đăng nhập vào tài khoản của bạn để tiếp tục.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-700"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Mật khẩu
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">hoặc</span>
            </div>
          </div>

          <p className="text-sm text-center text-slate-600">
            Bạn chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              Tạo tài khoản
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
