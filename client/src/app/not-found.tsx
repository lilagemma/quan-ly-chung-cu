import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-8">
          {"Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển."}
        </p>
        <Link href="/">
          <Button>Đi đến trang chính</Button>
        </Link>
      </div>
    </div>
  );
}
