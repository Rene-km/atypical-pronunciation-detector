import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtDecode, JwtPayload } from "jwt-decode";
 
// 1. Specify protected and public routes
const protectedRoutes = ['/home']
const publicRoutes = ['/login', '/register', '/']
 
export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)
 
 
  // 3. Decrypt the session from the cookie
  const token = (await cookies()).get('jwt')?.value || null;
  

  const session = token ? jwtDecode<JwtPayload>(token) : null
  //console.log(session)
  
 
//   4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (
    isProtectedRoute &&
    session &&
    Math.floor(Date.now() / 1000) > session.exp!
  ) {
    ((await cookies()).delete('jwt'));
    return NextResponse.redirect(new URL('/home', req.nextUrl));
  }
 
//   // 5. Redirect to /dashboard if the user is authenticated
  if (
    isPublicRoute &&
    session &&
    !req.nextUrl.pathname.startsWith('/home')
  ) {
    return NextResponse.redirect(new URL('/home', req.nextUrl))
  }
 
  return NextResponse.next()
}