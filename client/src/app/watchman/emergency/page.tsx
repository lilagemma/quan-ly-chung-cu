'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEmergency, Emergency } from '@/hooks/useEmergency';
import { AlertTriangle, Phone, Bell, CheckCircle, Clock, History, RefreshCw } from 'lucide-react';

export default function WatchmanEmergencyPage() {
  const { toast } = useToast();
  const {
    activeEmergency,
    loading,
    triggerLoading,
    resolveLoading,
    triggerEmergency,
    resolveEmergency,
    getEmergencyHistory,
    refresh,
  } = useEmergency();

  const [history, setHistory] = useState<Emergency[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [confirmTrigger, setConfirmTrigger] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Hàm chuyển đổi trạng thái khẩn cấp sang tiếng Việt
  const getEmergencyStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "ĐANG HOẠT ĐỘNG";
      case "resolved":
        return "ĐÃ XỬ LÝ";
      default:
        return status;
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getEmergencyHistory(1, 10);
      setHistory(response.data);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const handleTrigger = async () => {
    try {
      await triggerEmergency("Được kích hoạt bởi bảo vệ");
      toast({
        title: "Đã kích hoạt khẩn cấp!",
        description: "Tất cả cư dân đã được thông báo",
      });
      setConfirmTrigger(false);
    } catch (error: any) {
      toast({
        title: "Kích hoạt thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResolve = async () => {
    if (!activeEmergency) return;

    try {
      await resolveEmergency(
        activeEmergency._id,
        resolveNotes || "Đã xử lý bởi bảo vệ",
      );
      toast({
        title: "Đã xử lý khẩn cấp",
        description: "Trạng thái đã được cập nhật",
      });
      setShowResolveForm(false);
      setResolveNotes("");
    } catch (error: any) {
      toast({
        title: "Xử lý thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSince = (dateString: string) => {
    const start = new Date(dateString).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - start) / 60000);

    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Khẩn cấp thang máy</h1>
        <p className="text-gray-600">
          Theo dõi và quản lý các cảnh báo khẩn cấp
        </p>
      </div>

      {/* Current Status */}
      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-32 bg-gray-100 rounded"></div>
          </CardContent>
        </Card>
      ) : activeEmergency ? (
        /* Active Emergency Card */
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              KHẨN CẤP ĐANG DIỄN RA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold">
                    {activeEmergency.triggered_by.name}
                  </p>
                  <Badge variant="destructive" className="mt-1">
                    Phòng {activeEmergency.flat_no}
                  </Badge>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {getTimeSince(activeEmergency.triggered_at)}
                </div>
              </div>

              {activeEmergency.notes && (
                <p className="text-gray-700 text-sm mb-3">
                  Ghi chú: {activeEmergency.notes}
                </p>
              )}

              {activeEmergency.triggered_by.phone && (
                <a
                  href={`tel:${activeEmergency.triggered_by.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg font-medium"
                >
                  <Phone className="h-5 w-5" />
                  Gọi {activeEmergency.triggered_by.phone}
                </a>
              )}
            </div>

            {/* Resolve Section */}
            {!showResolveForm ? (
              <Button
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => setShowResolveForm(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Đánh dấu đã xử lý
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-white rounded-lg border">
                <textarea
                  placeholder="Ghi chú xử lý (ví dụ: Đã đưa người ra ngoài an toàn)"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResolveForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleResolve}
                    disabled={resolveLoading}
                  >
                    {resolveLoading ? "Đang xử lý..." : "Xác nhận đã xử lý"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* No Active Emergency */
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700">
              Mọi thứ đều an toàn
            </h3>
            <p className="text-gray-600 text-sm">
              Không có tình huống khẩn cấp
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trigger Emergency Button */}
      {!activeEmergency && !confirmTrigger && (
        <Card>
          <CardContent className="py-4">
            <Button
              className="w-full py-6 bg-red-600 hover:bg-red-700 text-lg"
              onClick={() => setConfirmTrigger(true)}
            >
              <Bell className="h-6 w-6 mr-2" />
              Kích hoạt khẩn cấp
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Chỉ sử dụng trong trường hợp khẩn cấp thực sự
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Trigger Dialog */}
      {confirmTrigger && (
        <Card className="border-2 border-yellow-500 bg-yellow-50">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">
              Xác nhận kích hoạt khẩn cấp
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Hệ thống sẽ ngay lập tức thông báo cho tất cả cư dân và ban quản
              lý. Chỉ tiếp tục nếu đây là tình huống khẩn cấp thực sự.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmTrigger(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleTrigger}
                disabled={triggerLoading}
              >
                {triggerLoading
                  ? "Đang kích hoạt..."
                  : "Xác nhận kích hoạt"}{" "}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency History */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Lịch sử gần đây
            </span>
            <span className="text-sm font-normal text-gray-500">
              {showHistory ? "▲ Ẩn" : "▼ Hiện"}
            </span>
          </CardTitle>
        </CardHeader>

        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 bg-gray-100 rounded"
                  ></div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Không có lịch sử khẩn cấp
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className={`p-3 rounded-lg border ${
                      item.status === "active"
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {item.triggered_by.name}
                          </p>
                          <Badge
                            variant={
                              item.status === "active"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {getEmergencyStatusLabel(item.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Phòng {item.flat_no} •{" "}
                          {formatDateTime(item.triggered_at)}
                        </p>
                      </div>
                    </div>
                    {item.status === "resolved" && item.resolved_at && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Được xử lý bởi {item.resolved_by?.name} lúc{" "}
                        {formatDateTime(item.resolved_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Refresh */}
      <Button variant="outline" className="w-full" onClick={refresh}>
        <RefreshCw className="w-4 h-4 mr-2" /> Làm mới trạng thái
      </Button>
    </div>
  );
}
