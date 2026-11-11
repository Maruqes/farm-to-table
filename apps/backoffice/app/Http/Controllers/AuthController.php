<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function show()
    {
        return view('login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($data['email']))->where('role', 'admin')->first();

        // password_verify, not Hash::check: the API hashes with node bcrypt ($2b$), which Laravel's hasher rejects.
        if (! $user || ! password_verify($data['password'], (string) $user->passwordHash)) {
            return back()
                ->withErrors(['email' => 'Wrong email or password, or this account is not an admin.'])
                ->onlyInput('email');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
