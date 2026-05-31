"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { Pencil, Trash2, Plus } from "lucide-react";

// Types
interface Expense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  month: number;
  year: number;
  status: "pending" | "completed" | "cancelled";
  payee?: string;
  receipt_number?: string;
  note?: string;
}

interface DebtRecord {
  flat_no: string;
  totalOwed: number;
  monthsOverdue: number;
  lastUnpaidMonth?: { month: number; year: number };
  status: string;
}

interface FinancialSummary {
  year: number;
  monthlyData: {
    month: number;
    revenue: number;
    pendingRevenue: number;
    expense: number;
    net: number;
  }[];
  expenseByCategory: { _id: string; total: number }[];
  totalRevenue: number;
  totalExpense: number;
}

const categoryLabels: Record<string, string> = {
  dien_nuoc: "💡 Điện nước",
  bao_tri: "🔧 Bảo trì",
  luong_nhan_vien: "👥 Lương nhân viên",
  thue: "📄 Thuế",
  van_phong_pham: "✏️ Văn phòng phẩm",
  tiec_hoi: "🎉 Sự kiện",
  khac: "📦 Khác",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Đã hoàn thành", color: "bg-green-500" },
  pending: { label: "Chờ duyệt", color: "bg-yellow-500" },
  cancelled: { label: "Đã hủy", color: "bg-gray-500" },
};

export default function AdminPaymentsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [filterMonth, setFilterMonth] = useState<string>(""); // "" = all
  const [filterCategory, setFilterCategory] = useState<string>(""); // "" = all
  const [filterStatus, setFilterStatus] = useState<string>(""); // "" = all
  const [searchTitle, setSearchTitle] = useState("");

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    title: "",
    category: "khac",
    amount: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "completed",
    payee: "",
    note: "",
  });

  // Fetch expenses with current filters
  const fetchExpenses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append("year", filterYear);
      if (filterMonth) params.append("month", filterMonth);
      if (filterCategory) params.append("category", filterCategory);
      if (filterStatus) params.append("status", filterStatus);
      if (searchTitle) params.append("search", searchTitle);
      const res = await api.get(`/admin/expenses?${params.toString()}`);
      setExpenses(res.data.data);
    } catch (error) {
      console.error("Lỗi tải chi phí:", error);
      setExpenses([]);
    }
  }, [
    filterYear,
    filterMonth,
    filterCategory,
    filterStatus,
    searchTitle,
    isAdmin,
  ]);

  // Fetch debt tracking (công nợ cư dân)
  const fetchDebtTracking = useCallback(async () => {
    try {
      const res = await api.get("/service-fees/all");
      const allFees = res.data.data || [];
      const unpaid = allFees.filter((fee: any) => fee.status !== "paid");
      const debtMap = new Map<
        string,
        { total: number; months: number; last: any }
      >();
      unpaid.forEach((fee: any) => {
        const flat = fee.flat_no;
        const existing = debtMap.get(flat) || {
          total: 0,
          months: 0,
          last: null,
        };
        existing.total += fee.total_amount;
        existing.months++;
        existing.last = { month: fee.month, year: fee.year };
        debtMap.set(flat, existing);
      });
      const debtList: DebtRecord[] = Array.from(debtMap.entries()).map(
        ([flat_no, data]) => ({
          flat_no,
          totalOwed: data.total,
          monthsOverdue: data.months,
          lastUnpaidMonth: data.last,
          status: data.months > 1 ? "Quá hạn nhiều tháng" : "Chưa thanh toán",
        }),
      );
      setDebts(debtList);
    } catch (error) {
      console.error("Lỗi tải công nợ:", error);
      setDebts([]);
    }
  }, []);

  // Fetch financial summary (thu - chi)
  const fetchSummary = useCallback(async () => {
    if (!filterYear) return;
    try {
      const res = await api.get(
        `/admin/reports/financial-summary?year=${filterYear}`,
      );
      setSummary(res.data.data);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
      setSummary(null);
    }
  }, [filterYear]);

  // Auto fetch when filters change
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchExpenses();
      fetchSummary();
    }
  }, [fetchExpenses, fetchSummary, isAuthenticated, isAdmin]);

  // Fetch debts once on load
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchDebtTracking();
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, fetchDebtTracking]);

  // Handlers for CRUD
  const handleAddExpense = async () => {
    try {
      const payload = {
        ...expenseForm,
        month: Number(expenseForm.month),
        year: Number(expenseForm.year),
        amount: Number(expenseForm.amount),
      };
      await api.post("/admin/expenses", payload);
      setIsAddDialogOpen(false);
      fetchExpenses();
      fetchSummary();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi thêm chi phí");
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    try {
      const payload = {
        ...expenseForm,
        month: Number(expenseForm.month),
        year: Number(expenseForm.year),
        amount: Number(expenseForm.amount),
      };
      await api.put(`/admin/expenses/${editingExpense._id}`, payload);
      setIsEditDialogOpen(false);
      fetchExpenses();
      fetchSummary();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi cập nhật chi phí");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khoản chi này?")) return;
    try {
      await api.delete(`/admin/expenses/${id}`);
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi xóa chi phí");
    }
  };

  const resetForm = () => {
    setExpenseForm({
      title: "",
      category: "khac",
      amount: 0,
      expense_date: new Date().toISOString().slice(0, 10),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: "completed",
      payee: "",
      note: "",
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date.slice(0, 10),
      month: expense.month,
      year: expense.year,
      status: expense.status,
      payee: expense.payee || "",
      note: expense.note || "",
    });
    setIsEditDialogOpen(true);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      expenses.map((e) => ({
        "Tiêu đề": e.title,
        "Danh mục": categoryLabels[e.category] || e.category,
        "Số tiền (VNĐ)": e.amount,
        "Ngày chi": new Date(e.expense_date).toLocaleDateString("vi-VN"),
        "Trạng thái": statusConfig[e.status]?.label,
        "Người nhận": e.payee,
        "Ghi chú": e.note,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chi phí");
    XLSX.writeFile(workbook, `chi_phi_${filterYear}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // ========== HOOKS (useMemo) - Đặt trước các return ==========
  const rawChartData =
    summary?.monthlyData.map((m) => ({
      tháng: `T${m.month}`,
      monthNum: m.month,
      Thu: m.revenue,
      Chi: m.expense,
      "Lợi nhuận": m.net,
    })) || [];

  const monthlyChartData = filterMonth
    ? rawChartData.filter((item) => item.monthNum === parseInt(filterMonth))
    : rawChartData;

  const pieData = useMemo(() => {
    if (!expenses.length) return [];
    const categoryMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const cat = exp.category;
      const amount = exp.amount;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
    });
    return Array.from(categoryMap.entries()).map(([cat, total]) => ({
      name: categoryLabels[cat] || cat,
      value: total,
    }));
  }, [expenses]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];
  // ========== KẾT THÚC HOOKS ==========

  // Kiểm tra quyền và loading sau tất cả hooks
  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-500">
        Không có quyền truy cập
      </div>
    );
  }

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              💰 Quản lý chi phí
            </h1>
            <p className="text-sm text-gray-500">
              Theo dõi thu – chi, công nợ cư dân
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              📎 Xuất Excel
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              🖨️ In báo cáo
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600">
                  <Plus className="mr-1 h-4 w-4" /> Thêm khoản chi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Thêm khoản chi mới</DialogTitle>
                </DialogHeader>
                <ExpenseFormFields
                  form={expenseForm}
                  setForm={setExpenseForm}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleAddExpense}>Lưu</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bộ lọc */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div>
              <Label>Năm</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tháng</Label>
              <Select
                value={filterMonth === "" ? "all" : filterMonth}
                onValueChange={(val) =>
                  setFilterMonth(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Danh mục</Label>
              <Select
                value={filterCategory === "" ? "all" : filterCategory}
                onValueChange={(val) =>
                  setFilterCategory(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select
                value={filterStatus === "" ? "all" : filterStatus}
                onValueChange={(val) =>
                  setFilterStatus(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Tìm kiếm</Label>
              <Input
                placeholder="Theo tiêu đề, người nhận..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
            </div>
            <Button onClick={() => fetchExpenses()} className="mt-6">
              Lọc
            </Button>
          </CardContent>
        </Card>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Tổng thu"
            value={summary?.totalRevenue || 0}
            unit="đ"
            color="text-green-600"
          />
          <StatCard
            title="Tổng chi"
            value={summary?.totalExpense || 0}
            unit="đ"
            color="text-red-600"
          />
          <StatCard
            title="Lợi nhuận ròng"
            value={(summary?.totalRevenue || 0) - (summary?.totalExpense || 0)}
            unit="đ"
            color={
              (summary?.totalRevenue || 0) - (summary?.totalExpense || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }
          />
          <StatCard
            title="Công nợ cư dân"
            value={debts.reduce((s, d) => s + d.totalOwed, 0)}
            unit="đ"
            color="text-orange-600"
          />
        </div>

        {/* Hiển thị thêm thống kê theo tháng nếu có lọc */}
        {filterMonth && summary && (
          <div className="bg-blue-50 rounded-xl p-4 flex gap-6">
            <div>
              <p className="text-xs text-gray-500">Thu tháng {filterMonth}</p>
              <p className="text-xl font-bold text-green-600">
                {summary.monthlyData
                  .find((m) => m.month === parseInt(filterMonth))
                  ?.revenue.toLocaleString("vi-VN") || 0}{" "}
                đ
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chi tháng {filterMonth}</p>
              <p className="text-xl font-bold text-red-600">
                {summary.monthlyData
                  .find((m) => m.month === parseInt(filterMonth))
                  ?.expense.toLocaleString("vi-VN") || 0}{" "}
                đ
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Lợi nhuận tháng {filterMonth}
              </p>
              <p className="text-xl font-bold text-blue-600">
                {(() => {
                  const m = summary.monthlyData.find(
                    (m) => m.month === parseInt(filterMonth),
                  );
                  return m
                    ? (m.revenue - m.expense).toLocaleString("vi-VN")
                    : 0;
                })()}{" "}
                đ
              </p>
            </div>
          </div>
        )}

        {/* Biểu đồ và danh sách */}
        <Tabs defaultValue="charts">
          <TabsList>
            <TabsTrigger value="charts">📊 Biểu đồ</TabsTrigger>
            <TabsTrigger value="expenses">📋 Danh sách chi phí</TabsTrigger>
            <TabsTrigger value="debts">⚠️ Công nợ cư dân</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Biểu đồ Thu – Chi{" "}
                    {filterMonth ? `(tháng ${filterMonth})` : "(cả năm)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tháng" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `${value?.toLocaleString()} đ`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Thu"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Chi"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Lợi nhuận"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Cơ cấu chi phí{" "}
                    {filterMonth
                      ? `(tháng ${filterMonth})`
                      : filterYear
                        ? `(năm ${filterYear})`
                        : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value?.toLocaleString()} đ`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>
                  Thu – Chi chi tiết{" "}
                  {filterMonth ? `(tháng ${filterMonth})` : "(cả năm)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tháng" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `${value?.toLocaleString()} đ`}
                    />
                    <Legend />
                    <Bar dataKey="Thu" fill="#10b981" />
                    <Bar dataKey="Chi" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Ngày chi</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Người nhận</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp._id}>
                        <TableCell className="font-medium">
                          {exp.title}
                        </TableCell>
                        <TableCell>
                          {categoryLabels[exp.category] || exp.category}
                        </TableCell>
                        <TableCell className="text-right">
                          {exp.amount.toLocaleString("vi-VN")} đ
                        </TableCell>
                        <TableCell>
                          {new Date(exp.expense_date).toLocaleDateString(
                            "vi-VN",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[exp.status]?.color}>
                            {statusConfig[exp.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{exp.payee || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(exp)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(exp._id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {expenses.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-gray-400"
                        >
                          Chưa có dữ liệu chi phí
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debts">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Căn hộ</TableHead>
                      <TableHead className="text-right">Nợ gốc (đ)</TableHead>
                      <TableHead>Số tháng chậm</TableHead>
                      <TableHead>Kỳ chưa thanh toán gần nhất</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debts.map((debt) => (
                      <TableRow key={debt.flat_no}>
                        <TableCell className="font-mono font-bold">
                          {debt.flat_no}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {debt.totalOwed.toLocaleString("vi-VN")} đ
                        </TableCell>
                        <TableCell>
                          {debt.monthsOverdue} tháng
                          {debt.monthsOverdue > 2 && (
                            <Badge variant="destructive" className="ml-2">
                              Nghiêm trọng
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {debt.lastUnpaidMonth
                            ? `T${debt.lastUnpaidMonth.month}/${debt.lastUnpaidMonth.year}`
                            : "—"}
                        </TableCell>
                        <TableCell>{debt.status}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() =>
                              window.open(
                                `/service-fees?flat=${debt.flat_no}`,
                                "_blank",
                              )
                            }
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {debts.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-green-600"
                        >
                          🎉 Không có cư dân nào nợ phí!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khoản chi</DialogTitle>
          </DialogHeader>
          <ExpenseFormFields form={expenseForm} setForm={setExpenseForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleEditExpense}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component tái sử dụng cho form nhập chi phí
function ExpenseFormFields({
  form,
  setForm,
}: {
  form: Partial<Expense>;
  setForm: (f: Partial<Expense>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Tiêu đề</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Danh mục</Label>
        <Select
          value={form.category}
          onValueChange={(val) => setForm({ ...form, category: val })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Số tiền (VNĐ)</Label>
        <Input
          type="number"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: parseFloat(e.target.value) })
          }
        />
      </div>
      <div>
        <Label>Ngày chi</Label>
        <Input
          type="date"
          value={form.expense_date?.slice(0, 10)}
          onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
        />
      </div>
      <div>
        <Label>Người nhận</Label>
        <Input
          value={form.payee}
          onChange={(e) => setForm({ ...form, payee: e.target.value })}
        />
      </div>
      <div>
        <Label>Trạng thái</Label>
        <Select
          value={form.status}
          onValueChange={(val: any) => setForm({ ...form, status: val })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="completed">Đã hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Ghi chú</Label>
        <Textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, color }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          {unit && ` ${unit}`}
        </p>
      </CardContent>
    </Card>
  );
}
