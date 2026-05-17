'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useComplaints } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function NewComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createComplaint, uploadImage } = useComplaints();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Loại tệp không hợp lệ",
        description: "Vui lòng chọn định dạng tệp hình ảnh (JPEG, PNG, v.v.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Tệp quá lớn",
        description: "Ảnh phải có dung lượng dưới 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: "Yêu cầu nhập mô tả",
        description: "Vui lòng cung cấp mô tả cho khiếu nại của bạn",
        variant: "destructive",
      });
      return;
    }

    if (description.trim().length < 20) {
      toast({
        title: "Mô tả quá ngắn",
        description: "Vui lòng cung cấp mô tả chi tiết hơn (ít nhất 20 ký tự)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | undefined;

    try {
      // Upload image if selected
      if (selectedFile) {
        setUploadProgress('uploading');
        try {
          imageUrl = await uploadImage(selectedFile);
          setUploadProgress('done');
        } catch (uploadError: any) {
          toast({
            title: "Tải ảnh lên không thành công",
            description:
              uploadError.message ||
              "Tải ảnh lên không thành công. Gửi bài mà không có ảnh.",
            variant: "destructive",
          });
          // Continue without image
        }
      }

      // Create complaint
      await createComplaint(description, imageUrl);

      toast({
        title: "Đã gửi đơn khiếu nại!",
        description: "Khiếu nại của bạn đã được gửi thành công.",
      });

      // Redirect to complaints list
      router.push('/complaints');
    } catch (error: any) {
      toast({
        title: "Nộp đơn không thành công",
        description:
          error.message || "Gửi khiếu nại không thành công. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('idle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/complaints">
          <Button variant="ghost" size="sm">
            ← Trở lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tạo đơn khiếu nại mới
          </h1>
          <p className="text-gray-600 mt-1">
            Hãy gửi khiếu nại mới đến ban quản lý.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Chi tiết khiếu nại</CardTitle>
          <CardDescription>
            Vui lòng mô tả chi tiết vấn đề của bạn. Bạn cũng có thể đính kèm
            hình ảnh nếu cần.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hãy mô tả chi tiết khiếu nại của bạn. Bao gồm địa điểm, vấn đề là gì và khi nào nó bắt đầu..."
                rows={5}
                className="resize-none"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                {description.length} / 1000 ký tự (tối thiểu 20 ký tự)
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Đính kèm hình ảnh ( không bắt buộc )</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {selectedFile?.name}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        disabled={isSubmitting}
                      >
                        Gỡ bỏ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative">
                    <span className="text-4xl mb-3 block">📷</span>
                    <p className="text-gray-600 mb-2">
                      Kéo và thả hình ảnh hoặc nhấp chuột để thêm.
                    </p>
                    <p className="text-sm text-gray-400">
                      Định dạng PNG, JPG, GIF, dung lượng tối đa 5MB.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      Chọn tệp
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress === "uploading" && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Đang tải ảnh lên...</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Đang gửi...
                  </>
                ) : (
                  "Gửi khiếu nại"
                )}
              </Button>
              <Link href="/complaints">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Hủy bỏ
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="max-w-2xl bg-blue-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>💡</span> Mẹo để giải quyết vấn đề nhanh hơn
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Hãy nêu rõ vị trí cụ thể (số căn hộ, khu vực chung, v.v.)</p>
          <p>• Hãy mô tả thời điểm vấn đề bắt đầu hoặc được phát hiện.</p>
          <p>
            • Hãy cung cấp bất kỳ thông tin chi tiết nào có liên quan có thể
            giúp giải quyết vấn đề.
          </p>
          <p>• Nếu vấn đề có thể nhìn thấy, hãy đính kèm ảnh rõ nét.</p>
        </CardContent>
      </Card>
    </div>
  );
}
