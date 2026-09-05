import { prisma } from '@/lib/db/prisma';

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold mb-8">Customer Messages</h1>
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border/50">
            <tr>
              <th className="p-4 font-medium text-sm text-muted-foreground">Date</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">Name</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">Message</th>
              <th className="p-4 font-medium text-sm text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {messages.length > 0 ? messages.map(msg => (
              <tr key={msg.id} className="hover:bg-muted/20 transition-colors">
                <td className="p-4 text-sm">{new Date(msg.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="font-medium text-sm">{msg.name}</div>
                  <div className="text-xs text-muted-foreground">{msg.email}</div>
                </td>
                <td className="p-4 text-sm max-w-md truncate">{msg.message}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${msg.status === 'UNREAD' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {msg.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">No messages yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
