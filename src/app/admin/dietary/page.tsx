import { getDietaryTags } from '@/app/actions/admin-dietary';
import { DietaryClient } from './dietary-client';

export default async function DietaryAdminPage() {
  const tags = await getDietaryTags();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Dietary Profiles</h1>
        <p className="text-muted-foreground">Manage dietary tags (Vegan, Keto, etc.) assigned to products.</p>
      </div>
      
      <DietaryClient initialTags={tags} />
    </div>
  );
}
