# 3D Models Management System

This document describes the 3D models management system integrated into the admin dashboard.

## Features

### 1. Database Schema

- **Table**: `models`
- **Fields**:
  - `id`: Unique identifier (UUID)
  - `name`: Model name
  - `description`: Model description
  - `file_path`: Path to the 3D model file
  - `thumbnail_url`: Preview image URL
  - `category`: Model category (Furniture, Electronics, Accessories, etc.)
  - `is_active`: Visibility toggle (true/false)
  - `is_featured`: Featured status (true/false)
  - `created_at`: Creation timestamp
  - `updated_at`: Last update timestamp
  - `created_by`: User who created the model
  - `file_size`: File size in bytes
  - `file_type`: File format (glb, gltf, etc.)
  - `tags`: Array of tags for categorization
  - `metadata`: Additional JSON metadata

### 2. Admin Dashboard Features

#### Models Overview Page (`/admin/models`)

- **Statistics Cards**: Total, Active, Inactive, and Featured models count
- **Charts**:
  - Category distribution (Pie chart)
  - Active vs Inactive status (Bar chart)
  - Category breakdown list

#### Models Management Table

- **Search**: Filter models by name or description
- **Category Filter**: Filter by model category
- **Status Filter**: Filter by active/inactive/featured status
- **Actions**:
  - Toggle active/inactive status with switch
  - Toggle featured status with star icon
  - Edit model details
  - Delete models
  - Bulk operations

#### Real-time Updates

- Instant UI updates when toggling model status
- Toast notifications for user feedback
- Optimistic updates for better UX

### 3. API Endpoints

#### GET `/api/models`

- Fetch all models or filter by parameters
- Query parameters:
  - `active=true`: Get only active models
  - `category=Electronics`: Get models by category

#### PATCH `/api/models?id={model_id}`

- Update model status (active/featured)
- Request body: `{ "is_active": boolean, "is_featured": boolean }`

#### DELETE `/api/models?id={model_id}`

- Delete a specific model

#### GET `/api/models/stats`

- Get model statistics for dashboard

### 4. Database Setup

To set up the database, run the migration file:

```sql
-- Run the migration in Supabase SQL editor
-- File: supabase/migrations/001_create_models_table.sql
```

### 5. Usage Examples

#### Toggle Model Visibility

```typescript
import { ModelsService } from "@/lib/models-service";

// Make model visible/invisible
await ModelsService.toggleModelStatus("model-id", true);
```

#### Get Active Models for 3D Viewer

```typescript
// Get only active models to display in 3D viewer
const activeModels = await ModelsService.getActiveModels();
```

#### Filter by Category

```typescript
// Get all furniture models
const furnitureModels = await ModelsService.getModelsByCategory("Furniture");
```

### 6. Integration with 3D Viewer

The models management system is designed to integrate with your 3D viewer:

1. **Active Models Only**: The 3D viewer should only load models where `is_active = true`
2. **Featured Models**: Can be highlighted or shown first in the viewer
3. **Category Filtering**: Users can filter the 3D viewer by category
4. **Real-time Updates**: When an admin toggles a model's status, it should immediately reflect in the 3D viewer

### 7. Security

- **Row Level Security (RLS)**: Enabled on the models table
- **Policies**:
  - Anyone can view models
  - Only authenticated users can create models
  - Users can only edit/delete their own models
- **Admin Override**: Admins can manage all models regardless of creator

### 8. Performance Considerations

- **Indexes**: Created on frequently queried fields (`is_active`, `category`, `created_at`)
- **Pagination**: Implement pagination for large model collections
- **Caching**: Consider caching frequently accessed model lists
- **File Storage**: Store actual 3D model files in a CDN or cloud storage

### 9. Future Enhancements

- **Bulk Operations**: Select multiple models for batch operations
- **Model Upload**: Direct file upload interface in admin panel
- **Version Control**: Track model versions and changes
- **Analytics**: Track model usage and popularity
- **Preview**: 3D model preview directly in the admin table
- **Approval Workflow**: Require admin approval for new models
