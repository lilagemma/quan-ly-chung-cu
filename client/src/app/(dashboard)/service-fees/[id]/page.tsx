"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    paypal: any;
  }
}

interface ServiceFeeItem {
  type: string;
  description?: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ServiceFee {
  _id: string;
  flat_no: string;
  month: number;
  year: number;
  bill_date?: string;
  due_date: string;
  items?: ServiceFeeItem[];
  total_amount: number;
  status: "pending" | "paid" | "overdue";
  note?: string;
  createdAt?: string;
}

const getErrorMessage = (err: unknown) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = err.response as { data?: { message?: string } };
    return response.data?.message;
  }
  if (err instanceof Error) return err.message;
  return undefined;
};

const getErrorStatus = (err: unknown) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = err.response as { status?: number };
    return response.status;
  }
  return undefined;
};

export default function ServiceFeeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [fee, setFee] = useState<ServiceFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Đúng endpoint: /service-fees/bill/:id (theo routes của bạn)
      const response = await api.get(`/service-fees/bill/${id}`);
      setFee(response.data.data);
    } catch (err: unknown) {
      console.error("Lỗi tải chi tiết hóa đơn:", err);
      const errorMsg = getErrorMessage(err) || "Không tìm thấy hóa đơn";
      setError(errorMsg);
      if (getErrorStatus(err) === 404) {
        setTimeout(() => router.push("/service-fees"), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchFeeDetail();
    } else if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để xem chi tiết hóa đơn");
      setLoading(false);
    }
  }, [fetchFeeDetail, isAuthenticated, id]);

  const formatCurrency = (amount: number) =>
    amount?.toLocaleString("vi-VN") + " ₫";

  const getStatusBadge = (status: string) => {
    if (status === "paid")
      return <Badge className="bg-green-500">Đã thanh toán</Badge>;
    return <Badge variant="secondary">Chưa thanh toán</Badge>;
  };

  // Helper hiển thị ngày an toàn
  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const handlePay = async () => {
    if (!fee) return;

    if (!window.paypal) {
      alert("PayPal SDK chua san sang. Vui long tai lai trang.");
      return;
    }

    try {
      const container = document.getElementById("service-fee-detail-paypal");
      if (container) container.innerHTML = "";

      window.paypal
        .Buttons({
          createOrder: async () => {
            const res = await api.post(`/service-fees/${fee._id}/paypal/create-order`);
            if (!res.data.success) throw new Error(res.data.message);
            return res.data.data.order_id;
          },
          onApprove: async (data: any) => {
            await api.post(`/service-fees/${fee._id}/paypal/capture`, {
              order_id: data.orderID,
            });
            await fetchFeeDetail();
          },
          onError: (err: unknown) => {
            console.error("PayPal service fee error:", err);
            alert("Thanh toan PayPal that bai.");
          },
        })
        .render("#service-fee-detail-paypal");
    } catch (err: unknown) {
      alert(getErrorMessage(err) || "Không thể thanh toán hóa đơn");
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || "Vui lòng đăng nhập"}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải hóa đơn...</p>
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error || "Hóa đơn không tồn tại"}</p>
        <Button variant="outline" onClick={() => router.push("/service-fees")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl">
            THÔNG BÁO THANH TOÁN (LẦN 1)
          </CardTitle>
          <p className="text-sm text-gray-500">CÔNG TY TNHH ANA SERVICES</p>
          <p className="text-sm">
            Ngày tạo: {formatDate(fee.createdAt || fee.bill_date || new Date())}
          </p>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Căn hộ:</strong> {fee.flat_no}
              </p>
              <p>
                <strong>Tháng:</strong> {fee.month}/{fee.year}
              </p>
            </div>
            <div>
              <p>
                <strong>Trạng thái:</strong> {getStatusBadge(fee.status)}
              </p>
              <p>
                <strong>Hạn thanh toán:</strong> {formatDate(fee.due_date)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Nội dung</th>
                  <th className="border p-3">Số lượng</th>
                  <th className="border p-3">Đơn giá</th>
                  <th className="border p-3">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {fee.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-3">
                      {item.description || item.type}
                    </td>
                    <td className="border p-3 text-center">{item.quantity}</td>
                    <td className="border p-3 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="border p-3 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border p-3 text-right">
                    TỔNG CỘNG:
                  </td>
                  <td className="border p-3 text-right text-lg">
                    {formatCurrency(fee.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              {fee.note && (
                <p className="text-sm text-gray-600">
                  <strong>Ghi chú:</strong> {fee.note}
                </p>
              )}
            </div>
            {user?.role === "resident" && fee.status !== "paid" && (
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handlePay}
              >
                Thanh toán qua PayPal
              </Button>
            )}
          </div>
          {user?.role === "resident" && fee.status !== "paid" && (
            <div id="service-fee-detail-paypal" className="pt-2" />
          )}
        </CardContent>
      </Card>

      <div className="text-center mt-6">
        <Button variant="outline" onClick={() => router.push("/service-fees")}>
          ← Quay lại danh sách hóa đơn
        </Button>
      </div>
    </div>
  );
}
