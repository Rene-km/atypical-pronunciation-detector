import React from 'react'
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
  } from "@/components/ui/menubar"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation';



const PrivateNavbar = () => {
    const router = useRouter();
    const logout = async () => {

   
        await fetch('http://localhost:8000/api/logout/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
        })
    
        router.push('/login');
    }
  return (
    <div className=''>
  <Menubar className='flex flex-row min-h-16 sm:px-2 md:px-16 lg:px-40'>
<MenubarMenu>
  <Link href={'/home'}><MenubarTrigger><img src='/logo.png' className='h-8 mr-4'/></MenubarTrigger></Link> </MenubarMenu>
  <MenubarMenu>
  <Link href={'/home'}><MenubarTrigger>Home</MenubarTrigger></Link>
</MenubarMenu>
<Link href={'/practice'}>
<MenubarMenu>
  <MenubarTrigger>Practice</MenubarTrigger>
</MenubarMenu>
</Link>
<div className='flex justify-end w-full'>
<MenubarMenu><Link href={"/login"}><Button className='' onClick={logout}>Log Out</Button></Link></MenubarMenu>
</div>
</Menubar>
</div>
  )
}

export default PrivateNavbar
