'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGateLog, GateLogEntry } from '@/hooks/useGateLog';
import { useEmergency } from '@/hooks/useEmergency';
import EmergencyButton from '@/components/dashboard/EmergencyButton';
import { Siren, ClipboardEdit, Clock, LogOut as LogOutIcon } from 'lucide-react';

export default function WatchmanDashboardPage() {
  const { toast } = useToast();
  const { createEntry, getTodayEntries, markOutTime } = useGateLog();
  const { activeEmergency, triggerEmergency, triggerLoading } = useEmergency();

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Today's entries state
  const [entries, setEntries] = useState<GateLogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, inside: 0, exited: 0 });
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Generate flat options
  const flatOptions: string[] = [];
  for (let floor = 1; floor <= 4; floor++) {
    for (let unit = 1; unit <= 10; unit++) {
      flatOptions.push(`${floor}0${unit}`.slice(-3));
    }
  }

  const fetchEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const response = await getTodayEntries();
      setEntries(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setEntriesLoading(false);
    }
  }, [getTodayEntries]);

  // Fetch today's entries
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim() || !flatNo || !purpose.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền tên khách, số căn hộ và mục đích",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await createEntry(visitorName, flatNo, purpose, vehicleNumber || undefined);
      
      toast({
        title: "Đã ghi nhận",
        description: `${visitorName} đến căn hộ ${flatNo}`,
      });

      // Reset form
      setVisitorName('');
      setFlatNo('');
      setPurpose('');
      setVehicleNumber('');

      // Refresh entries
      fetchEntries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log entry';
      toast({
        title: "Ghi nhận thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkOut = async (entryId: string, visitorName: string) => {
    try {
      await markOutTime(entryId);
      toast({
        title: "Đã đánh dấu ra",
        description: `${visitorName} đã rời đi`,
      });
      fetchEntries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark out';
      toast({
        title: "Đánh dấu ra thất bại",
        description: errorMessage,
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

  // Get only visitors still inside (last 5)
  const visitorsInside = entries.filter(e => !e.out_time).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Emergency Button - Always visible at top */}
      <Card
        className={`border-0 shadow-sm ${activeEmergency ? "border-red-500 bg-red-50" : ""}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Siren className="w-5 h-5 text-red-500" /> Khẩn cấp thang máy
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {activeEmergency
                  ? `Cảnh báo từ phòng ${activeEmergency.flat_no}`
                  : "Nhấn để gửi cảnh báo cho mọi người"}
              </p>
            </div>
            <EmergencyButton
              onTrigger={triggerEmergency}
              hasActiveEmergency={!!activeEmergency}
              triggerLoading={triggerLoading}
              userFlat="Bảo vệ"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Entry Form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-blue-600" /> Ghi nhận nhanh
          </CardTitle>
          <CardDescription>Thêm lượt khách mới</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="visitorName"> Tên khách *</Label>
                <Input
                  id="visitorName"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Nhập tên khách"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="flatNo">Số căn hộ *</Label>
                <Select
                  value={flatNo}
                  onValueChange={setFlatNo}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatOptions.map((flat) => (
                      <SelectItem key={flat} value={flat}>
                        {flat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purpose">Mục đích *</Label>
                <Select
                  value={purpose}
                  onValueChange={setPurpose}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delivery"> Giao hàng</SelectItem>

                    <SelectItem value="Guest">Khách</SelectItem>

                    <SelectItem value="Maid">Giúp việc</SelectItem>

                    <SelectItem value="Plumber">Thợ sửa nước</SelectItem>

                    <SelectItem value="Electrician">Thợ điện</SelectItem>

                    <SelectItem value="Cab">Taxi</SelectItem>

                    <SelectItem value="Other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="vehicleNumber">
                  Biển số xe (không bắt buộc)
                </Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(e.target.value.toUpperCase())
                  }
                  placeholder="VD: GJ05XX1234"
                  disabled={submitting}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang ghi nhận..." : "Ghi nhận vào cổng"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Hôm nay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.inside}</p>
            <p className="text-xs text-gray-500">Đang ở trong</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.exited}</p>
            <p className="text-xs text-gray-500">Đã rời đi</p>
          </CardContent>
        </Card>
      </div>

      {/* Visitors Inside */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Khách đang ở trong</CardTitle>
            <Link href="/watchman/gate-log">
              <Button variant="ghost" size="sm">
                Xem tất cả →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-gray-100 rounded-lg"
                ></div>
              ))}
            </div>
          ) : visitorsInside.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <span className="text-3xl mb-2 block">👋</span>
              <p>Hiện không có khách bên trong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitorsInside.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{entry.visitor_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {entry.flat_no_visiting}
                      </Badge>
                      <span>•</span>
                      <span>{entry.purpose}</span>
                      <span>•</span>
                      <span>{formatTime(entry.in_time)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkOut(entry._id, entry.visitor_name)}
                  >
                    Ra cổng
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
