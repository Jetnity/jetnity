import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 h-full bg-gray-50 border-r px-4 py-6 space-y-4">
      <nav className="flex flex-col space-y-2">
        <Link href="/admin/dashboard" className="font-medium hover:text-blue-600">
          Dashboard
        </Link>
        <Link href="/admin/users" className="font-medium hover:text-blue-600">
          Nutzer
        </Link>
        <Link href="/admin/sessions" className="font-medium hover:text-blue-600">
          Sessions
        </Link>
        <Link href="/admin/reports" className="font-medium hover:text-blue-600">
          Reports
        </Link>
        {/* Weitere Links nach Bedarf */}
      </nav>
    </aside>
  );
}