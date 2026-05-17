'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Plus } from 'lucide-react';

interface ComplaintsWidgetProps {
  role: string;
  openCount?: number;
  inProgressCount?: number;
  resolvedCount?: number;
  loading?: boolean;
}

export default function ComplaintsWidget({
  role,
  resolvedCount = 0,
  openCount = 0,
  inProgressCount = 0,
  loading = false,
}: ComplaintsWidgetProps) {
  const totalActive = openCount + inProgressCount + resolvedCount;
  const isAdmin = ["manager", "admin"].includes(role);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            Khiếu nại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            Khiếu nại
          </CardTitle>
          {totalActive > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
              {totalActive}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p
            className={`text-3xl font-bold ${totalActive > 0 ? "text-blue-600" : "text-gray-400"}`}
          >
            {totalActive}
          </p>
          <p className="text-sm text-gray-500">
            {totalActive === 0
              ? "Không có khiếu nại nào đang diễn ra."
              : "Khiếu nại đang tồn tại"}
          </p>
        </div>
        {totalActive > 0 && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-amber-600">{openCount}</p>
              <p className="text-xs text-amber-700">Đang chờ</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-blue-700">Đang xử lý</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-green-800">{resolvedCount}</p>
              <p className="text-xs text-green-800">Đã giải quyết</p>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/admin/complaints" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                Quản lý khiếu nại <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
        {!isAdmin && (
          <div className="flex gap-2">
            <Link href="/complaints" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                Xem tất cả
              </Button>
            </Link>
            <Link href="/complaints/new" className="flex-1">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Mới
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
