"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function ServiceFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    if (isAuthenticated) {
      fetchServiceFees();
    }
  }, [isAuthenticated]);

  const fetchServiceFees = async () => {
    try {
      setLoading(true);
      const flatNo = user?.flat_no || "CT2A1";
      const response = await api.get(`/service-fees/${flatNo}`);
      setFees(response.data.data || []);
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  // Component tạo hóa đơn (đặt bên trong để dùng isAdmin và user)
  const CreateBillForm = () => {
    const [formData, setFormData] = useState({
      flat_no: user?.flat_no || "CT2A1",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      due_date: new Date(new Date().getFullYear(), new Date().getMonth(), 25)
        .toISOString()
        .slice(0, 10),
      note: "Thanh toán theo thông báo lần 1",
      items: [
        {
          type: "nuoc",
          description: "Nước sinh hoạt",
          quantity: 15,
          unit_price: 10311,
          amount: 154665,
        },
        {
          type: "xe_o_to",
          description: "Phí trông giữ xe Ô tô",
          quantity: 1,
          unit_price: 200000,
          amount: 200000,
        },
        {
          type: "xe_may",
          description: "Phí trông giữ xe máy",
          quantity: 2,
          unit_price: 100000,
          amount: 200000,
        },
        {
          type: "quan_ly_van_hanh",
          description: "Phí quản lý vận hành",
          quantity: 156.14,
          unit_price: 3500,
          amount: 546490,
        },
      ],
    });

    const [flatNos, setFlatNos] = useState<string[]>([]);
    const [loadingFlats, setLoadingFlats] = useState(false);

    // Nếu là admin, lấy danh sách căn hộ
    useEffect(() => {
      if (isAdmin) {
        const fetchFlatNos = async () => {
          setLoadingFlats(true);
          try {
            const response = await api.get("/service-fees/flatnos");
            setFlatNos(response.data.data);
          } catch (error) {
            console.error("Lỗi lấy danh sách căn hộ", error);
          } finally {
            setLoadingFlats(false);
          }
        };
        fetchFlatNos();
      }
    }, []);

    const handleItemChange = (
      index: number,
      field: "quantity" | "unit_price",
      value: number,
    ) => {
      const newItems = [...formData.items];
      const newValue = isNaN(value) ? 0 : value;
      newItems[index] = {
        ...newItems[index],
        [field]: newValue,
        amount:
          (field === "quantity" ? newValue : newItems[index].quantity) *
          (field === "unit_price" ? newValue : newItems[index].unit_price),
      };
      setFormData({ ...formData, items: newItems });
    };

    const totalAmount = formData.items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );

    const handleSubmit = async () => {
      try {
        // Chuẩn hóa items
        const sanitizedItems = formData.items.map((item) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unit_price) || 0;
          return {
            ...item,
            quantity: qty,
            unit_price: price,
            amount: qty * price,
          };
        });

        const total = sanitizedItems.reduce((sum, i) => sum + i.amount, 0);

        // Payload: không gửi user_id để backend tự tìm
        const payload = {
          flat_no: formData.flat_no,
          month: Number(formData.month),
          year: Number(formData.year),
          due_date: formData.due_date,
          note: formData.note,
          items: sanitizedItems,
          total_amount: total,
        };

        await api.post("/service-fees", payload);
        alert("✅ Tạo hóa đơn thành công!");
        setShowCreateForm(false);
        fetchServiceFees(); // reload danh sách
      } catch (error: any) {
        console.error("Lỗi:", error);
        alert(
          `❌ Tạo hóa đơn thất bại: ${error.response?.data?.message || error.message}`,
        );
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
          <CardHeader>
            <CardTitle>Tạo Hóa Đơn Phí Dịch Vụ Mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Căn hộ</label>
                {isAdmin ? (
                  <select
                    value={formData.flat_no}
                    onChange={(e) =>
                      setFormData({ ...formData, flat_no: e.target.value })
                    }
                    className="w-full p-2 border rounded mt-1"
                    disabled={loadingFlats}
                  >
                    {loadingFlats ? (
                      <option>Đang tải...</option>
                    ) : (
                      flatNos.map((flat) => (
                        <option key={flat} value={flat}>
                          {flat}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.flat_no}
                    className="w-full p-2 border rounded mt-1 bg-gray-100"
                    readOnly
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Tháng</label>
                <input
                  type="number"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      month: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Năm</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
            </div>

            {/* Các items */}
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border p-4 rounded-lg bg-gray-50">
                  <p className="font-semibold mb-3">{item.description}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label>Số lượng</label>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full p-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label>Đơn giá (₫)</label>
                      <input
                        type="number"
                        step="any"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unit_price",
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full p-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label>Thành tiền</label>
                      <div className="p-2 border rounded mt-1 bg-white font-medium">
                        {(item.quantity * item.unit_price).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        ₫
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-bold text-right">
                Tổng cộng: {totalAmount.toLocaleString("vi-VN")} ₫
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Ngày đến hạn</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full p-2 border rounded mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full p-3 border rounded mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                Tạo Hóa Đơn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid")
      return <Badge className="bg-green-500">Đã thanh toán</Badge>;
    return <Badge variant="secondary">Chưa thanh toán</Badge>;
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("vi-VN") + " ₫";
  const viewDetail = (id: string) => router.push(`/service-fees/${id}`);

  if (!isAuthenticated) {
    return <div className="p-6 text-center">Vui lòng đăng nhập...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">💰 Phí Dịch Vụ</h1>
        <div className="flex gap-3">
          <Button onClick={fetchServiceFees} variant="outline">
            🔄 Làm mới
          </Button>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              ➕ Tạo Hóa Đơn Mới
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Đang tải...</p>
          ) : fees.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              Chưa có hóa đơn nào
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tháng/Năm</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee._id}>
                    <TableCell>
                      {fee.month}/{fee.year}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(fee.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>
                      {new Date(fee.due_date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetail(fee._id)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreateForm && <CreateBillForm />}
    </div>
  );
}