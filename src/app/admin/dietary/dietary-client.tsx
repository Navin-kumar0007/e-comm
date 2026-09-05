'use client';
import { useState } from 'react';
import { createDietaryTag, deleteDietaryTag } from '@/app/actions/admin-dietary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function DietaryClient({ initialTags }: { initialTags: any[] }) {
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTag = await createDietaryTag({ name, slug, description });
      setTags([newTag, ...tags]);
      setName('');
      setSlug('');
      setDescription('');
      toast.success('Dietary Profile Created!');
    } catch (error) {
      toast.error('Failed to create tag. Slug might be taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will remove the tag from all products.')) return;
    await deleteDietaryTag(id);
    setTags(tags.filter(t => t.id !== id));
    toast.success('Tag deleted!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 sticky top-24">
          <h2 className="text-xl font-semibold mb-4">Create New Profile</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input 
                value={name} 
                onChange={e => { setName(e.target.value); generateSlug(e.target.value); }}
                placeholder="e.g. Vegan" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input 
                value={slug} 
                onChange={e => setSlug(e.target.value)}
                placeholder="vegan" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Input 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Does not contain animal products" 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Profile'} <Plus className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tags.map(t => (
                <tr key={t.id}>
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4 text-muted-foreground">{t.slug}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">No dietary profiles yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
