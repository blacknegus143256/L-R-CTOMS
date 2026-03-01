# Task: Update Fabric with Dropdown Categories

## Changes Made:

### 1. Database Migrations
- `database/migrations/2026_02_25_000001_add_fabric_categories.php` - Creates Fabric category with 12 predefined fabric types
- `database/migrations/2026_02_25_000002_add_item_name_to_shop_attributes.php` - Adds item_name column to shop_attributes pivot table
- `database/migrations/2026_02_26_000001_create_service_categories_table.php` - Creates service_categories table
- `database/migrations/2026_02_26_000002_add_service_category_id_to_services_table.php` - Adds foreign key to services table

### 2. Models
- `app/Models/ServiceCategory.php` - New model for service categories
- `app/Models/Service.php` - Added serviceCategory relationship and service_category_id to fillable

### 3. Controllers
- `app/Http/Controllers/Store/InventoryController.php` - Added serviceCategories to props, uses service_category_id, prevents attribute duplication, stores service_category_id value
- `app/Http/Controllers/Api/CategoryController.php` - Added service_categories to API response

### 4. Frontend - Store Admin
- `resources/js/pages/StoreAdmin/Inventory.jsx` - Uses serviceCategories from props, displays category names using helper function
- `resources/js/components/StoreAdmin/AddNewAttributeModal.jsx` - Added Fabric Category dropdown and Item Name input with placeholder "(eg. Blue Floral Pattern)"
- `resources/js/components/StoreAdmin/EditShopAttributeModal.jsx` - Added Item Name field

### 5. Seeders
- `database/seeders/ServiceCategorySeeder.php` - New seeder for service categories
- `database/seeders/AttributeSeeder.php` - Updated to use item_name
- `database/seeders/TailoringShopSeeder.php` - Updated to use service_category_id foreign keys
- `database/seeders/DatabaseSeeder.php` - Added ServiceCategorySeeder

## To apply changes, run:
```
php artisan migrate:fresh --seed
```

## Data Model:
- **Fabric Category** (Cotton, Silk, Linen, etc.) - stored in `attributes.name`
- **Item Name** (e.g., "Blue Floral Pattern") - stored in `shop_attributes.item_name`
- **Service Category** - stored in `service_categories` table, service_category stores the ID (foreign key)
- All 3 shops have different services and fabrics with different prices

## Key Features:
1. Attribute duplication prevention using `firstOrCreate` 
2. Service category uses ID as foreign key stored in service_category column
3. Fabric Category dropdown with 12 predefined categories
4. Item Name field with placeholder "(eg. Blue Floral Pattern)"
