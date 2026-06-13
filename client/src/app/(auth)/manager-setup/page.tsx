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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FLAT_NUMBERS } from '@/lib/constants';
import api from '@/lib/api';

export default function ManagerSetupPage() {
  const router = useRouter();
  const { managerSetup, isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    flat_no: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [managerExists, setManagerExists] = useState<boolean | null>(null);

  // Check if manager already exists
  useEffect(() => {
    const checkManager = async () => {
      try {
        const response = await api.get('/auth/manager-exists');
        const exists = response.data.data?.exists;
        setManagerExists(exists);
        if (exists) {
          // Manager already exists, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Error checking manager:', err);
        setManagerExists(false);
      }
    };
    checkManager();
  }, [router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const { name, email, password, confirmPassword, flat_no, phone } = formData;
    
   if (!name || !email || !password || !confirmPassword || !flat_no || !phone) {
     setError("Vui lòng điền đầy đủ thông tin vào tất cả các trường.");
     return;
   }

   if (!email.includes("@")) {
     setError("Vui lòng nhập địa chỉ email hợp lệ.");
     return;
   }

   if (password.length < 6) {
     setError("Mật khẩu phải có ít nhất 6 ký tự.");
     return;
   }

   if (password !== confirmPassword) {
     setError("Mật khẩu xác nhận không khớp.");
     return;
   }

   if (!/^\d{10}$/.test(phone)) {
     setError("Vui lòng nhập số điện thoại gồm 10 chữ số hợp lệ.");
     return;
   }

    setLoading(true);
    
    try {
      const result = await managerSetup({
        name,
        email,
        password,
        flat_no,
        phone,
      });
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Thiết lập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking status
  if (authLoading || managerExists === null) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If manager exists, show message (will redirect)
  if (managerExists) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">
            "Quản lý đã được đăng ký. Đang chuyển hướng đến trang đăng nhập..."
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Thiết lập tài khoản Quản lý
        </CardTitle>
        <CardDescription className="text-center">
          Thiết lập tài khoản quản lý đầu tiên cho MyCT2
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Alert className="border-blue-500 bg-blue-50 text-blue-700">
            <AlertDescription>
              👋 Chào mừng! Là người dùng đầu tiên, bạn sẽ được đăng ký với vai
              trò Quản lý và có toàn quyền quản trị.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nhập họ và tên của bạn"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat_no">Số căn hộ</Label>
              <Select
                value={formData.flat_no}
                onValueChange={(value) => handleChange("flat_no", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn căn hộ" />
                </SelectTrigger>
                <SelectContent>
                  {FLAT_NUMBERS.map((flat) => (
                    <SelectItem key={flat} value={flat}>
                      {flat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Số điện thoại 10 chữ số"
                value={formData.phone}
                onChange={(e) =>
                  handleChange(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Xác nhận lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang thiết lập..." : "Hoàn tất thiết lập"}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Đã có tài khoản quản lý?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
