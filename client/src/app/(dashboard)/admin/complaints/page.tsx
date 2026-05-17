'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useComplaints, Complaint, AdminComplaintsResponse } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, RefreshCw, CheckCircle, BarChart3 } from 'lucide-react';

export default function AdminComplaintsPage() {
  const { toast } = useToast();
  const { getAllComplaints, updateComplaintStatus } = useComplaints();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ open: 0, 'in-progress': 0, resolved: 0 });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch complaints
  useEffect(() => {
    fetchComplaints(1);
  }, [statusFilter]);

  const fetchComplaints = async (page: number) => {
    setDataLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await getAllComplaints(page, 10, status);
      setComplaints(response.data);
      setStats(response.stats);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Không thể lấy khiếu nại",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const openUpdateDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminNotes(complaint.admin_notes || '');
    setUpdateDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;

    setUpdateLoading(true);
    try {
      await updateComplaintStatus(
        selectedComplaint._id,
        newStatus as 'open' | 'in-progress' | 'resolved',
        adminNotes
      );

      toast({
        title: "Trạng thái đã được cập nhật",
        description: `Trạng thái khiếu nại đã được thay đổi thành ${newStatus}. Cư dân đã được thông báo.`,
      });

      setUpdateDialogOpen(false);
      fetchComplaints(pagination.current);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Không thể cập nhật trạng thái khiếu nại",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 1000,
    );
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Đang chờ</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang xử lý</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã giải quyết</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tất cả khiếu nại</h1>
        <p className="text-gray-600 mt-1">
          Giải quyết khiếu nại từ tất cả cư dân
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === "all" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-2xl font-bold">
                  {stats.open + stats["in-progress"] + stats.resolved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm ${statusFilter === "open" ? "ring-2 ring-amber-500" : ""}`}
          onClick={() => setStatusFilter("open")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang chờ</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.open}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm ${statusFilter === "in-progress" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setStatusFilter("in-progress")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang xử lý</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats["in-progress"]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm ${statusFilter === "resolved" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter("resolved")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đã giải quyết</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khiếu nại</CardTitle>
          <CardDescription>
            Nhấp vào khiếu nại để cập nhật trạng thái của khiếu nại đó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">📭</span>
              <h3 className="text-lg font-medium text-gray-900">
                Không tìm thấy khiếu nại nào.
              </h3>
              <p className="text-gray-500 mt-1">
                {statusFilter !== "all"
                  ? "Không có khiếu nại nào với trạng thái này."
                  : "Chưa có khiếu nại nào được gửi."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cư dân</TableHead>
                      <TableHead>Căn hộ</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow
                        key={complaint._id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {complaint.user_id.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {complaint.user_id.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{complaint.flat_no}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            {complaint.image_url && (
                              <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={complaint.image_url}
                                  alt="Complaint"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <p className="truncate">{complaint.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(complaint.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {getTimeAgo(complaint.created_at)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(complaint.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(complaint)}
                          >
                            Quản lý
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.current - 1) * 10 + 1} to{" "}
                    {Math.min(pagination.current * 10, pagination.total)} of{" "}
                    {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === 1}
                      onClick={() => fetchComplaints(pagination.current - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === pagination.pages}
                      onClick={() => fetchComplaints(pagination.current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý khiếu nại</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái và thêm ghi chú cho cư dân
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              {/* Complaint Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedComplaint.user_id.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Căn hộ {selectedComplaint.flat_no}
                    </p>
                  </div>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Đã gửi: {formatDate(selectedComplaint.created_at)}
                </p>
              </div>

              {/* Image */}
              {selectedComplaint.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={selectedComplaint.image_url}
                    alt="Ảnh khiếu nại"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-gray-500">Mô tả</Label>
                <p className="mt-1 text-gray-900 bg-white p-3 rounded-lg border">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="status">Cập nhật trạng thái</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Đang mở</SelectItem>
                    <SelectItem value="in-progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Ghi chú của quản trị</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Thêm ghi chú cho cư dân (cư dân sẽ thấy nội dung này trong email thông báo"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={updateLoading}
            >
              Hủy
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật trạng thái"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
