"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getApartmentsList, getApartmentDetail } from "@/lib/api";
import { FLAT_NUMBERS } from "@/lib/constants";
import {
  Users,
  Home,
  BarChart3,
  Search,
  ArrowUpDown,
  ChevronRight,
  Building2,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface FlatDetail {
  flat_no: string;
  memberCount: number;
  headName?: string;
}

type SortField = "flat_no" | "memberCount" | "headName";
type SortOrder = "asc" | "desc";

// Component biểu đồ tròn đơn giản
const DonutChart = ({
  occupied,
  empty,
}: {
  occupied: number;
  empty: number;
}) => {
  const total = occupied + empty;
  if (total === 0)
    return <div className="text-center text-gray-400">Chưa có dữ liệu</div>;
  const occupiedPercent = (occupied / total) * 100;
  const emptyPercent = (empty / total) * 100;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const occupiedDash = (occupiedPercent / 100) * circumference;
  const emptyDash = (emptyPercent / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Nền (phần trống) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#fee2e2"
          strokeWidth="16"
        />
        {/* Phần đã ở */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="16"
          strokeDasharray={`${occupiedDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-500">tổng căn hộ</span>
      </div>
    </div>
  );
};

// Card thống kê
const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-3xl font-bold mt-2 text-gray-800">
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Bảng sắp xếp được
const SortableTable = ({ data, onSort, sortField, sortOrder }: any) => {
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "flat_no") {
        aVal = parseInt(aVal);
        bVal = parseInt(bVal);
      }
      if (sortField === "memberCount") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      if (sortField === "headName") {
        aVal = aVal || "";
        bVal = bVal || "";
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              <button
                onClick={() => onSort("flat_no")}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                Căn hộ <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              <button
                onClick={() => onSort("memberCount")}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                Số thành viên <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              <button
                onClick={() => onSort("headName")}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                Chủ hộ <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((flat: FlatDetail) => (
            <tr
              key={flat.flat_no}
              className="hover:bg-gray-50 transition group"
            >
              <td className="py-3 px-4 font-mono font-medium text-gray-800">
                {flat.flat_no}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                  <Users className="w-3 h-3" /> {flat.memberCount}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {flat.headName || "—"}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/residents?flat=${flat.flat_no}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                >
                  Chi tiết <ChevronRight className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-400">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function StatisticsPage() {
  const [occupiedFlats, setOccupiedFlats] = useState<string[]>([]);
  const [flatDetails, setFlatDetails] = useState<FlatDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("flat_no");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterType, setFilterType] = useState<"all" | "occupied" | "empty">(
    "all",
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const occupied = await getApartmentsList();
      setOccupiedFlats(occupied);
      const details: FlatDetail[] = [];
      for (const flat of occupied) {
        const detail = await getApartmentDetail(flat);
        const memberCount = detail.members?.length || 0;
        const head = detail.members?.find((m: any) => m.is_head === true);
        details.push({
          flat_no: flat,
          memberCount,
          headName: head?.full_name,
        });
      }
      setFlatDetails(details);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const emptyFlats = FLAT_NUMBERS.filter(
    (flat) => !occupiedFlats.includes(flat),
  );
  const totalResidents = flatDetails.reduce((sum, f) => sum + f.memberCount, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Lọc dữ liệu hiển thị theo searchTerm
  const filteredOccupied = flatDetails.filter((f) => {
    const flatNoMatch =
      f.flat_no?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const headNameMatch =
      f.headName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return flatNoMatch || headNameMatch;
  });
const filteredEmpty = emptyFlats.filter((f) =>
  f.toLowerCase().includes(searchTerm.toLowerCase()),
);
  const showOccupied = filterType !== "empty";
  const showEmpty = filterType !== "occupied";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">
              Thống kê
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            Tổng quan chi tiết về căn hộ và cư dân chung cư
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Tổng cư dân"
            value={totalResidents}
            icon={Users}
            color="from-blue-500 to-blue-600"
            subtitle="Đang sinh sống"
          />
          <StatCard
            title="Căn hộ đã ở"
            value={occupiedFlats.length}
            icon={Home}
            color="from-green-500 to-green-600"
            subtitle={`${emptyFlats.length} căn trống`}
          />
          <StatCard
            title="Tỉ lệ lấp đầy"
            value={Math.round(
              (occupiedFlats.length / FLAT_NUMBERS.length) * 100,
            )}
            icon={TrendingUp}
            color="from-purple-500 to-purple-600"
            subtitle="% tổng căn hộ"
          />
        </div>

        {/* Biểu đồ tròn + tổng quan nhanh */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-gray-800">
                Tình trạng căn hộ
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">
                    Đã có người ở: {occupiedFlats.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-300"></div>
                  <span className="text-sm text-gray-600">
                    Còn trống: {emptyFlats.length}
                  </span>
                </div>
              </div>
            </div>
            <DonutChart
              occupied={occupiedFlats.length}
              empty={emptyFlats.length}
            />
          </div>
        </div>

        {/* Bộ lọc & tìm kiếm */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filterType === "all"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả căn hộ
            </button>
            <button
              onClick={() => setFilterType("occupied")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filterType === "occupied"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Đã có người ở
            </button>
            <button
              onClick={() => setFilterType("empty")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filterType === "empty"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Còn trống
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo số phòng hoặc chủ hộ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition"
            />
          </div>
        </div>

        {/* Căn hộ đã có người ở */}
        {showOccupied && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Căn hộ đã có người ở
              </h2>
              <span className="ml-auto text-sm text-gray-400">
                {filteredOccupied.length} căn
              </span>
            </div>
            <SortableTable
              data={filteredOccupied}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
            />
          </div>
        )}

        {/* Căn hộ còn trống */}
        {showEmpty && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Căn hộ còn trống
              </h2>
              <span className="ml-auto text-sm text-gray-400">
                {filteredEmpty.length} căn
              </span>
            </div>
            {filteredEmpty.length === 0 ? (
              <p className="text-center text-green-600 py-8">
                🎉 Tất cả căn hộ đã có người ở!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredEmpty.map((flat) => (
                  <Link
                    key={flat}
                    href={`/admin/residents?flat=${flat}`}
                    className="group flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
                  >
                    <span className="text-xl font-mono font-bold text-gray-700 group-hover:text-blue-600">
                      {flat}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Chưa có cư dân
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
