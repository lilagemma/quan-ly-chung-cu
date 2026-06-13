"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ServiceFeeSummary {
  totalBills: number;
  paidBills: number;
  paidAmount: number;
  pendingBills: number;
  pendingAmount: number;
  overdueBills: number;
  overdueAmount: number;
  latestDueDate?: string;
}

interface ServiceFeeWidgetProps {
  isAdmin?: boolean;
}

export default function ServiceFeeWidget({
  isAdmin = false,
}: ServiceFeeWidgetProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ServiceFeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceFeeSummary = async () => {
      try {
        // Lấy dữ liệu hóa đơn dựa trên quyền
        const endpoint = isAdmin
          ? "/service-fees/all"
          : `/service-fees/${user?.flat_no || ""}`;
        const response = await api.get(endpoint);
        const fees = response.data.data || [];

        // Tính toán thống kê
        const stats: ServiceFeeSummary = {
          totalBills: fees.length,
          paidBills: 0,
          paidAmount: 0,
          pendingBills: 0,
          pendingAmount: 0,
          overdueBills: 0,
          overdueAmount: 0,
          latestDueDate: undefined,
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        fees.forEach((fee: any) => {
          const amount = fee.total_amount || 0;
          if (fee.status === "paid") {
            stats.paidBills++;
            stats.paidAmount += amount;
          } else {
            // Chưa thanh toán (pending hoặc overdue)
            const dueDate = new Date(fee.due_date);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
              stats.overdueBills++;
              stats.overdueAmount += amount;
            } else {
              stats.pendingBills++;
              stats.pendingAmount += amount;
            }
          }
        });

        // Tìm ngày đáo hạn sắp nhất
        const unpaidFees = fees.filter((f: any) => f.status !== "paid");
        if (unpaidFees.length > 0) {
          const nearestDue = unpaidFees.reduce((earliest: Date, f: any) => {
            const d = new Date(f.due_date);
            return d < earliest ? d : earliest;
          }, new Date(unpaidFees[0].due_date));
          stats.latestDueDate = nearestDue.toISOString().slice(0, 10);
        }

        setSummary(stats);
      } catch (error) {
        console.error("Lỗi khi tải tổng hợp phí dịch vụ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceFeeSummary();
  }, [isAdmin, user]);

  const getOverallStatus = () => {
    if (!summary) return "unknown";
    if (summary.overdueBills > 0) return "critical";
    if (summary.pendingBills > 0) return "warning";
    return "healthy";
  };

  const overallStatus = getOverallStatus();

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-slate-600" />
            </div>
            Phí dịch vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("vi-VN") + " ₫";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-slate-600" />
            </div>
            Phí dịch vụ
          </CardTitle>
          {overallStatus === "healthy" && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Đã đóng đủ
            </span>
          )}
          {overallStatus === "warning" && (
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              Chưa thanh toán
            </span>
          )}
          {overallStatus === "critical" && (
            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
              Quá hạn
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tổng số tiền còn nợ */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Tổng còn nợ</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(summary.pendingAmount + summary.overdueAmount)}
          </p>
        </div>

        {/* Các chỉ số chi tiết */}
        <div className="space-y-2">
          {/* Đã thanh toán */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Đã thanh toán
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-green-700">
                {summary.paidBills} hóa đơn
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {formatCurrency(summary.paidAmount)}
              </span>
            </div>
          </div>

          {/* Chưa thanh toán (đúng hạn) */}
          {summary.pendingBills > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">
                  Chưa thanh toán
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-amber-700">
                  {summary.pendingBills} hóa đơn
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatCurrency(summary.pendingAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Quá hạn */}
          {summary.overdueBills > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  Quá hạn
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-red-700">
                  {summary.overdueBills} hóa đơn
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatCurrency(summary.overdueAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ngày đáo hạn gần nhất */}
        {summary.latestDueDate && (
          <p className="text-xs text-gray-400 text-center">
            Hạn thanh toán gần nhất:{" "}
            {new Date(summary.latestDueDate).toLocaleDateString("vi-VN")}
          </p>
        )}

        {/* Link đến trang chi tiết */}
        <Link
          href={isAdmin ? "/service-fees" : "/service-fees"}
          className="flex items-center justify-center gap-1 text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
        >
          {isAdmin ? "Quản lý phí dịch vụ" : "Xem hóa đơn của tôi"}{" "}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
