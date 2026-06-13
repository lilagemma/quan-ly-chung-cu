'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  RefreshCw,
  X,
  Eye,
  Copy,
  Key,
} from 'lucide-react';
import Link from "next/link";


interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  flat_no: string;
  role: 'manager' | 'admin' | 'resident' | 'watchman';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [watchmanDialogOpen, setWatchmanDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Watchman form
  const [watchmanForm, setWatchmanForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Created watchman credentials
  const [createdWatchman, setCreatedWatchman] = useState<{ name: string; email: string; password: string } | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);

  const isManager = user?.role === 'manager';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
      
      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'manager':
        return { label: 'Quản lý', icon: Crown, color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'admin':
        return { label: 'Quản trị viên', icon: Shield, color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'watchman':
        return { label: 'Bảo vệ', icon: Shield, color: 'bg-green-100 text-green-700 border-green-200' };
      default:
        return { label: 'Cư dân', icon: User, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.flat_no?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    );
  });

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setActionLoading(true);
      await api.put(`/users/${selectedUser._id}/role`, { role: newRole });
      toast({
        title: "Đã cập nhật vai trò",
        description: `Vai trò của ${selectedUser.name} đã được cập nhật thành ${newRole}`,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Cập nhật vai trò thất bại",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/users/${selectedUser._id}`);
      toast({
        title: "Đã vô hiệu hóa người dùng",
        description: `Tài khoản của ${selectedUser.name} đã bị vô hiệu hóa`,
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Vô hiệu hóa người dùng thất bại",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWatchman = async () => {
    if (!watchmanForm.name || !watchmanForm.email || !watchmanForm.phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await api.post('/users/watchman', watchmanForm);
      
      // Store the credentials and show in dialog
      setCreatedWatchman({
        name: response.data.data.user.name,
        email: response.data.data.user.email,
        password: response.data.data.tempPassword,
      });
      
      setWatchmanDialogOpen(false);
      setWatchmanForm({ name: '', email: '', phone: '' });
      setCredentialsDialogOpen(true);
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Tạo bảo vệ thất bại",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Quản lý người dùng
          </h1>
          <p className="text-slate-500 mt-1">
            Xem và quản lý thành viên của chung cư
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          {isManager && (
            <Button size="sm" onClick={() => setWatchmanDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" />
              Thêm bảo vệ
            </Button>
          )}
          <Link href="/admin/statistics">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-1" />
              Thống kê cư dân
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {pagination?.total || 0}
                </p>
                <p className="text-xs text-slate-500">Tổng số người dùng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.role === "admin").length}
                </p>
                <p className="text-xs text-slate-500">Quản trị viên</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.is_active).length}
                </p>
                <p className="text-xs text-slate-500">Đang hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.role === "resident").length}
                </p>
                <p className="text-xs text-slate-500">Cư dân</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm theo tên, email, căn hộ hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="resident">Cư dân</SelectItem>
                  <SelectItem value="watchman">Bảo vệ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p>Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Căn hộ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const roleInfo = getRoleInfo(u.role);
                    const RoleIcon = roleInfo.icon;
                    return (
                      <TableRow key={u._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {u.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {u.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone className="w-3.5 h-3.5" />
                            {u.phone || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.flat_no ? (
                            <Badge variant="outline" className="bg-slate-50">
                              <MapPin className="w-3 h-3 mr-1" />
                              {u.flat_no}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleInfo.color}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.is_active ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Không hoạt động
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(u);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isManager && u.role !== "manager" && (
                              <>
                                {/* Ẩn nút cập nhật vai trò nếu user là bảo vệ */}
                                {u.role !== "watchman" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setNewRole(u.role);
                                      setRoleDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {u.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedUser.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <Badge
                    variant="outline"
                    className={getRoleInfo(selectedUser.role).color}
                  >
                    {getRoleInfo(selectedUser.role).label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Số điện thoại</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Căn hộ số</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.flat_no || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Trạng thái</p>
                  <p className="text-sm font-medium">
                    {selectedUser.is_active ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700"
                      >
                        Không hoạt động
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Tham gia từ</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString(
                      "vi-VN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật vai trò</DialogTitle>
            <DialogDescription>
              Thay đổi vai trò cho {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Chọn vai trò</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="resident">Cư dân</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateRole} disabled={actionLoading}>
              {actionLoading ? "Đang cập nhật..." : "Cập nhật vai trò"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Vô hiệu hóa người dùng
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn vô hiệu hóa {selectedUser?.name}? Hành động
              này sẽ ngăn họ truy cập hệ thống.
            </DialogDescription>
          </DialogHeader>
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Cảnh báo</AlertTitle>
            <AlertDescription className="text-red-700">
              Hành động này có thể được thay đổi bởi quản lý sau đó.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateUser}
              disabled={actionLoading}
            >
              {actionLoading ? "Đang vô hiệu hóa..." : "Vô hiệu hóa người dùng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Watchman Dialog */}
      <Dialog open={watchmanDialogOpen} onOpenChange={setWatchmanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản bảo vệ</DialogTitle>
            <DialogDescription>
              Thêm bảo vệ mới cho chung cư. Mật khẩu tạm thời sẽ được tạo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Họ tên</Label>
              <Input
                placeholder="Nhập tên bảo vệ"
                value={watchmanForm.name}
                onChange={(e) =>
                  setWatchmanForm({ ...watchmanForm, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Nhập địa chỉ email"
                value={watchmanForm.email}
                onChange={(e) =>
                  setWatchmanForm({ ...watchmanForm, email: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                placeholder="Nhập số điện thoại"
                value={watchmanForm.phone}
                onChange={(e) =>
                  setWatchmanForm({ ...watchmanForm, phone: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWatchmanDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateWatchman} disabled={actionLoading}>
              {actionLoading ? "Đang tạo..." : " Tạo bảo vệ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Watchman Credentials Dialog */}
      <Dialog
        open={credentialsDialogOpen}
        onOpenChange={setCredentialsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Đã tạo tài khoản bảo vệ
            </DialogTitle>
            <DialogDescription>
              Vui lòng lưu lại thông tin đăng nhập. Mật khẩu không thể lấy lại
              sau này.
            </DialogDescription>
          </DialogHeader>
          {createdWatchman && (
            <div className="space-y-4 py-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Key className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Quan trọng</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Chia sẻ thông tin này với bảo vệ. Họ nên đổi mật khẩu sau lần
                  đăng nhập đầu tiên.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-xs text-slate-500">Name</Label>
                  <p className="font-medium text-slate-900">
                    {createdWatchman.name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 flex-1">
                      {createdWatchman.email}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(createdWatchman.email);
                        toast({
                          title: "Đã sao chép!",
                          description: "Email đã được sao chép",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">
                    Mật khẩu tạm thời
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border rounded font-mono text-lg font-bold text-blue-600">
                      {createdWatchman.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => {
                        navigator.clipboard.writeText(createdWatchman.password);
                        toast({
                          title: "Đã sao chép!",
                          description: "Mật khẩu đã được sao chép",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setCredentialsDialogOpen(false);
                setCreatedWatchman(null);
              }}
              className="w-full"
            >
              Tôi đã lưu thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
