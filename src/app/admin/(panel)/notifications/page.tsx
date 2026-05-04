import NotificationsForm from '@/components/admin/NotificationsForm';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">通知設定</h1>
        <p className="text-ink-500 text-sm">
          設定客戶詢問送達時的即時推播。下方有完整教學，第一次設定請依步驟進行。
        </p>
      </div>
      <NotificationsForm />
    </div>
  );
}
