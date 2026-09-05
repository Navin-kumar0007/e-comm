'use client';
import { useState } from 'react';
import { approveRecipe, deleteRecipe } from '@/app/actions/admin-recipes';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2, Edit, Printer } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function RecipesClient({ initialRecipes }: { initialRecipes: any[] }) {
  const [recipes, setRecipes] = useState(initialRecipes);

  const handleApprove = async (id: string) => {
    await approveRecipe(id);
    setRecipes(recipes.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    toast.success('Recipe approved!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await deleteRecipe(id);
    setRecipes(recipes.filter(r => r.id !== id));
    toast.success('Recipe deleted!');
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="p-4 font-medium text-zinc-500">Title</th>
            <th className="p-4 font-medium text-zinc-500">Category</th>
            <th className="p-4 font-medium text-zinc-500">Status</th>
            <th className="p-4 font-medium text-zinc-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {recipes.map(r => (
            <tr key={r.id}>
              <td className="p-4 font-medium">{r.title}</td>
              <td className="p-4 text-zinc-500">{r.category}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status}
                </span>
              </td>
              <td className="p-4 flex gap-2 justify-end">
                {r.status === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <CheckCircle2 size={16} className="mr-1" /> Approve
                  </Button>
                )}
                <Link href={`/admin/recipes/print/${r.id}`}>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Printer size={16} className="mr-1" /> Print Card
                  </Button>
                </Link>
                <Link href={`/admin/recipes/edit/${r.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
          {recipes.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-zinc-500">No recipes found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
