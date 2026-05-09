<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'fit_method_id')) {
                $table->foreignId('fit_method_id')->nullable()->constrained('fit_methods')->nullOnDelete();
            }
        });

        $hasMeasurementType = Schema::hasColumn('orders', 'measurement_type');
        $hasMeasurementPreference = Schema::hasColumn('orders', 'measurement_preference');
        $hasFitMethodId = Schema::hasColumn('orders', 'fit_method_id');

        if ($hasFitMethodId && ($hasMeasurementType || $hasMeasurementPreference)) {
            $fitMethodIdsByName = DB::table('fit_methods')->pluck('id', 'name');

            $selfMeasuredId = $fitMethodIdsByName['Self-Measured'] ?? null;
            $inShopFittingId = $fitMethodIdsByName['In-Shop Fitting'] ?? null;
            $noMeasurementRequiredId = $fitMethodIdsByName['No Measurement Required'] ?? null;

            $selectColumns = ['id'];
            if ($hasMeasurementType) {
                $selectColumns[] = 'measurement_type';
            }
            if ($hasMeasurementPreference) {
                $selectColumns[] = 'measurement_preference';
            }

            DB::table('orders')
                ->select($selectColumns)
                ->orderBy('id')
                ->chunkById(200, function ($orders) use (
                    $hasMeasurementType,
                    $hasMeasurementPreference,
                    $selfMeasuredId,
                    $inShopFittingId,
                    $noMeasurementRequiredId
                ) {
                    foreach ($orders as $order) {
                        $measurementType = $hasMeasurementType
                            ? strtolower(trim((string) ($order->measurement_type ?? '')))
                            : '';

                        $measurementPreference = $hasMeasurementPreference
                            ? strtolower(trim((string) ($order->measurement_preference ?? '')))
                            : '';

                        $fitMethodId = null;

                        if (
                            in_array($measurementType, ['profile', 'self_measured'], true)
                            || in_array($measurementPreference, ['profile', 'self_measured'], true)
                        ) {
                            $fitMethodId = $selfMeasuredId;
                        } elseif (
                            in_array($measurementType, ['scheduled', 'workshop_fitting', 'inperson'], true)
                            || in_array($measurementPreference, ['scheduled', 'workshop_fitting', 'inperson'], true)
                        ) {
                            $fitMethodId = $inShopFittingId;
                        } elseif (
                            $measurementType === 'none'
                            || $measurementPreference === 'none'
                            || ($measurementType === '' && $measurementPreference === '')
                        ) {
                            $fitMethodId = $noMeasurementRequiredId;
                        }

                        if ($fitMethodId !== null) {
                            DB::table('orders')
                                ->where('id', $order->id)
                                ->update(['fit_method_id' => $fitMethodId]);
                        }
                    }
                });
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'measurement_type')) {
                $table->dropColumn('measurement_type');
            }

            if (Schema::hasColumn('orders', 'measurement_preference')) {
                $table->dropColumn('measurement_preference');
            }

            if (Schema::hasColumn('orders', 'style_tag')) {
                $table->dropColumn('style_tag');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'measurement_type')) {
                $table->enum('measurement_type', ['profile', 'scheduled', 'none'])->default('none');
            }

            if (!Schema::hasColumn('orders', 'measurement_preference')) {
                $table->string('measurement_preference')->nullable();
            }

            if (!Schema::hasColumn('orders', 'style_tag')) {
                $table->string('style_tag')->nullable();
            }
        });

        if (Schema::hasColumn('orders', 'fit_method_id')) {
            $fitMethodsById = DB::table('fit_methods')->pluck('name', 'id');

            DB::table('orders')
                ->select(['id', 'fit_method_id'])
                ->orderBy('id')
                ->chunkById(200, function ($orders) use ($fitMethodsById) {
                    foreach ($orders as $order) {
                        $fitMethodName = strtolower(trim((string) ($fitMethodsById[$order->fit_method_id] ?? '')));

                        $measurementType = match ($fitMethodName) {
                            'self-measured' => 'profile',
                            'in-shop fitting' => 'scheduled',
                            'no measurement required' => 'none',
                            default => 'none',
                        };

                        DB::table('orders')
                            ->where('id', $order->id)
                            ->update([
                                'measurement_type' => $measurementType,
                                'measurement_preference' => $measurementType,
                            ]);
                    }
                });
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'fit_method_id')) {
                try {
                    $table->dropForeign(['fit_method_id']);
                } catch (\Throwable $e) {
                    // Ignore if the foreign key does not exist.
                }

                $table->dropColumn('fit_method_id');
            }
        });
    }
};
