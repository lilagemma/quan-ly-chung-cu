import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ,

  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true, // Still send cookies for backwards compatibility
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage and add to header
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status } = error.response;

      // Unauthorized - will be handled by auth context
      if (status === 401) {
        // Don't redirect here, let the auth context handle it
      }

      // Forbidden - no permission
      if (status === 403) {
        console.error("Truy cập bị từ chối");
      }

      // Server error
      if (status >= 500) {
        console.error("Lỗi máy chủ");
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ===================== RESIDENT MANAGEMENT APIS =====================

/**
 * Lấy danh sách tất cả các căn hộ (flat_no duy nhất)
 */
export const getApartmentsList = async (): Promise<string[]> => {
  try {
    const response = await api.get("/residents/apartments");
    // Dựa trên backend trả về: { success: true, data: [...] }
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách căn hộ:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết căn hộ (thông tin + danh sách thành viên)
 * @param flatNo - số căn hộ (vd: "A101")
 */
export const getApartmentDetail = async (flatNo: string): Promise<any> => {
  try {
    const response = await api.get(`/residents/apartments/${flatNo}`);
    return response.data.data; // { flat_no, total_members, head_of_household, members }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết căn hộ:", error);
    throw error;
  }
};

/**
 * Thêm thành viên mới vào căn hộ (chỉ admin/manager)
 * @param memberData - dữ liệu thành viên (flat_no, full_name, relationship, ...)
 */
export const addMember = async (memberData: any): Promise<any> => {
  try {
    const response = await api.post("/residents/members", memberData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi thêm thành viên:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin thành viên
 * @param id - ID của thành viên
 * @param memberData - dữ liệu cần cập nhật
 */
export const updateMember = async (
  id: string,
  memberData: any,
): Promise<any> => {
  try {
    const response = await api.put(`/residents/members/${id}`, memberData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật thành viên:", error);
    throw error;
  }
};

/**
 * Xóa thành viên (xóa mềm: set is_active = false)
 * @param id - ID của thành viên
 */
export const deleteMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/residents/members/${id}`);
  } catch (error) {
    console.error("Lỗi khi xóa thành viên:", error);
    throw error;
  }
};

// src/lib/api.ts
export const getResidentStatistics = async (): Promise<any> => {
  try {
    const response = await api.get("/residents/statistics");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi lấy thống kê cư dân:", error);
    throw error;
  }
};

export const getDetailedStatistics = async (): Promise<any> => {
  try {
    const response = await api.get("/residents/detailed-statistics");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi lấy thống kê chi tiết:", error);
    throw error;
  }
};