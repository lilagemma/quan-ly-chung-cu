"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGateLog, GateLogEntry } from "@/hooks/useGateLog";
import { ClipboardList, RefreshCw, Search } from "lucide-react";

export default function GateLogPage() {
  const { toast } = useToast();
  const { getHistory, markOutTime } = useGateLog();

  // Hàm lấy ngày hiện tại theo giờ địa phương, bỏ qua giờ
  const getTodayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getTodayLocal());
  const [entries, setEntries] = useState<GateLogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, inside: 0, exited: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "inside" | "exited">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Format YYYY-MM-DD cho input và API
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Parse từ YYYY-MM-DD sang Date local (00:00:00)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Hiển thị dd/mm/yyyy
  const formatDisplayDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchEntries = async (date: Date) => {
    setLoading(true);
    try {
      const formattedDate = formatLocalDate(date);
      const response = await getHistory(1, 500, formattedDate);
      const data = response.data;
      setEntries(data);
      const total = data.length;
      const inside = data.filter((e: GateLogEntry) => !e.out_time).length;
      const exited = data.filter((e: GateLogEntry) => e.out_time).length;
      setStats({ total, inside, exited });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(selectedDate);
  }, [selectedDate]);

  const handleMarkOut = async (entryId: string, visitorName: string) => {
    try {
      await markOutTime(entryId);
      toast({
        title: "Đã đánh dấu ra",
        description: `${visitorName} đã rời đi`,
      });
      fetchEntries(selectedDate);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (inTime: string, outTime: string | null) => {
    const start = new Date(inTime).getTime();
    const end = outTime ? new Date(outTime).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 60000);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} giờ ${mins} phút`;
  };

  // Lọc theo trạng thái (inside/outside/all)
  const filteredByStatus = entries.filter((entry) => {
    if (filter === "inside") return !entry.out_time;
    if (filter === "exited") return entry.out_time;
    return true;
  });

  // Tìm kiếm theo tên, căn hộ, biển số
  const searchedEntries = filteredByStatus.filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      entry.visitor_name.toLowerCase().includes(term) ||
      entry.flat_no_visiting.toLowerCase().includes(term) ||
      (entry.vehicle_number &&
        entry.vehicle_number.toLowerCase().includes(term))
    );
  });

  const isToday = (date: Date) => {
    const today = getTodayLocal();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleTodayClick = () => {
    setSelectedDate(getTodayLocal());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhật ký cổng ra vào
          </h1>
          <p className="text-gray-600">
            {isToday(selectedDate)
              ? "Hôm nay"
              : `Ngày ${formatDisplayDate(selectedDate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTodayClick}>
            Hôm nay
          </Button>
          <input
            type="date"
            value={formatLocalDate(selectedDate)}
            onChange={(e) => setSelectedDate(parseLocalDate(e.target.value))}
            className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className={`cursor-pointer transition-all ${filter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Tổng</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === "inside" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setFilter("inside")}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.inside}</p>
            <p className="text-xs text-gray-500">Đang ở bên trong</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === "exited" ? "ring-2 ring-gray-400" : ""}`}
          onClick={() => setFilter("exited")}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.exited}</p>
            <p className="text-xs text-gray-500">Đã rời đi</p>
          </CardContent>
        </Card>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Tìm theo tên, căn hộ hoặc biển số..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Danh sách */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {filter === "all" && "Tất cả khách"}
            {filter === "inside" && "Đang ở trong"}
            {filter === "exited" && "Đã rời đi"}
            {searchTerm && ` (kết quả: ${searchedEntries.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-20 bg-gray-100 rounded-lg"
                ></div>
              ))}
            </div>
          ) : searchedEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>
                {searchTerm
                  ? "Không tìm thấy kết quả phù hợp"
                  : "Không có dữ liệu cho ngày này"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchedEntries.map((entry) => (
                <div
                  key={entry._id}
                  className={`p-4 rounded-lg border ${
                    entry.out_time
                      ? "bg-gray-50 border-gray-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{entry.visitor_name}</p>
                        {!entry.out_time && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Đang ở trong
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">
                          {entry.flat_no_visiting}
                        </Badge>
                        <span>{entry.purpose}</span>
                        {entry.vehicle_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              {entry.vehicle_number}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Vào: {formatTime(entry.in_time)}</span>
                        {entry.out_time && (
                          <span>Ra: {formatTime(entry.out_time)}</span>
                        )}
                        <span className="font-medium">
                          ({getDuration(entry.in_time, entry.out_time)})
                        </span>
                      </div>
                    </div>
                    {!entry.out_time && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleMarkOut(entry._id, entry.visitor_name)
                        }
                      >
                        Đánh dấu ra cổng
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => fetchEntries(selectedDate)}
      >
        <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
      </Button>
    </div>
  );
}
