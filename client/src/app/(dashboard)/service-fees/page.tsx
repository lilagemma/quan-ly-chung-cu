"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

declare global {
  interface Window {
    paypal: any;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FeeStatus = "pending" | "paid" | "overdue";

interface FeeItem {
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ServiceFee {
  _id: string;
  flat_no: string;
  month: number;
  year: number;
  items: FeeItem[];
  total_amount: number;
  status: FeeStatus;
  due_date: string;
  paid_date?: string;
  note?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FEE_TYPES = [
  { value: "dien", label: "Tiền điện", unit: "kWh", defaultPrice: 3500 },
  { value: "nuoc", label: "Nước sinh hoạt", unit: "m³", defaultPrice: 10311 },
  {
    value: "xe_o_to",
    label: "Phí trông giữ xe ô tô",
    unit: "xe",
    defaultPrice: 200000,
  },
  {
    value: "xe_may",
    label: "Phí trông giữ xe máy",
    unit: "xe",
    defaultPrice: 100000,
  },
  {
    value: "xe_dap",
    label: "Phí trông giữ xe đạp",
    unit: "xe",
    defaultPrice: 30000,
  },
  {
    value: "xe_dap_dien",
    label: "Phí trông giữ xe đạp điện",
    unit: "xe",
    defaultPrice: 50000,
  },
  {
    value: "quan_ly_van_hanh",
    label: "Phí quản lý vận hành",
    unit: "m²",
    defaultPrice: 3500,
  },
  {
    value: "phat_qua_han",
    label: "Phí phạt quá hạn",
    unit: "lần",
    defaultPrice: 50000,
  },
  {
    value: "phi_bao_tri",
    label: "Phí bảo trì",
    unit: "m²",
    defaultPrice: 2000,
  },
  { value: "other", label: "Khác", unit: "lần", defaultPrice: 0 },
];

const STATUS_CONFIG: Record<
  FeeStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Chưa thanh toán",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  paid: {
    label: "Đã thanh toán",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  overdue: {
    label: "Quá hạn",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n?.toLocaleString("vi-VN") + " ₫";
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const defaultDue = () => {
  const d = new Date();
  d.setDate(25);
  return d.toISOString().slice(0, 10);
};
const getErrorMessage = (err: unknown) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = err.response as { data?: { message?: string } };
    return response.data?.message;
  }
  if (err instanceof Error) return err.message;
  return undefined;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: FeeStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color ?? "text-gray-800"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal: Tạo / Sửa hóa đơn ────────────────────────────────────────────────
function BillModal({
  mode,
  initial,
  flatNos,
  existingFees,
  isAdmin,
  currentFlat,
  onClose,
  onSuccess,
}: {
  mode: "create" | "edit";
  initial?: ServiceFee;
  flatNos: string[];
  existingFees: ServiceFee[];
  isAdmin: boolean;
  currentFlat: string;
  onClose: () => void;
  onSuccess: (fee?: ServiceFee) => void;
}) {
  const [flat_no, setFlatNo] = useState(initial?.flat_no ?? currentFlat);
  const [month, setMonth] = useState(
    initial?.month ?? new Date().getMonth() + 1,
  );
  const [year, setYear] = useState(initial?.year ?? new Date().getFullYear());
  const [due_date, setDueDate] = useState(
    initial?.due_date ? initial.due_date.slice(0, 10) : defaultDue(),
  );
  const [note, setNote] = useState(
    initial?.note ?? "Thanh toán theo thông báo lần 1",
  );
  const [items, setItems] = useState<FeeItem[]>(
    initial?.items ?? [
      {
        type: "dien",
        description: "Tiền điện",
        quantity: 100,
        unit_price: 3500,
        amount: 350000,
      },
      {
        type: "nuoc",
        description: "Nước sinh hoạt",
        quantity: 15,
        unit_price: 10311,
        amount: 154665,
      },
      {
        type: "xe_o_to",
        description: "Phí trông giữ xe ô tô",
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
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const selectableFlatNos = useMemo(() => {
    const billedFlats = new Set(
      existingFees
        .filter((fee) => fee.month === Number(month) && fee.year === Number(year))
        .filter((fee) => mode === "create" || fee._id !== initial?._id)
        .map((fee) => fee.flat_no),
    );

    return isAdmin
      ? flatNos.filter((f) => !billedFlats.has(f))
      : [currentFlat].filter(Boolean);
  }, [currentFlat, existingFees, flatNos, initial?._id, isAdmin, mode, month, year]);

  useEffect(() => {
    if (!isAdmin || mode !== "create") return;
    if (selectableFlatNos.length > 0 && !selectableFlatNos.includes(flat_no)) {
      setFlatNo(selectableFlatNos[0]);
    }
  }, [flat_no, isAdmin, mode, selectableFlatNos]);

  // Thêm khoản phí mới
  const addItem = () => {
    setItems([
      ...items,
      { type: "other", description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  // Xóa khoản phí
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Cập nhật khoản phí
  const updateItem = (
    idx: number,
    field: keyof FeeItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };

      // Khi đổi type → điền sẵn thông tin mẫu
      if (field === "type") {
        const tpl = FEE_TYPES.find((t) => t.value === value);
        if (tpl) {
          item.description = tpl.label;
          item.unit_price = tpl.defaultPrice;
        }
      }
      item.amount = Number(item.quantity) * Number(item.unit_price);
      next[idx] = item;
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!flat_no) e.flat_no = "Chọn căn hộ";
    if (isAdmin && mode === "create" && selectableFlatNos.length === 0) {
      e.flat_no = "Tất cả căn hộ đã có hóa đơn cho kỳ này";
    }
    if (!month || month < 1 || month > 12) e.month = "Tháng không hợp lệ";
    if (!year || year < 2020) e.year = "Năm không hợp lệ";
    if (!due_date) e.due_date = "Chọn hạn thanh toán";
    items.forEach((item, i) => {
      if (!item.description) e[`desc_${i}`] = "Nhập mô tả";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const sanitized = items.map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
        amount: Number(it.quantity) * Number(it.unit_price),
      }));
      const payload = {
        flat_no,
        month: Number(month),
        year: Number(year),
        due_date,
        note,
        items: sanitized,
        total_amount: sanitized.reduce((s, i) => s + i.amount, 0),
      };
      if (mode === "create") {
        const res = await api.post("/service-fees", payload);
        onSuccess(res.data.data);
      } else {
        const res = await api.put(`/service-fees/${initial!._id}`, payload);
        onSuccess(res.data.data);
      }
      onClose();
    } catch (err: unknown) {
      alert(`❌ ${getErrorMessage(err) ?? "Không thể lưu hóa đơn"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === "create" ? "➕ Tạo hóa đơn mới" : "✏️ Chỉnh sửa hóa đơn"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Căn hộ *
              </label>
              {isAdmin ? (
                <select
                  value={flat_no}
                  onChange={(e) => setFlatNo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {selectableFlatNos.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={flat_no}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
              )}
              {errors.flat_no && (
                <p className="text-red-500 text-xs mt-1">{errors.flat_no}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Tháng *
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.month && (
                <p className="text-red-500 text-xs mt-1">{errors.month}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Năm *
              </label>
              <input
                type="number"
                min={2020}
                max={2099}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.year && (
                <p className="text-red-500 text-xs mt-1">{errors.year}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Hạn thanh toán *
              </label>
              <input
                type="date"
                value={due_date}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.due_date && (
                <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>
              )}
            </div>
          </div>

          {/* Các khoản phí */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                📋 Các khoản phí
              </h3>
              <button
                onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50"
              >
                + Thêm khoản phí
              </button>
            </div>

            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 text-xs text-gray-400 font-medium uppercase tracking-wide">
                <div className="col-span-3">Loại phí</div>
                <div className="col-span-3">Mô tả</div>
                <div className="col-span-2 text-right">Số lượng</div>
                <div className="col-span-2 text-right">Đơn giá (₫)</div>
                <div className="col-span-1 text-right">Thành tiền</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl px-3 py-2"
                >
                  <div className="col-span-3">
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(idx, "type", e.target.value)}
                      className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {FEE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      placeholder="Mô tả..."
                      className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    {errors[`desc_${idx}`] && (
                      <p className="text-red-500 text-xs">
                        {errors[`desc_${idx}`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "unit_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div className="col-span-1 text-right text-xs font-semibold text-gray-700">
                    {(item.quantity * item.unit_price).toLocaleString("vi-VN")}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-30 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tổng */}
            <div className="flex justify-end mt-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
                <span className="text-sm text-gray-500">Tổng cộng: </span>
                <span className="text-xl font-bold text-blue-700">
                  {fmt(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {submitting
              ? "Đang lưu..."
              : mode === "create"
                ? "Tạo hóa đơn"
                : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Xác nhận thanh toán (Admin) ──────────────────────────────────────
function MarkPaidModal({
  fee,
  isAdmin,
  onClose,
  onSuccess,
}: {
  fee: ServiceFee;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (fee?: ServiceFee) => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const paypalContainerId = `service-fee-paypal-${fee._id}`;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/service-fees/${fee._id}/pay`, { note });
      onSuccess(res.data.data);
      onClose();
    } catch (err: unknown) {
      alert(`❌ ${getErrorMessage(err) ?? "Không thể thanh toán hóa đơn"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaypalPayment = async () => {
    if (!window.paypal) {
      alert("PayPal SDK chưa sẵn sàng. Vui lòng tải lại trang.");
      return;
    }

    setSubmitting(true);
    const container = document.getElementById(paypalContainerId);
    if (container) container.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: async () => {
          const res = await api.post(`/service-fees/${fee._id}/paypal/create-order`);
          if (!res.data.success) throw new Error(res.data.message);
          return res.data.data.order_id;
        },
        onApprove: async (data: any) => {
          try {
            const res = await api.post(`/service-fees/${fee._id}/paypal/capture`, {
              order_id: data.orderID,
              note,
            });
            onSuccess(res.data.data);
            onClose();
          } catch (err: unknown) {
            alert(`❌ ${getErrorMessage(err) ?? "Không thể xác nhận PayPal"}`);
          } finally {
            setSubmitting(false);
          }
        },
        onCancel: () => setSubmitting(false),
        onError: (err: unknown) => {
          console.error("PayPal service fee error:", err);
          alert("Thanh toán PayPal thất bại.");
          setSubmitting(false);
        },
      })
      .render(`#${paypalContainerId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isAdmin ? "✅ Xác nhận đã thanh toán" : "Thanh toán hóa đơn"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1">
            <p className="text-sm text-gray-600">
              Căn hộ: <strong>{fee.flat_no}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Kỳ:{" "}
              <strong>
                Tháng {fee.month}/{fee.year}
              </strong>
            </p>
            <p className="text-sm text-gray-600">
              Số tiền:{" "}
              <strong className="text-emerald-700">
                {fmt(fee.total_amount)}
              </strong>
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              {isAdmin ? "Ghi chú thanh toán" : "Ghi chú"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={
                isAdmin
                  ? "VD: Chuyển khoản ngân hàng, mã giao dịch..."
                  : "Ghi chú khi thanh toán..."
              }
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          {!isAdmin && (
            <div id={paypalContainerId} className="min-h-[44px]" />
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={isAdmin ? handleSubmit : handlePaypalPayment}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
          >
            {submitting
              ? "Đang xử lý..."
              : isAdmin
                ? "Xác nhận thanh toán"
                : "Thanh toán"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Xem chi tiết hóa đơn ─────────────────────────────────────────────
function DetailModal({
  fee,
  isAdmin,
  canPay,
  onClose,
  onMarkPaid,
  onEdit,
}: {
  fee: ServiceFee;
  isAdmin: boolean;
  canPay: boolean;
  onClose: () => void;
  onMarkPaid: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Hóa đơn phí dịch vụ
            </h2>
            <p className="text-xs text-gray-400">
              Căn hộ {fee.flat_no} · Tháng {fee.month}/{fee.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Thông tin */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-500">
                Căn hộ: <strong className="text-gray-800">{fee.flat_no}</strong>
              </p>
              <p className="text-gray-500">
                Kỳ thanh toán:{" "}
                <strong className="text-gray-800">
                  Tháng {fee.month}/{fee.year}
                </strong>
              </p>
              <p className="text-gray-500">
                Ngày tạo:{" "}
                <strong className="text-gray-800">
                  {fmtDate(fee.createdAt)}
                </strong>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500">
                Trạng thái: <StatusBadge status={fee.status} />
              </p>
              <p className="text-gray-500">
                Hạn thanh toán:{" "}
                <strong className="text-gray-800">
                  {fmtDate(fee.due_date)}
                </strong>
              </p>
              {fee.paid_date && (
                <p className="text-gray-500">
                  Ngày thanh toán:{" "}
                  <strong className="text-emerald-700">
                    {fmtDate(fee.paid_date)}
                  </strong>
                </p>
              )}
            </div>
          </div>

          {/* Bảng khoản phí */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-xs text-gray-500">
                  Nội dung
                </th>
                <th className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-500">
                  Số lượng
                </th>
                <th className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-500">
                  Đơn giá
                </th>
                <th className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-500">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {fee.items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2">
                    {item.description || item.type}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right">
                    {fmt(item.unit_price)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right font-medium">
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50">
                <td
                  colSpan={3}
                  className="border border-gray-200 px-3 py-3 text-right font-semibold"
                >
                  TỔNG CỘNG
                </td>
                <td className="border border-gray-200 px-3 py-3 text-right font-bold text-blue-700 text-base">
                  {fmt(fee.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {fee.note && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 text-sm text-yellow-800">
              📝 <strong>Ghi chú:</strong> {fee.note}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                ✏️ Chỉnh sửa
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && fee.status !== "paid" && (
              <Button
                size="sm"
                onClick={onMarkPaid}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                ✅ Xác nhận đã thanh toán
              </Button>
            )}
            {canPay && fee.status !== "paid" && (
              <Button
                size="sm"
                onClick={onMarkPaid}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Thanh toán
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServiceFeesPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const canResidentPay = user?.role === "resident";

  // Data state
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [flatNos, setFlatNos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchFlat, setSearchFlat] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");

  // Modal state
  const [modal, setModal] = useState<
    | { type: "create" }
    | { type: "edit"; fee: ServiceFee }
    | { type: "detail"; fee: ServiceFee }
    | { type: "markPaid"; fee: ServiceFee }
    | null
  >(null);

  // ── Fetch ──
  const fetchFees = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await api.get("/service-fees/all");
        setFees(res.data.data ?? []);
      } else {
        const flat = user?.flat_no ?? "";
        const res = await api.get(`/service-fees/${flat}`);
        setFees(res.data.data ?? []);
      }
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, user]);

  const fetchFlatNos = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/service-fees/flatnos");
      setFlatNos(res.data.data ?? []);
    } catch {}
  }, [isAdmin]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);
  useEffect(() => {
    fetchFlatNos();
  }, [fetchFlatNos]);

  const isOverdue = (fee: ServiceFee) => {
    if (fee.status === "paid") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(fee.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const hasOverduePenalty = (fee: ServiceFee) => {
    return fee.items.some((item) => item.type === "phat_qua_han");
  };

  // ── Filtered list (client-side sau khi fetch) ──
  const filtered = fees.filter((f) => {
    if (isAdmin && searchFlat.trim() && !f.flat_no.includes(searchFlat.trim().toUpperCase())) {
      return false;
    }
    // if (filterStatus && f.status !== filterStatus) return false;
        if (filterStatus === "overdue" && !isOverdue(f)) return false;
        if (
          filterStatus &&
          filterStatus !== "overdue" &&
          f.status !== filterStatus
        )
          return false;
    if (filterMonth && f.month !== Number(filterMonth)) return false;
    if (filterYear && f.year !== Number(filterYear)) return false;
    return true;
  });

  // ── Stats ──
  const stats = {
    total: fees.length,
    paid: fees.filter((f) => f.status === "paid").length,
    // pending: fees.filter((f) => f.status === "pending" && !isOverdue(f)).length,
    pending: fees.filter((f) => f.status !== "paid").length, // tất cả chưa thanh toán
    overdue: fees.filter((f) => isOverdue(f)).length,
    totalAmount: fees.reduce((s, f) => s + f.total_amount, 0),
    paidAmount: fees
      .filter((f) => f.status === "paid")
      .reduce((s, f) => s + f.total_amount, 0),
  };

   

  // ── Helpers ──
  const onSuccess = (updatedFee?: ServiceFee) => {
    if (updatedFee?._id) {
      setFees((prev) => {
        const exists = prev.some((fee) => fee._id === updatedFee._id);
        return exists
          ? prev.map((fee) => (fee._id === updatedFee._id ? updatedFee : fee))
          : [updatedFee, ...prev];
      });
    }
    fetchFees();
  };

 

  const openDetail = (fee: ServiceFee) => setModal({ type: "detail", fee });
  const openEdit = (fee: ServiceFee) => setModal({ type: "edit", fee });
  const openMarkPaid = (fee: ServiceFee) => setModal({ type: "markPaid", fee });

  // ── Render ──
  if (!isAuthenticated) {
    return (
      <div className="p-10 text-center text-gray-500">
        Vui lòng đăng nhập để xem phí dịch vụ.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Phí dịch vụ</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAdmin
                ? "Quản lý hóa đơn phí dịch vụ toàn bộ căn hộ"
                : `Căn hộ ${user?.flat_no ?? ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchFees}>
              🔄 Làm mới
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setModal({ type: "create" })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ➕ Tạo hóa đơn
              </Button>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Tổng hóa đơn" value={stats.total} />
          <StatCard
            label="Đã thanh toán"
            value={stats.paid}
            color="text-emerald-600"
          />
          <StatCard
            label="Chưa thanh toán"
            value={stats.pending}
            color="text-amber-600"
          />
          <StatCard
            label="Quá hạn"
            value={stats.overdue}
            color="text-red-600"
          />
          <StatCard
            label="Tổng phí"
            value={stats.totalAmount.toLocaleString("vi-VN")}
            sub="VNĐ"
          />
          <StatCard
            label="Đã thu"
            value={stats.paidAmount.toLocaleString("vi-VN")}
            sub="VNĐ"
            color="text-emerald-600"
          />
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Tìm theo căn hộ (Admin) */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  🔍 Căn hộ
                </span>
                <Input
                  value={searchFlat}
                  onChange={(e) => setSearchFlat(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && fetchFees()}
                  placeholder="VD: 410"
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={fetchFees}
                  className="h-8 px-3 bg-gray-800 hover:bg-gray-700 shrink-0"
                >
                  Tìm
                </Button>
              </div>
            )}

            {/* Lọc trạng thái */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 h-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
            </select>

            {/* Lọc tháng */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border rounded-lg px-3 h-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>

            {/* Lọc năm */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border rounded-lg px-3 h-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tất cả năm</option>
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Reset */}
            {(filterStatus ||
              filterMonth ||
              filterYear ||
              (isAdmin && searchFlat)) && (
              <button
                onClick={() => {
                  setFilterStatus("");
                  setFilterMonth("");
                  setFilterYear("");
                  setSearchFlat("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="desktop-table bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-3xl mb-3">⏳</div>
              <p className="text-sm">Đang tải hóa đơn...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">Không có hóa đơn nào</p>
              {isAdmin && !searchFlat && (
                <p className="text-xs mt-1">
                  Nhập số căn hộ vào ô tìm kiếm để xem hóa đơn
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {isAdmin && (
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Căn hộ
                    </TableHead>
                  )}
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Kỳ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Các khoản phí
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 text-right">
                    Tổng tiền
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Hạn TT
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((fee) => (
                  <TableRow
                    key={fee._id}
                    className={`transition-colors ${
                      isOverdue(fee)
                        ? hasOverduePenalty(fee)
                          ? "blink-overdue"
                          : "blink-overdue-with-penalty"
                        : "hover:bg-blue-50/30"
                    }`}
                  >
                    {isAdmin && (
                      <TableCell className="font-mono text-sm font-semibold text-blue-700">
                        {fee.flat_no}
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-sm">
                      T{fee.month}/{fee.year}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {fee.items.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className="inline-block text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5"
                          >
                            {item.description || item.type}
                          </span>
                        ))}
                        {fee.items.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{fee.items.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-800">
                      {fmt(fee.total_amount)}
                    </TableCell>
                    {/* <TableCell>
                      <StatusBadge status={fee.status} />
                    </TableCell> */}
                    <TableCell>
                      {(() => {
                        if (fee.status === "paid") {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
                              Đã thanh toán
                            </span>
                          );
                        }
                        if (isOverdue(fee)) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 border-red-200 text-red-700 animate-pulse">
                              Quá hạn
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700">
                            Chưa thanh toán
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {fmtDate(fee.due_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(fee)}
                          className="h-7 text-xs px-2"
                        >
                          Xem
                        </Button>
                        {isAdmin && fee.status !== "paid" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(fee)}
                              className="h-7 text-xs px-2"
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openMarkPaid(fee)}
                              className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                              ✅ TT
                            </Button>
                          </>
                        )}
                        {canResidentPay && fee.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => openMarkPaid(fee)}
                            className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700"
                          >
                            Thanh toán
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Hiển thị {filtered.length} / {fees.length} hóa đơn
          </p>
        )}
      </div>

      {/* Mobile card view - chỉ hiển thị trên màn hình dưới 640px */}
      <div className="mobile-cards space-y-3 mt-4">
        {!loading && filtered.length > 0 ? (
          filtered.map((fee) => (
            <div
              key={fee._id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                isOverdue(fee)
                  ? "border-red-200 bg-red-50/30"
                  : "border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  {isAdmin && (
                    <p className="font-mono font-bold text-blue-700 text-base">
                      {fee.flat_no}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-800">
                    Tháng {fee.month}/{fee.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {fmt(fee.total_amount)}
                  </p>
                  {fee.status === "paid" && (
                    <span className="text-emerald-600 text-xs">
                      ✅ Đã thanh toán
                    </span>
                  )}
                  {fee.status !== "paid" && isOverdue(fee) && (
                    <span className="text-red-600 text-xs">⚠️ Quá hạn</span>
                  )}
                  {fee.status !== "paid" && !isOverdue(fee) && (
                    <span className="text-amber-600 text-xs">
                      ⏳ Chưa thanh toán
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 my-2">
                {fee.items.slice(0, 3).map((item, i) => (
                  <span
                    key={i}
                    className="inline-block text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5"
                  >
                    {item.description || item.type}
                  </span>
                ))}
                {fee.items.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{fee.items.length - 3}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Hạn: {fmtDate(fee.due_date)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetail(fee)}
                    className="h-8 text-xs px-3"
                  >
                    Xem
                  </Button>
                  {isAdmin && fee.status !== "paid" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(fee)}
                        className="h-8 text-xs px-3"
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openMarkPaid(fee)}
                        className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        TT
                      </Button>
                    </>
                  )}
                  {canResidentPay && fee.status !== "paid" && (
                    <Button
                      size="sm"
                      onClick={() => openMarkPaid(fee)}
                      className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Thanh toán
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : !loading && filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium">Không có hóa đơn nào</p>
          </div>
        ) : null}
      </div>

      {/* ── Modals ── */}
      {modal?.type === "create" && (
        <BillModal
          mode="create"
          flatNos={flatNos}
          existingFees={fees}
          isAdmin={isAdmin}
          currentFlat={user?.flat_no ?? ""}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
      {modal?.type === "edit" && (
        <BillModal
          mode="edit"
          initial={modal.fee}
          flatNos={flatNos}
          existingFees={fees}
          isAdmin={isAdmin}
          currentFlat={modal.fee.flat_no}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          fee={modal.fee}
          isAdmin={isAdmin}
          canPay={canResidentPay}
          onClose={() => setModal(null)}
          onMarkPaid={() => setModal({ type: "markPaid", fee: modal.fee })}
          onEdit={() => setModal({ type: "edit", fee: modal.fee })}
        />
      )}
      {modal?.type === "markPaid" && (
        <MarkPaidModal
          fee={modal.fee}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
  <style jsx>{`
    @media (max-width: 640px) {
      .desktop-table {
        display: none !important;
      }
      .mobile-cards {
        display: block !important;
      }
    }
    @media (min-width: 641px) {
      .mobile-cards {
        display: none !important;
      }
      .desktop-table {
        display: block !important;
      }
    }
  `}</style>;
    </div>
  );

}
