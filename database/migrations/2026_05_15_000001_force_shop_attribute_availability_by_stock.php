<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // STEP 1: Create the function to enforce availability by stock
        DB::unprepared('
            CREATE OR REPLACE FUNCTION force_availability_by_stock()
            RETURNS trigger AS $$
            BEGIN
                -- If stock_quantity is null or zero or less, force is_available false
                IF NEW.stock_quantity IS NULL OR NEW.stock_quantity <= 0 THEN
                    NEW.is_available := false;
                ELSE
                    NEW.is_available := true;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');

        // STEP 2: Create the trigger that calls the function before insert or update
        DB::unprepared('
            CREATE TRIGGER shop_attributes_force_availability_before_insert
            BEFORE INSERT OR UPDATE ON shop_attributes
            FOR EACH ROW
            EXECUTE FUNCTION force_availability_by_stock();
        ');
    }

    public function down(): void
    {
        // Drop the trigger and the function (PostgreSQL)
        DB::unprepared('DROP TRIGGER IF EXISTS shop_attributes_force_availability_before_insert ON shop_attributes;');
        DB::unprepared('DROP FUNCTION IF EXISTS force_availability_by_stock();');
    }
};