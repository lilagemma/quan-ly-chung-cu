"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getApartmentsList,
  getApartmentDetail,
  addMember,
  updateMember,
  deleteMember,
  getResidentStatistics,
} from "@/lib/api";
import {
  Users,
  Home,
  UserCheck,
  TrendingUp,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Loader2,
  Filter,
  ArrowUpDown,
  Building2,
  UserPlus,
  Phone,
  Calendar,
  IdCard,
} from "lucide-react";

// --- Card thống kê nâng cao ---
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// --- Component hiển thị thống kê giới tính dạng thanh tiến trình ---
const GenderStats = ({
  male,
  female,
  other,
}: {
  male: number;
  female: number;
  other: number;
}) => {
  const total = male + female + other;
  if (total === 0) return null;
  const malePercent = (male / total) * 100;
  const femalePercent = (female / total) * 100;
  const otherPercent = (other / total) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">GIỚI TÍNH</p>
        <UserCheck className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        <div style={{ width: `${malePercent}%` }} className="bg-blue-500" />
        <div style={{ width: `${femalePercent}%` }} className="bg-pink-500" />
        <div style={{ width: `${otherPercent}%` }} className="bg-gray-400" />
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Nam{" "}
          <strong>{male}</strong>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-pink-500" /> Nữ{" "}
          <strong>{female}</strong>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400" /> Khác{" "}
          <strong>{other}</strong>
        </div>
      </div>
    </div>
  );
};

// --- Component hiển thị danh sách căn hộ dạng lưới có hỗ trợ sắp xếp và tìm kiếm ---
const ApartmentGrid = ({
  apartments,
  memberCounts,
  onView,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  apartments: string[];
  memberCounts: Record<string, number>;
  onView: (flat: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortBy: "flat" | "members";
  onSortChange: (val: "flat" | "members") => void;
}) => {
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return apartments.filter((flat) => flat); // lọc bỏ null/undefined
    return apartments.filter(
      (flat) => flat && flat.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [apartments, searchTerm]);

  const sorted = useMemo(() => {
    if (sortBy === "flat") {
      return [...filtered].sort((a, b) => parseInt(a) - parseInt(b));
    } else {
      return [...filtered].sort(
        (a, b) => (memberCounts[b] || 0) - (memberCounts[a] || 0),
      );
    }
  }, [filtered, sortBy, memberCounts]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Danh sách căn hộ
          </h2>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {apartments.length} căn
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo số căn hộ..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-48 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => onSortChange("flat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sortBy === "flat"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Theo số <ArrowUpDown className="w-3 h-3 inline ml-1" />
            </button>
            <button
              onClick={() => onSortChange("members")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sortBy === "members"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Theo số thành viên <ArrowUpDown className="w-3 h-3 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Không tìm thấy căn hộ nào
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sorted.map((flat) => (
              <div
                key={flat}
                onClick={() => onView(flat)}
                className="group bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-200"
              >
                <div className="text-2xl font-mono font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {flat}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {memberCounts[flat] || 0}{" "}
                    thành viên
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ResidentManagementPage() {
  const searchParams = useSearchParams();
  const flatParam = searchParams.get("flat");
  const router = useRouter();
  const hasOpenedFromParam = useRef(false);

  // State
  const [apartments, setApartments] = useState<string[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"flat" | "members">("flat");
  const [selectedFlat, setSelectedFlat] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    flat_no: "",
    full_name: "",
    relationship: "other",
    gender: "other",
    phone: "",
    is_head: false,
    move_in_date: new Date().toISOString().split("T")[0],
    id_card_number: "",
    note: "",
  });

  // Fetch data
  const fetchApartments = async () => {
    const data = await getApartmentsList();
    const validData = (data || []).filter(
      (flat) => flat && typeof flat === "string",
    );
    setApartments(validData);
    const counts: Record<string, number> = {};
    for (const flat of validData) {
      const detail = await getApartmentDetail(flat);
      counts[flat] = detail.members?.length || 0;
    }
    setMemberCounts(counts);
    return validData;
  };

  const fetchStatistics = async () => {
    try {
      const data = await getResidentStatistics();
      setStats(data);
    } catch (error) {
      console.error("Lỗi lấy thống kê", error);
    }
  };

  const handleViewApartment = async (flatNo: string) => {
    const data = await getApartmentDetail(flatNo);
    setMembers(data.members || []);
    setSelectedFlat(flatNo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFlat(null);
    if (flatParam) {
      router.replace("/admin/residents");
    }
    hasOpenedFromParam.current = false;
  };

  // Auto open modal from query param
  useEffect(() => {
    if (
      flatParam &&
      apartments.length > 0 &&
      !showModal &&
      !loading &&
      !hasOpenedFromParam.current
    ) {
      if (apartments.includes(flatParam)) {
        hasOpenedFromParam.current = true;
        handleViewApartment(flatParam);
      }
    }
  }, [flatParam, apartments, showModal, loading]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchApartments(), fetchStatistics()]).finally(() =>
      setLoading(false),
    );
  }, []);

  // Reset flag khi flatParam biến mất
  useEffect(() => {
    if (!flatParam) {
      hasOpenedFromParam.current = false;
    }
  }, [flatParam]);

  // CRUD functions
  const openAddMemberForm = () => {
    setEditingMember(null);
    setFormData({
      flat_no: selectedFlat || "",
      full_name: "",
      relationship: "other",
      gender: "other",
      phone: "",
      is_head: false,
      move_in_date: new Date().toISOString().split("T")[0],
      id_card_number: "",
      note: "",
    });
    setShowMemberForm(true);
  };

  const openEditMemberForm = (member: any) => {
    setEditingMember(member);
    setFormData({
      flat_no: member.flat_no,
      full_name: member.full_name,
      relationship: member.relationship,
      gender: member.gender,
      phone: member.phone || "",
      is_head: member.is_head,
      move_in_date: member.move_in_date
        ? member.move_in_date.split("T")[0]
        : "",
      id_card_number: member.id_card_number || "",
      note: member.note || "",
    });
    setShowMemberForm(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitMemberForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await updateMember(editingMember._id, formData);
        alert("✅ Cập nhật thành công!");
      } else {
        await addMember(formData);
        alert("✅ Thêm thành viên thành công!");
      }
      setShowMemberForm(false);
      if (selectedFlat) {
        const data = await getApartmentDetail(selectedFlat);
        setMembers(data.members || []);
        // Cập nhật lại số lượng thành viên cho căn hộ đó
        const newCounts = {
          ...memberCounts,
          [selectedFlat]: data.members?.length || 0,
        };
        setMemberCounts(newCounts);
      }
      fetchApartments();
      fetchStatistics();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await deleteMember(memberId);
      alert("✅ Xóa thành công");
      if (selectedFlat) {
        const data = await getApartmentDetail(selectedFlat);
        setMembers(data.members || []);
        const newCounts = {
          ...memberCounts,
          [selectedFlat]: data.members?.length || 0,
        };
        setMemberCounts(newCounts);
      }
      fetchApartments();
      fetchStatistics();
    } catch (error: any) {
      alert(error.message || "Xóa thất bại");
    }
  };

  const handleRefresh = async () => {
    setShowModal(false);
    setShowMemberForm(false);
    setSelectedFlat(null);
    setSearchTerm("");
    setMembers([]);
    setEditingMember(null);
    setLoading(true);
    try {
      await Promise.all([fetchApartments(), fetchStatistics()]);
    } catch (error) {
      console.error("Lỗi refresh:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const genderStats = {
    male: stats?.genderStats?.find((g: any) => g._id === "male")?.count || 0,
    female:
      stats?.genderStats?.find((g: any) => g._id === "female")?.count || 0,
    other: stats?.genderStats?.find((g: any) => g._id === "other")?.count || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              👨‍👩‍👧‍👦 Quản lý cư dân
            </h1>
            <p className="text-gray-500 mt-1">
              Quản lý thông tin cư dân theo từng căn hộ
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Thống kê nâng cao */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng căn hộ"
            value={stats?.totalApartments || 0}
            icon={Home}
            color="from-blue-500 to-blue-600"
            subtitle="Có cư dân sinh sống"
          />
          <StatCard
            title="Tổng cư dân"
            value={stats?.totalMembers || 0}
            icon={Users}
            color="from-emerald-500 to-emerald-600"
            subtitle="Thành viên đang hoạt động"
          />
          <StatCard
            title="Trung bình / hộ"
            value={stats?.avgMembers || 0}
            icon={TrendingUp}
            color="from-purple-500 to-purple-600"
            subtitle="Thành viên mỗi căn hộ"
          />
          <GenderStats
            male={genderStats.male}
            female={genderStats.female}
            other={genderStats.other}
          />
        </div>

        {/* Danh sách căn hộ với tìm kiếm và sắp xếp */}
        <ApartmentGrid
          apartments={apartments}
          memberCounts={memberCounts}
          onView={handleViewApartment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Modal chi tiết căn hộ (giữ nguyên chức năng) */}
      {showModal && selectedFlat && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-800">
                Căn hộ {selectedFlat}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <button
                onClick={openAddMemberForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm mb-6"
              >
                <UserPlus className="w-4 h-4" /> Thêm thành viên mới
              </button>
              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Chưa có thành viên nào trong căn hộ này
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Họ tên
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Vai trò
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Giới tính
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          SĐT
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">
                          Chủ hộ
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {members.map((member) => (
                        <tr
                          key={member._id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="py-3 px-4 font-medium">
                            {member.full_name}
                          </td>
                          <td className="py-3 px-4 capitalize text-gray-600">
                            {member.relationship}
                          </td>
                          <td className="py-3 px-4">
                            {member.gender === "male"
                              ? "Nam"
                              : member.gender === "female"
                                ? "Nữ"
                                : "Khác"}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {member.phone || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {member.is_head ? "✅" : "❌"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => openEditMemberForm(member)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form thêm/sửa thành viên */}
      {showMemberForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMemberForm(false);
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingMember ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
              </h3>
              <button
                onClick={() => setShowMemberForm(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={submitMemberForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số căn hộ *
                  </label>
                  <input
                    type="text"
                    name="flat_no"
                    value={formData.flat_no}
                    onChange={handleFormChange}
                    readOnly={!!editingMember}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  >
                    <option value="head">Chủ hộ</option>
                    <option value="spouse">Vợ / Chồng</option>
                    <option value="child">Con cái</option>
                    <option value="parent">Bố / Mẹ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày vào ở
                  </label>
                  <input
                    type="date"
                    name="move_in_date"
                    value={formData.move_in_date}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CMND/CCCD
                  </label>
                  <input
                    type="text"
                    name="id_card_number"
                    value={formData.id_card_number}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_head"
                    checked={formData.is_head}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <label className="text-sm font-medium">Là chủ hộ</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleFormChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  {editingMember ? "Cập nhật" : "Thêm thành viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
