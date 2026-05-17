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

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    flat_no: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingManager, setCheckingManager] = useState(true);

  // Check if manager exists, if not redirect to manager-setup
  useEffect(() => {
    const checkManager = async () => {
      try {
        const response = await api.get('/auth/manager-exists');
        if (!response.data.data?.exists) {
          router.push('/manager-setup');
        }
      } catch (err) {
        console.error("Quản lý kiểm tra lỗi:", err);
      } finally {
        setCheckingManager(false);
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
    setSuccess('');
    
    // Validation
    const { name, email, password, confirmPassword, flat_no, phone } = formData;
    
    if (!name || !email || !password || !confirmPassword || !flat_no || !phone) {
      setError("Vui lòng điền đầy đủ thông tin vào tất cả các trường.");
      return;
    }

    if (!email.includes('@')) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Vui lòng nhập số điện thoại hợp lệ gồm 10 chữ số.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        flat_no,
        phone,
      });
      
      if (response.data.success) {
        setSuccess(
          "Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...",
        );
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.data.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Đăng ký không thành công. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth/manager status
  if (authLoading || checkingManager) {
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

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-center">
          Đăng ký làm cư dân của MyCT2
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên đầy đủ</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nhập đầy đủ họ của bạn"
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
                placeholder="Số có 10 chữ số"
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
              placeholder="Xác nhận mật khẩu của bạn"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Bạn đã có tài khoản chưa?{" "}
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
