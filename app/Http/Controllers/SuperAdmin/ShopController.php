<?php 

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShopController extends Controller {
    public function index() {
        return Inertia::render('SuperAdmin/ShopList', [
            'shops' => TailoringShop::all()
        ]);
    }
}