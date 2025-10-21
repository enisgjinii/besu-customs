# 3D Models Integration with Admin Panel

This integration connects your existing `models.json` file with a dynamic admin panel that allows real-time control of which 3D models are visible in your configurator.

## 🚀 **What's Been Built**

### 1. **Database Integration**

- ✅ Supabase table `models` with all your existing models
- ✅ Row Level Security (RLS) for proper access control
- ✅ Migration scripts to import your `models.json` data
- ✅ Automatic categorization and tagging

### 2. **Admin Dashboard Features**

- ✅ **Models Management Table** - Toggle models on/off in real-time
- ✅ **Statistics Dashboard** - Visual charts and metrics
- ✅ **Sync Status Monitor** - Real-time sync between admin and configurator
- ✅ **Configurator Preview** - See exactly what users see
- ✅ **Search & Filter** - Find models by name, category, or status

### 3. **Real-Time Sync System**

- ✅ **API Endpoints** - RESTful API for model management
- ✅ **Sync Service** - Keeps database and configurator in sync
- ✅ **Event System** - Real-time updates between admin and configurator
- ✅ **Import/Export** - Sync with your existing `models.json`

## 📋 **Setup Instructions**

### Step 1: Database Setup

1. Go to your Supabase dashboard
2. Run the SQL migration: `supabase/migrations/001_create_models_table.sql`
3. Import your existing models: `node scripts/import-models.js`
4. Run the generated migration: `supabase/migrations/002_import_existing_models.sql`

### Step 2: Admin Panel Access

1. Navigate to `/admin` and sign in with your Supabase auth
2. Go to "3D Models" in the sidebar
3. Use the "Import from JSON" button to sync your existing models

### Step 3: Configurator Integration

Your configurator at `http://localhost:3000` will now:

- Only show models marked as "Active" in the admin panel
- Update in real-time when you toggle models on/off
- Prioritize "Featured" models

## 🎛️ **How to Use**

### Toggle Model Visibility

1. Go to `/admin/models` → "Manage Models" tab
2. Use the switch in the "Status" column to show/hide models
3. Changes reflect immediately in the 3D configurator

### Feature Models

1. Click the star icon to feature/unfeature models
2. Featured models can be highlighted in your configurator

### Monitor Sync Status

1. Go to "Sync Status" tab to see real-time connection status
2. Use "Sync Now" if configurator gets out of sync
3. View live preview of what users see

### Search and Filter

- **Search**: Type model names or descriptions
- **Category Filter**: Filter by Jerseys, Bags, Hoodies, etc.
- **Status Filter**: Show only Active, Inactive, or Featured models

## 🔄 **API Endpoints**

### Get Active Models (for your configurator)

```javascript
// Get only active models for the 3D configurator
const response = await fetch("/api/models/sync");
const { products } = await response.json();
```

### Toggle Model Status

```javascript
// Toggle a model on/off
await fetch("/api/models", {
  method: "PATCH",
  body: JSON.stringify({ is_active: true }),
  headers: { "Content-Type": "application/json" },
});
```

### Import from models.json

```javascript
// Sync database with your models.json file
await fetch("/api/models/sync", {
  method: "POST",
  body: JSON.stringify({ action: "import_from_json" }),
});
```

## 🔧 **Integration with Your Store**

Your Zustand store (`lib/store.ts`) has been enhanced with:

- `setProducts()` - Update products dynamically
- `refreshProducts()` - Sync with database
- Real-time event listeners for admin changes

### Example Usage in Your Components

```typescript
import { useConfiguratorStore } from '@/lib/store'
import { useModelsSync } from '@/hooks/use-models-sync'

function YourComponent() {
  const { products } = useConfiguratorStore()
  const { syncProducts } = useModelsSync()

  // Products will automatically update when admin toggles models
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.title}</div>
      ))}
    </div>
  )
}
```

## 📊 **Current Model Categories**

Your models have been automatically categorized:

- **Jerseys** (8 models) - Basketball, Baseball jerseys
- **Shorts** (6 models) - Various athletic shorts
- **Bags** (2 models) - Backpack, Duffle bag
- **Hoodies** (2 models) - Pullover hoodies
- **Polos** (2 models) - Long/short sleeve polos
- **Soccer** (2 models) - Crew neck, V-neck jerseys
- **Track & Field** (5 models) - Athletic wear
- **Volleyball** (5 models) - Tops and shorts
- **Caps** (1 model) - Baseball caps
- **Baseball** (1 model) - Baseball specific items

## 🎯 **Key Features**

### Real-Time Updates

- Toggle a model off in admin → Immediately hidden in configurator
- Toggle a model on in admin → Immediately visible in configurator
- No page refresh needed

### Visual Feedback

- Green badges for active models
- Star icons for featured models
- Real-time sync status indicators
- Live configurator preview

### Search & Organization

- Search by model name or description
- Filter by category (Jerseys, Bags, etc.)
- Filter by status (Active, Inactive, Featured)
- Sort by creation date, name, or category

### Sync Monitoring

- Real-time connection status to configurator
- Automatic sync status checking
- Manual sync triggers
- Visual indicators for sync health

## 🚀 **Next Steps**

1. **Run the database migrations** to set up your models table
2. **Import your existing models** using the provided scripts
3. **Test the admin panel** by toggling models on/off
4. **Verify the configurator updates** in real-time
5. **Customize the categories** and tags as needed

Your 3D configurator is now fully manageable through the admin panel! 🎉
