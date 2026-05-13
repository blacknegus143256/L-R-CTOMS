<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('shop_attributes', 'stock_quantity')) {
            Schema::table('shop_attributes', function (Blueprint $table) {
                $table->decimal('stock_quantity', 8, 2)->default(0)->after('price');
            });
        }

        if (! Schema::hasColumn('order_items', 'shop_attribute_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('shop_attribute_id')->nullable()->after('order_id');
            });
        }

        if (Schema::hasColumn('order_items', 'attribute_type_id')) {
            DB::statement(
                'UPDATE order_items oi
                 JOIN orders o ON oi.order_id = o.id
                 JOIN shop_attributes sa ON sa.attribute_type_id = oi.attribute_type_id
                    AND sa.tailoring_shop_id = o.tailoring_shop_id
                 SET oi.shop_attribute_id = sa.id
                 WHERE oi.shop_attribute_id IS NULL'
            );
        }

        if (Schema::hasColumn('order_items', 'attribute_type_id')) {
            $connection = Schema::getConnection();
            $foreignKeyNames = [];

            if (method_exists($connection, 'getDoctrineSchemaManager')) {
                $schemaManager = $connection->getDoctrineSchemaManager();

                foreach ($schemaManager->listTableForeignKeys('order_items') as $foreignKey) {
                    if (in_array('attribute_type_id', $foreignKey->getLocalColumns(), true)) {
                        $foreignKeyNames[] = $foreignKey->getName();
                    }
                }
            }

            Schema::table('order_items', function (Blueprint $table) use ($foreignKeyNames) {
                foreach ($foreignKeyNames as $foreignKeyName) {
                    try {
                        $table->dropForeign($foreignKeyName);
                    } catch (\Throwable $e) {
                        // Ignore missing constraint names so the migration stays safe.
                    }
                }

                $table->dropColumn('attribute_type_id');
            });
        }

        if (Schema::hasColumn('order_items', 'shop_attribute_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->foreign('shop_attribute_id')
                    ->references('id')
                    ->on('shop_attributes')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('order_items', 'attribute_type_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('attribute_type_id')->nullable()->after('order_id');
            });

            DB::statement(
                'UPDATE order_items oi
                 JOIN shop_attributes sa ON oi.shop_attribute_id = sa.id
                 SET oi.attribute_type_id = sa.attribute_type_id
                 WHERE oi.attribute_type_id IS NULL'
            );

            Schema::table('order_items', function (Blueprint $table) {
                $table->foreign('attribute_type_id')
                    ->references('id')
                    ->on('attribute_types')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasColumn('order_items', 'shop_attribute_id')) {
            $connection = Schema::getConnection();
            $foreignKeyNames = [];

            if (method_exists($connection, 'getDoctrineSchemaManager')) {
                $schemaManager = $connection->getDoctrineSchemaManager();

                foreach ($schemaManager->listTableForeignKeys('order_items') as $foreignKey) {
                    if (in_array('shop_attribute_id', $foreignKey->getLocalColumns(), true)) {
                        $foreignKeyNames[] = $foreignKey->getName();
                    }
                }
            }

            Schema::table('order_items', function (Blueprint $table) use ($foreignKeyNames) {
                foreach ($foreignKeyNames as $foreignKeyName) {
                    try {
                        $table->dropForeign($foreignKeyName);
                    } catch (\Throwable $e) {
                        // Ignore missing constraint names so rollback remains safe.
                    }
                }

                $table->dropColumn('shop_attribute_id');
            });
        }

        if (Schema::hasColumn('shop_attributes', 'stock_quantity')) {
            Schema::table('shop_attributes', function (Blueprint $table) {
                $table->dropColumn('stock_quantity');
            });
        }
    }
};