<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS shop_attributes_force_availability_before_insert ON shop_attributes;');
        DB::unprepared('DROP TRIGGER IF EXISTS shop_attributes_force_availability_before_update ON shop_attributes;');

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER shop_attributes_force_availability_before_insert
            BEFORE INSERT ON shop_attributes
            FOR EACH ROW
            BEGIN
                IF NEW.stock_quantity IS NULL OR NEW.stock_quantity <= 0 THEN
                    SET NEW.is_available = 0;
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER shop_attributes_force_availability_before_update
            BEFORE UPDATE ON shop_attributes
            FOR EACH ROW
            BEGIN
                IF NEW.stock_quantity IS NULL OR NEW.stock_quantity <= 0 THEN
                    SET NEW.is_available = 0;
                END IF;
            END
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS shop_attributes_force_availability_before_insert ON shop_attributes;');
        DB::unprepared('DROP TRIGGER IF EXISTS shop_attributes_force_availability_before_update ON shop_attributes;');
    }
};