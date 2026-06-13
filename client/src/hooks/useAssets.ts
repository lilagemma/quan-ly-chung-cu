'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Asset } from '@/types';

export interface AssetStats {
  total: number;
  working: number;
  under_maintenance: number;
  not_working: number;
}

export interface AssetsResponse {
  success: boolean;
  data: Asset[];
  stats: AssetStats;
}

export interface AssetResponse {
  success: boolean;
  data: Asset;
  message?: string;
}

export interface CreateAssetData {
  name: string;
  type: 'lift' | 'water_pump' | 'generator';
  status?: 'working' | 'under_maintenance' | 'not_working';
  location?: string;
}

export interface UpdateAssetData {
  name?: string;
  location?: string;
}

export interface AddServiceData {
  description: string;
  done_by: string;
  date?: string;
}

export function useAssets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all assets
  const getAssets = useCallback(async (
    status?: string,
    type?: string
  ): Promise<AssetsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      
      const queryString = params.toString();
      const response = await api.get(`/assets${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể tải danh sách tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single asset by ID
  const getAssetById = useCallback(async (id: string): Promise<AssetResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/assets/${id}`);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể tải thông tin tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new asset (Manager only)
  const createAsset = useCallback(async (data: CreateAssetData): Promise<AssetResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/assets', data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Không thể tạo tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update asset details (Manager only)
  const updateAsset = useCallback(async (
    id: string,
    data: UpdateAssetData
  ): Promise<AssetResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/assets/${id}`, data);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể cập nhật tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update asset status (Manager/Admin)
  const updateAssetStatus = useCallback(async (
    id: string,
    status: 'working' | 'under_maintenance' | 'not_working'
  ): Promise<AssetResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/assets/${id}/status`, { status });
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể cập nhật trạng thái tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add service entry (Manager only)
  const addServiceEntry = useCallback(async (
    id: string,
    data: AddServiceData
  ): Promise<AssetResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/assets/${id}/service`, data);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể thêm bản ghi bảo trì";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete asset (Manager only)
  const deleteAsset = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/assets/${id}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Không thể xóa tài sản";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    updateAssetStatus,
    addServiceEntry,
    deleteAsset,
  };
}
