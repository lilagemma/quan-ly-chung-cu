'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useComplaints, Complaint, ComplaintsResponse } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, ClipboardList, RefreshCw, CheckCircle , Edit,BarChart3,
  Trash2,} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";




export default function ComplaintsPage() {
  const { toast } = useToast();
  const { getMyComplaints, loading, updateComplaint, deleteComplaint } =
    useComplaints();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(
    null,
  );
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(
    null,
  );

  // Fetch complaints
  useEffect(() => {
    fetchComplaints(1);
  }, [statusFilter]);

  // const fetchComplaints = async (page: number) => {
  //   setDataLoading(true);
  //   try {
  //     const status = statusFilter === "all" ? undefined : statusFilter;
  //     const response = await getMyComplaints(page, 10, status);
  //     setComplaints(response.data);
  //     setPagination(response.pagination);
  //   } catch (error: any) {
  //     toast({
  //       title: "Lỗi",
  //       description: error.message || "Không thể tải danh sách khiếu nại",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setDataLoading(false);
  //   }
  // };
  const fetchComplaints = async (page: number, customStatus?: string) => {
    setDataLoading(true);
    try {
      // Xác định status cần gửi lên API
      let statusValue: string | undefined;
      if (customStatus !== undefined) {
        // Nếu có customStatus (click từ card), dùng nó
        statusValue = customStatus === "all" ? undefined : customStatus;
      } else {
        // Nếu không (từ dropdown hoặc useEffect), dùng statusFilter
        statusValue = statusFilter === "all" ? undefined : statusFilter;
      }

      const response = await getMyComplaints(page, 10, statusValue);
      setComplaints(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách khiếu nại",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const openDetailDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Đang chờ
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Đang xử lý
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Đã giải quyết
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusStats = () => {
    const stats = { open: 0, "in-progress": 0, resolved: 0 };
    complaints.forEach((c) => {
      if (c.status in stats) stats[c.status as keyof typeof stats]++;
    });
    return stats;
  };

  const openEditDialog = (complaint: Complaint) => {
    if (complaint.status !== "open") {
      toast({
        title: "Không cho phép",
        description: 'Chỉ được sửa khiếu nại đang ở trạng thái "Đang chờ"',
        variant: "destructive",
      });
      return;
    }
    setEditingComplaint(complaint);
    setEditDescription(complaint.description);
    setEditImage(null);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (complaint: Complaint) => {
    if (complaint.status !== "open") {
      toast({
        title: "Không cho phép",
        description: 'Chỉ được xóa khiếu nại đang ở trạng thái "Đang chờ"',
        variant: "destructive",
      });
      return;
    }
    setComplaintToDelete(complaint);
    setDeleteDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingComplaint) return;
    if (!editDescription.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả khiếu nại",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("description", editDescription.trim());
    if (editImage) {
      formData.append("image", editImage);
    }

    try {
      console.log("🔄 Đang cập nhật khiếu nại ID:", editingComplaint._id); // Debug
      await updateComplaint(editingComplaint._id, formData);

      toast({
        title: "Thành công",
        description: "Khiếu nại đã được cập nhật",
      });

      setEditDialogOpen(false);
      setEditingComplaint(null);
      fetchComplaints(pagination.current); // Refresh danh sách
    } catch (error: any) {
      console.error("❌ Lỗi cập nhật:", error); // Debug
      // Toast đã được xử lý trong hook, nhưng thêm fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!complaintToDelete) return;
    try {
      await deleteComplaint(complaintToDelete._id);
      setDeleteDialogOpen(false);
      fetchComplaints(pagination.current);
    } catch (error) {
      // Toast đã được xử lý trong hook
    }
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Khiếu nại của tôi
          </h1>
          <p className="text-gray-600 mt-1">
            Xem và theo dõi khiếu nại của bạn
          </p>
        </div>
        <Link href="/complaints/new">
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Plus className="w-4 h-4" /> Tạo khiếu nại mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
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
        <Card className="border-0 shadow-sm">
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
        <Card className="border-0 shadow-sm">
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
      </div> */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> */}

      {/* </div> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tất cả */}
        <Card
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md"
          onClick={() => fetchComplaints(1, "all")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.open + stats["in-progress"] + stats.resolved}
                </p>
                <p className="text-xs text-slate-500">Tổng số khiếu nại</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Đang chờ */}
        <Card
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md"
          onClick={() => fetchComplaints(1, "open")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.open}
                </p>
                <p className="text-xs text-slate-500">Đang chờ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Đang xử lý */}
        <Card
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md"
          onClick={() => fetchComplaints(1, "in-progress")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats["in-progress"]}
                </p>
                <p className="text-xs text-slate-500">Đang xử lý</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Đã giải quyết */}
        <Card
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md"
          onClick={() => fetchComplaints(1, "resolved")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.resolved}
                </p>
                <p className="text-xs text-slate-500">Đã giải quyết</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Lịch sử khiếu nại</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="open">Đang chờ</SelectItem>
              <SelectItem value="in-progress">Đang xử lý</SelectItem>
              <SelectItem value="resolved">Đã giải quyết</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
                  ? "Bạn không có khiếu nại nào với trạng thái này."
                  : "Bạn chưa gửi bất kỳ khiếu nại nào."}
              </p>
              <Link href="/complaints/new">
                <Button className="mt-4">Nộp đơn khiếu nại</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop: bảng */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint._id}>
                        <TableCell className="max-w-md">
                          <div className="flex items-center gap-3">
                            {complaint.image_url && (
                              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={
                                    complaint.image_url.startsWith("http")
                                      ? complaint.image_url
                                      : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${complaint.image_url.replace(/\\/g, "/")}`
                                  }
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
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(complaint.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(complaint)}
                            >
                              Xem
                            </Button>
                            {complaint.status === "open" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => openEditDialog(complaint)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => openDeleteDialog(complaint)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: thẻ card */}
              <div className="block sm:hidden space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          {complaint.image_url && (
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  complaint.image_url.startsWith("http")
                                    ? complaint.image_url
                                    : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${complaint.image_url.replace(/\\/g, "/")}`
                                }
                                alt="Complaint"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <p className="text-gray-800 text-sm flex-1">
                            {complaint.description}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                          {getStatusBadge(complaint.status)}
                          <span className="text-xs text-gray-400">
                            {formatDate(complaint.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(complaint)}
                      >
                        Xem chi tiết
                      </Button>
                      {complaint.status === "open" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600"
                            onClick={() => openEditDialog(complaint)}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => openDeleteDialog(complaint)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Xóa
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang */}
              {pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-gray-500">
                    Hiển thị {(pagination.current - 1) * 10 + 1} đến{" "}
                    {Math.min(pagination.current * 10, pagination.total)} trong
                    tổng số {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === 1}
                      onClick={() => fetchComplaints(pagination.current - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === pagination.pages}
                      onClick={() => fetchComplaints(pagination.current + 1)}
                    >
                      Kế tiếp
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khiếu nại</DialogTitle>
            <DialogDescription>
              Đã gửi vào{" "}
              {selectedComplaint && formatDate(selectedComplaint.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Trạng thái:</span>
                {getStatusBadge(selectedComplaint.status)}
              </div>

              {/* {selectedComplaint.image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <Image
                    src={selectedComplaint.image_url}
                    alt="Ảnh khiếu nại"
                    fill
                    className="object-contain"
                  />
                </div>
              )} */}
              {selectedComplaint?.image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <Image
                    src={
                      selectedComplaint.image_url.startsWith("http")
                        ? selectedComplaint.image_url
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${selectedComplaint.image_url.replace(/\\/g, "/")}`
                    }
                    alt="Complaint"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Mô tả
                </h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.admin_notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Ghi chú của quản trị
                  </h4>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    {selectedComplaint.admin_notes}
                  </p>
                </div>
              )}

              {selectedComplaint.resolved_by && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Được giải quyết bởi
                  </h4>
                  <p className="text-gray-900">
                    {selectedComplaint.resolved_by.name} (
                    {selectedComplaint.resolved_by.email})
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Cập nhật lần cuối: {formatDate(selectedComplaint.updated_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== EDIT DIALOG ==================== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa khiếu nại</DialogTitle>
            <DialogDescription>
              Chỉ có thể sửa khiếu nại đang chờ xử lý
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="description">Mô tả khiếu nại</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                placeholder="Nhập nội dung khiếu nại..."
              />
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh mới (tùy chọn)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !editDescription.trim()}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE CONFIRM DIALOG ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khiếu nại</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc muốn xóa khiếu nại
              này?
            </DialogDescription>
          </DialogHeader>

          {complaintToDelete && (
            <p className="text-sm text-gray-600 py-2 line-clamp-2">
              "{complaintToDelete.description}"
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- CSS RESPONSIVE CHO MOBILE --- */}
      <style jsx>{`
        @media (max-width: 640px) {
          /* Bảng: cho phép cuộn ngang + giảm padding */
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
          }
          /* Ghi đè padding của shadcn table */
          .overflow-x-auto table td,
          .overflow-x-auto table th {
            padding: 0.5rem 0.25rem !important;
            font-size: 0.75rem !important;
          }
          /* Cột mô tả: cho phép xuống dòng */
          .overflow-x-auto table td:first-child {
            max-width: 180px !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          /* Cột ngày tháng: chữ nhỏ hơn */
          .overflow-x-auto table td:nth-child(3),
          .overflow-x-auto table th:nth-child(3) {
            font-size: 0.7rem !important;
            white-space: normal !important;
          }
          /* Nút hành động: xếp dọc, full width */
          .action-buttons {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          .action-buttons button {
            width: 100% !important;
            font-size: 0.75rem !important;
            padding: 0.375rem 0.5rem !important;
            height: auto !important;
          }
          /* Header của bảng: thu nhỏ font */
          .overflow-x-auto table th {
            font-size: 0.7rem !important;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}
