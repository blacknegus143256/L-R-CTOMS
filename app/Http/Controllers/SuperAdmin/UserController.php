<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $cleanSearch = trim((string) $request->search);
            $searchTerm = '%' . $cleanSearch . '%';
            $startsWith = $cleanSearch . '%';

            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm);
            });

            // Prioritize exact matches and prefix matches
            $query->orderByRaw(
                "
                    CASE
                        WHEN name = ? THEN 1
                        WHEN email = ? THEN 2
                        WHEN name LIKE ? THEN 3
                        WHEN email LIKE ? THEN 4
                        ELSE 5
                    END ASC
                ",
                [$cleanSearch, $cleanSearch, $startsWith, $startsWith]
            );
        }

        $users = $query->orderBy('created_at', 'desc')
                       ->paginate(10)
                       ->withQueryString();

        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return redirect()->back();
    }

    public function toggleStatus(User $user)
    {
        // Prevent the super admin from suspending themselves
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot suspend your own account.');
        }

        $user->status = $user->status === 'active' ? 'suspended' : 'active';
        $user->save();

        return back()->with('success', "User account has been {$user->status}.");
    }
}