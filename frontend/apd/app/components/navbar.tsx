'use client'

import React from 'react'
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
  } from "@/components/ui/menubar"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import PrivateNavbar from './PrivateNavbar'

const publicNavbar = (
  <div className=''>
  <Menubar className='flex flex-row min-h-16 sm:px-2 md:px-16 lg:px-40'>
<MenubarMenu>
  <Link href={'/'}><MenubarTrigger><img src='/logo.png' className='h-8 mr-4'/></MenubarTrigger></Link> </MenubarMenu>
<div className='flex justify-end w-full'>
<MenubarMenu><Link href={"/login"}><Button className=''>Log in</Button></Link></MenubarMenu>
</div>
</Menubar>
</div>
)

const publicRoutes = ['/login', '/register', '/']


const Navbar = () => {

  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname)
  
  if (isPublicRoute) {
    return publicNavbar
  } else {
    return <PrivateNavbar />
  }

 
}

export default Navbar
