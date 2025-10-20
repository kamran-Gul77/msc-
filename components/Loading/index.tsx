// components/Loading.tsx
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]">
      <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
