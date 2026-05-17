'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Emergency } from '@/hooks/useEmergency';
import { Siren, MapPin, Clock, X, Loader2 } from 'lucide-react';

interface EmergencyBannerProps {
  emergency?: Emergency | null;
  loading?: boolean;
  onResolve?: (id: string) => Promise<void>;
  canResolve?: boolean;
  resolveLoading?: boolean;
}

export default function EmergencyBanner({
  emergency,
  loading = false,
  onResolve,
  canResolve = false,
  resolveLoading = false,
}: EmergencyBannerProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);

  // Calculate time ago and update every minute
  useEffect(() => {
    if (!emergency) return;

    const calculateTimeAgo = () => {
      const now = new Date();
      const triggered = new Date(emergency.triggered_at);
      const diffInSeconds = Math.floor((now.getTime() - triggered.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "Vừa xong";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
      }
    };

    setTimeAgo(calculateTimeAgo());

    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [emergency]);

  const handleResolve = async () => {
    if (!emergency || !onResolve) return;
    setIsResolving(true);
    try {
      await onResolve(emergency._id);
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (!emergency || emergency.status !== 'active') {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg shadow-lg">
      {/* Animated pulse background */}
      <div className="absolute inset-0 bg-red-400 animate-pulse opacity-30"></div>

      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Animated alert icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Siren className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                KHẨN CẤP THANG MÁY
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </h3>
              <p className="text-red-100 text-sm sm:text-base mt-1">
                Có người bị kẹt trong thang máy! Cần trợ giúp ngay lập tức.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <span className="bg-white/20 px-2 py-0.5 rounded">
                  Căn hộ {emergency.flat_no || emergency.triggered_by?.flat_no}
                </span>
                <span className="text-red-200">{timeAgo}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <Link href="/emergency">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-red-600 hover:bg-red-50"
              >
                Xem chi tiết
              </Button>
            </Link>
            {canResolve && onResolve && (
              <Button
                variant="outline"
                size="sm"
                className="border-white text-red-600 hover:bg-white/20"
                onClick={handleResolve}
                disabled={isResolving || resolveLoading}
              >
                {isResolving || resolveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Giải quyết...
                  </>
                ) : (
                  "Đánh dấu đã giải quyết"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress bar animation */}
      <div className="h-1 bg-white/20">
        <div className="h-full bg-white/40 animate-[pulse_2s_ease-in-out_infinite] w-full origin-left"></div>
      </div>
    </div>
  );
}
